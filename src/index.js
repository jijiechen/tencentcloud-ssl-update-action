const CDN = require("./cdn");
const { readConfig, ensureFilesExist } = require("./utils");

async function main() {
  // 读取配置
  const config = readConfig(
    new Set([
      "domain_name",
      "path_certificate",
      "path_private_key",
      ...CDN.getInput(),
    ])
  );

  ck = readCertKey(config);
  
  const cdnOperator = new CDN(config);
  
  await cdnOperator.process(config.domain_name, ck.cert, ck.key);
}

main();
