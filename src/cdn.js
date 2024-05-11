const CDN_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/cdn");
const path = require("path");

const Client = CDN_SDK.cdn.v20180606.Client;

class CDN {
  static getInput() {
    return ["secret_id", "secret_key", "cdn_prefix"];
  }

  constructor(inputs) {
    if (!inputs.cdn_prefix) {
      return;
    }

    const clientConfig = {
      credential: {
        secretId: inputs.secret_id,
        secretKey: inputs.secret_key,
      },
      profile: {
        language: "en-US",
      },
    };

    this.cdn = new Client(clientConfig);
    this.cdnPrefix = inputs.cdn_prefix;
    if (this.cdnPrefix[this.cdnPrefix.length - 1] !== "/") {
      this.cdnPrefix += "/";
    }
  }

  async process(domain_name, certificate, private_key) {
    if (!this.cdnPrefix) {
      return;
    }

    cdnResp = await this.cdn.DescribeDomainsConfig({"Filters":[{"Name":"domain","Value":[domain_name]}]});
    
    if (!cdnResp.Response || !cdnResp.Response.Domains){
      console.log('Invalid response from Tencent Cloud:');
      console.log(JSON.stringify(cdnResp));
      return;
    }

    if (cdnResp.Response.TotalNumber !== 1){
      console.log(`Skipping updating ${domain_name}: There are ${cdnResp} cdn matched the domain.`);
      return;
    }

    cdnCfg = cdnResp.Response.Domains[0];
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
    
    now = new Date()
    cdnCfg.Https.CertInfo.Message = `updated by GHA - utc ${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}`;
    cdnCfg.Https.CertInfo.Certificate = certificate.toString('base64');
    cdnCfg.Https.CertInfo.PrivateKey = private_key.toString('base64');

    console.log(`Updating certificate for domain ${domain_name}...`);
    updatedResponse = await this.cdn.UpdateDomainConfig(cdnCfg)
    console.log(JSON.stringify(updatedResponse));
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
