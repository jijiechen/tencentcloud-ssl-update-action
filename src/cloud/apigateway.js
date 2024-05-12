const GW_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/apigateway");
const Client = GW_SDK.apigateway.v20180808.Client;

class APIGateway {
  static getInput() {
    return ["secret_id", "secret_key", "region", "apigw_service_id", "domain"];
  }

  constructor(inputs) {
    if (!inputs.region || !inputs.apigw_service_id){
      console.log("These inputs must not be empty to update certificate for gateway api: region, apigw_service_id");
      process.exit(1);
    }

    const clientConfig = {
      credential: {
        secretId: inputs.secret_id,
        secretKey: inputs.secret_key,
      },
      region: inputs.region,
      profile: {
        language: "en-US",
      },
    };

    this.gwClient = new Client(clientConfig);
    this.serviceId = inputs.apigw_service_id;
  }

  async process(domain, certID) {
    const subDomainResp = await this.gwClient.DescribeServiceSubDomains(this.serviceId);
    if (!subDomainResp.Response || !subDomainResp.Response.Result){
      console.log('Invalid response from Tencent Cloud:');
      console.log(JSON.stringify(subDomainResp));
      process.exit(1);
    }
    
    const targetSubDomain = subDomainResp.Response.Result.DomainSet.filter(x => x.DomainName === domain);
    if (!targetSubDomain){
      console.log(`Domain name ${domain} is not being used in api gateway service ${this.serviceId}`);
      process.exit(1);
    }
    
    const req = {
      ServiceId: this.serviceId,
      IsDefaultMapping: targetSubDomain.IsDefaultMapping,
      SubDomain: domain,
      CertificateId: certID,
      Protocol: targetSubDomain.Protocol,
      NetType:  targetSubDomain.NetType,
      IsForcedHttps: targetSubDomain.IsForcedHttps,
    }

    console.log(`Updating certificate for domain ${domain}...`);
    const updateResp = await this.gwClient.ModifySubDomain(req);
    console.log(JSON.stringify(updateResp));
  }
}

module.exports = APIGateway;