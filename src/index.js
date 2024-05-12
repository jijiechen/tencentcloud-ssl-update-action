const core = require("@actions/core");
const SSL = require("./cloud/ssl");
const CDN = require("./cloud/cdn");
const APIGateway = require("./cloud/apigateway");
const CLB = require("./cloud/clb");
const { readConfig, readCertKey } = require("./utils");
const supportedServiceTypes = ["cdn", "apigateway", "clb"];

async function main() {
  let run_id;
  const contextString = core.getInput('github_context');
  if (contextString) {
    const context = JSON.parse(contextString);
    run_id = context.run_id;
  }

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
    console.log(`cloud service type ${config.cloud_service_type} not supported.`)
    process.exit(1);
  }
  
  try{
    const ck = readCertKey(config);
    const certUploader = new SSL(config, run_id);
    const certID = certUploader.uploadCertificate(config.domain, ck.cert, ck.key);
    if (!certID){
      console.log("Empty certificateID got from Tencent Cloud");
      process.exit(1);
    }

    switch (config.cloud_service_type){
      case "cdn":
        const cdnOperator = new CDN(config, run_id);  
        await cdnOperator.process(config.domain, certID);
        break;
        case "clb":
        const clbOperator = new CLB(config, run_id);  
        await clbOperator.process(config.domain, certID);
        break;
        case "apigateway":
        const gwOperator = new APIGateway(config, run_id);  
        await gwOperator.process(config.domain, certID);
        break;
    }

    let domainMsg = ''
    if (config.domain){
      domainMsg = `for domain '${config.domain}' `
    }
    console.log(`The certificate updating to '${config.cloud_service_type}' ${domainMsg}was successful.`);
  }
  catch(ex){
    console.log('unexpected error: ' + ex.message);
    console.log(ex.stack);
    process.exit(1);
  }
}

main();
