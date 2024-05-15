const core = require("@actions/core");
const fs = require("fs");

function readCertKey(config){
  if (!config.path_certificate || !config.path_private_key){
    core.info(`path_certificate and path_private_key must not be empty`);
    core.setFailed();
    process.exit(1);
  }

  if(!fs.existsSync(config.path_certificate)){
    core.info(`certificate file ${config.path_certificate} does not exist`);
    core.setFailed();
    process.exit(1);
  }
  if(!fs.existsSync(config.path_private_key)){
    core.info(`private key file ${config.path_private_key} does not exist`);
    core.setFailed();
    process.exit(1);
  }

  cert = fs.readFileSync(config.path_certificate)
  key = fs.readFileSync(config.path_private_key)

  return { cert, key }
}

function readConfig(fields) {
  // 合并数组项
  const result = {};
  fields.forEach((k) => {
    if (typeof result[k] === "undefined") {
      result[k] = core.getInput(k);
    }
  });
  return result;
}

module.exports = {
  readConfig,
  readCertKey,
};
