// https://cloud.tencent.com/document/api/400/41665

const SSL_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/ssl");
const Client = SSL_SDK.ssl.v20191205.Client;

class SSL {
  static getInput() {
    return ["secret_id", "secret_key"];
  }

  constructor(inputs, runId) {    
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
    this.runId = runId;
  }

  async uploadCertificate(domain, certificate, privateKey) {
    const now = new Date()

    console.log(`Uploading certificate for domain '${domain}'...`);
    const sslResponse = await this.sslClient.UploadCertificate({
        CertificatePublicKey: certificate.toString('base64'),
        CertificatePrivateKey: privateKey.toString('base64'),
        CertificateType: 'SVR',
        Alias: `${domain} @utc ${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()} GHA#${this.runId}`,
    });
    
    if (!sslResponse.Response || !sslResponse.Response.CertificateId){
      console.log('Invalid response from Tencent Cloud:');
      console.log(JSON.stringify(sslResponse));
      process.exit(1);
    }

    const certId = sslResponse.Response.CertificateId
    console.log(`Uploading was successful. Certificate ID: '${certId}'`);
    return certId;
  }
}

module.exports = SSL;
