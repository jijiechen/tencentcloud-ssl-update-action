const core = require("@actions/core");
const SSL = require("./ssl");
const CDN = require("./cdn");
const APIGateway = require("./apigateway");
const { readConfig, readCertKey } = require("./utils");
const supportedServiceTypes = ["cdn", "apigateway"]

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
      "domain_name",
      "path_certificate",
      "path_private_key",
      ...SSL.getInput(),
      ...CDN.getInput(),
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
    const certID = certUploader.uploadCertificate(config.domain_name, ck.cert, ck.key);
    if (!certID){
      console.log("Empty certificateID got from Tencent Cloud");
      process.exit(1);
    }

    switch (config.cloud_service_type){
      case "cdn":
        const cdnOperator = new CDN(config, run_id);  
        await cdnOperator.process(config.domain_name, certID);
        break;
        case "apigateway":
        const gwOperator = new APIGateway(config, run_id);  
        await gwOperator.process(config.domain_name, certID);
        break;
    }

    console.log(`The certificate updating to '${config.cloud_service_type}' for domain '${config.domain_name}' was successful.`);
  }
  catch(ex){
    console.log('unexpected error: ' + ex.message);
    console.log(ex.stack);
    process.exit(1);
  }
}

main();
