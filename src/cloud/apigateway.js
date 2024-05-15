const core = require("@actions/core");
const GW_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/apigateway");
const Client = GW_SDK.apigateway.v20180808.Client;

class APIGateway {
  static getInput() {
    return ["secret_id", "secret_key", "region", "apigw_service_id", "domain"];
  }

  constructor(inputs) {
    if (!inputs.region || !inputs.apigw_service_id){
      core.info("These inputs must not be empty to update certificate for gateway api: region, apigw_service_id");
      core.setFailed();
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
    const describeReq = {
      ServiceId: this.serviceId,
    };
    core.debug('Getting information for api gateway service ' + this.serviceId);
    core.debug(JSON.stringify(describeReq));
    const subDomainResp = await this.gwClient.DescribeServiceSubDomains(describeReq);
    
    core.debug('Got response from tencent cloud:');
    core.debug(JSON.stringify(subDomainResp));

    if (!subDomainResp.Result){
      core.info('Invalid response from Tencent Cloud:');
      core.info(JSON.stringify(subDomainResp));
      core.setFailed();
      process.exit(1);
    }
    
    const targetSubDomain = subDomainResp.Result.DomainSet.filter(x => x.DomainName === domain)[0];
    if (!targetSubDomain){
      core.info(`Domain name ${domain} is not being used in api gateway service ${this.serviceId}`);
      core.setFailed();
      process.exit(1);
    }

    let portMapping;
    if (!targetSubDomain.IsDefaultMapping){
      const pmReq = {
        ServiceId: this.serviceId,
        SubDomain: domain,
      };
      core.debug('There is custom post mapping, getting port mapping information:');
      core.debug(JSON.stringify(pmReq));
      const pmResp = await this.gwClient.DescribeServiceSubDomainMappings(pmReq);
      
      core.debug('Got response from tencent cloud:');
      core.debug(JSON.stringify(pmResp));
      if (!pmResp.Result){
        core.info('Invalid response from Tencent Cloud:');
        core.info(JSON.stringify(pmResp));
        core.setFailed();
        process.exit(1);
      }
      
      portMapping = pmResp.Result.PathMappingSet;
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
    if (!targetSubDomain.IsDefaultMapping){
      req.PathMappingSet = portMapping;
    }

    core.info(`Updating apigateway for domain ${domain}, certID: ${certID}......`);
    core.debug(JSON.stringify(req));

    const updateResp = await this.gwClient.ModifySubDomain(req);
    core.debug('Got response from tencent cloud:');
    core.info(JSON.stringify(updateResp));
  }
}

module.exports = APIGateway;