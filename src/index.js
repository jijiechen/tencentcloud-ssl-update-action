const SSL = require("./ssl");
const CDN = require("./cdn");
const APIGateway = require("./apigateway");
const { readConfig, readCertKey } = require("./utils");
const supportedServiceTypes = ["cdn", "apigateway"]

async function main() {
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
    const certID = SSL.uploadCertificate(domain_name, ck.cert, ck.key);

    switch (config.cloud_service_type){
      case "cdn":
        const cdnOperator = new CDN(config);  
        await cdnOperator.process(config.domain_name, certID);
        break;
        case "apigateway":
        const gwOperator = new APIGateway(config);  
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
