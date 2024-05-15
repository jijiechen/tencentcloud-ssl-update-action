const core = require("@actions/core");
const CDN_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/cdn");
const Client = CDN_SDK.cdn.v20180606.Client;

class CDN {
  static getInput() {
    return ["secret_id", "secret_key", "domain"];
  }

  constructor(inputs) {
    const clientConfig = {
      credential: {
        secretId: inputs.secret_id,
        secretKey: inputs.secret_key,
      },
      profile: {
        language: "en-US",
      },
    };

    this.cdnClient = new Client(clientConfig);
  }

  async process(domain, certID) {
    const describeReq = {Filters: [{ Name:"domain", Value:[domain]}] };
    core.debug('Getting existing domain config for cdn domain ' + domain);
    core.debug(JSON.stringify(describeReq));
    
    const cdnResp = await this.cdnClient.DescribeDomainsConfig(describeReq);
    
    core.debug('Got response from tencent cloud:');
    core.debug(JSON.stringify(cdnResp));
    if (!cdnResp.Domains){
      core.info('Invalid response from Tencent Cloud:');
      core.info(JSON.stringify(cdnResp));
      process.exit(1);
    }

    if (cdnResp.TotalNumber !== 1){
      core.info(`Skipping updating ${domain}: There are ${cdnResp.TotalNumber} cdn match the domain.`);
      return;
    }

    const cdnCfg = cdnResp.Domains[0];
    cdnCfg.HttpsBilling = { Switch: "on" };
    if (!cdnCfg.Https){
      cdnCfg.Https = defaultHttpsSettings;
    }
    
    if(!!cdnCfg.Https.SslStatus && cdnCfg.Https.SslStatus !== "closed"){
      cdnCfg.Https.CertInfo.CertId = null;
      cdnCfg.Https.CertInfo.CertName = null;
      cdnCfg.Https.CertInfo.DeployTime = null;
      cdnCfg.Https.CertInfo.ExpireTime = null;
      cdnCfg.Https.CertInfo.Message = null;
      cdnCfg.Https.CertInfo.From = null;
    }
    
    const now = new Date()
    cdnCfg.Https.CertInfo.Message = `updated by GHA - utc ${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}`;
    cdnCfg.Https.CertInfo.CertId = certID;
    const notSupportedFields = [
      'Advance',           'AdvanceSet',
      'AppId',             'Cname',
      'Compatibility',     'CreateTime',
      'Disable',           'EdgeOne',
      'ImageOptimization', 'Ipv6',
      'Md5Compare',        'MigrateEo',
      'ParentHost',        'Product',
      'Readonly',          'ResourceId',
      'ResourceTags',      'RuleEngine',
      'SCdnIpFilter',      'SaaSSSLCertChallenge',
      'SecurityConfig',    'ShareCache',
      'SourceLimit',       'Status',
      'Tag',               'UpdateTime'
    ];
    notSupportedFields.forEach(k =>{
      delete(cdnCfg[k])
    });

    core.debug('Getting existing domain config for cdn domain ' + domain);
    core.debug(JSON.stringify(cdnCfg));
    const updateResp = await this.cdnClient.UpdateDomainConfig(cdnCfg);
    core.debug('Got response from tencent cloud:');
    core.info(JSON.stringify(updateResp));
  }
}

function defaultHttpsSettings(){
  return {
    CertInfo: {
      CertId: null,
      CertName: null,
      Certificate: null,
      DeployTime: '',
      ExpireTime: '',
      From: '',
      Message: '',
      PrivateKey: null
    },
    ClientCertInfo: {
      CertName: null,
      Certificate: null,
      DeployTime: null,
      ExpireTime: null
    },
    Hsts: { IncludeSubDomains: 'off', MaxAge: 0, Switch: 'off' },
    Http2: 'on',
    OcspStapling: 'off',
    Spdy: 'off',
    Switch: 'on',
    TlsVersion: [ 'TLSv1', 'TLSv1.1', 'TLSv1.2' ],
    VerifyClient: 'off'
  }
}

module.exports = CDN;
