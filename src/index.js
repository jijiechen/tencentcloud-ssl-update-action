const core = require("@actions/core");
const SSL = require("./cloud/ssl");
const CDN = require("./cloud/cdn");
const APIGateway = require("./cloud/apigateway");
const CLB = require("./cloud/clb");
const { readConfig, readCertKey } = require("./utils");
const supportedServiceTypes = ["cdn", "apigateway", "clb"];

async function main() {
  // 读取配置
  const config = readConfig(
    new Set([
      "cloud_service_type",
      "path_certificate",
      "path_private_key",
      ...SSL.getInput(),
      ...CDN.getInput(),
      ...CLB.getInput(),
      ...APIGateway.getInput(),
    ])
  );

  if (supportedServiceTypes.indexOf(config.cloud_service_type) === -1){
    core.info(`cloud service type ${config.cloud_service_type} not supported.`);
    core.setFailed();
    process.exit(1);
  }
  
  try{
    const ck = readCertKey(config);
    const certUploader = new SSL(config);
    const certID = await certUploader.uploadCertificate(config.domain, ck.cert, ck.key);
    if (!certID){
      core.info("Empty certificateID got from Tencent Cloud");
      core.setFailed();
      process.exit(1);
    }
    
    core.setOutput("certificateID", certID);

    switch (config.cloud_service_type){
      case "cdn":
        const cdnOperator = new CDN(config);  
        await cdnOperator.process(config.domain, certID);
        break;
        case "clb":
        const clbOperator = new CLB(config);  
        await clbOperator.process(config.domain, certID);
        break;
        case "apigateway":
        const gwOperator = new APIGateway(config);  
        await gwOperator.process(config.domain, certID);
        break;
    }

    let domainMsg = ''
    if (config.domain){
      domainMsg = `for domain '${config.domain}' `
    }
    core.info(`The certificate updating to '${config.cloud_service_type}' ${domainMsg}was successful.`);
  }
  catch(ex){
    core.info('unexpected error: ' + ex.message);
    core.info(ex.stack);
    core.setFailed();
    process.exit(1);
  }
}

main();


// todo: support vod, live, ddos, waf. COS?