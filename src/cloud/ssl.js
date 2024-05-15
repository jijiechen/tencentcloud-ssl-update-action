// https://cloud.tencent.com/document/api/400/41665

const core = require("@actions/core");
const SSL_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/ssl");
const Client = SSL_SDK.ssl.v20191205.Client;

class SSL {
  static getInput() {
    return ["secret_id", "secret_key"];
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

    this.sslClient = new Client(clientConfig);
  }

  async uploadCertificate(domain, certificate, privateKey) {
    const now = new Date()

    core.info(`Uploading certificate for domain '${domain}'...`);
    const uploadReq = {
      CertificatePublicKey: certificate.toString(),
      CertificatePrivateKey: privateKey.toString(),
      CertificateType: 'SVR',
      Alias: `${domain} @utc ${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}`,
    };
    core.debug('Uploading certificate:');
    core.debug(JSON.stringify(uploadReq));
    const sslResponse = await this.sslClient.UploadCertificate(uploadReq);
    
    core.debug("Got response from tencent cloud:");
    core.debug(JSON.stringify(sslResponse));
    
    if (!sslResponse.CertificateId){
      core.info('Invalid response from Tencent Cloud:');
      core.info(JSON.stringify(sslResponse));
      core.setFailed();
      process.exit(1);
    }

    const certId = sslResponse.CertificateId
    core.info(`Uploading was successful. Certificate ID: '${certId}'`);
    return certId;
  }
}

module.exports = SSL;
