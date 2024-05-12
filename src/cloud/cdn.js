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
    const cdnResp = await this.cdnClient.DescribeDomainsConfig({Filters: [{ Name:"domain", Value:[domain]}] });
    
    if (!cdnResp.Response || !cdnResp.Response.Domains){
      console.log('Invalid response from Tencent Cloud:');
      console.log(JSON.stringify(cdnResp));
      return;
    }

    if (cdnResp.Response.TotalNumber !== 1){
      console.log(`Skipping updating ${domain}: There are ${cdnResp.Response.TotalNumber} cdn match the domain.`);
      return;
    }

    const cdnCfg = cdnResp.Response.Domains[0];
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

    console.log(`Updating certificate for domain ${domain}...`);
    updateResp = await this.cdnClient.UpdateDomainConfig(cdnCfg);
    console.log(JSON.stringify(updateResp));
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
