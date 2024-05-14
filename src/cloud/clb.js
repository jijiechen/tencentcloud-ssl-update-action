//  https://cloud.tencent.com/document/api/214/36907

const CLB_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/clb");
const Client = CLB_SDK.clb.v20180317.Client;

class CLB {
  static getInput() {
    return ["secret_id", "secret_key", "clb_id", "clb_port", "clb_portocol"];
  }

  constructor(inputs) {
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

    this.clbClient = new Client(clientConfig);
    this.clbID = inputs.clb_id;
    this.clbPort = inputs.clb_port;
    if (typeof inputs.clb_port === "string"){
      this.clbPort = parseInt(inputs.clb_port);
    }
    this.clbProtocol = inputs.clb_portocol;
  }

  async process(_, certID) {
    const clbResp = await this.clbClient.DescribeListeners({
        LoadBalancerId: this.clbID, 
        Port: this.clbPort, 
        Protocol: this.clbProtocol, 
    });
    
    if (!clbResp.Listeners){
      console.log('Invalid response from Tencent Cloud:');
      console.log(JSON.stringify(clbResp));
      process.exit(1);
    }
    
    if (clbResp.TotalCount !== 1){
      console.log(`Skipping updating clb ${this.clbID} on port ${this.clbPort}: There are ${clbResp.TotalCount} listeners match the clb query.`);
      return;
    }

    const targetListner = clbResp.Listeners[0];
    if(!targetListner.Certificate){
        console.log(`Could not update certificate for clb ${this.clbID} on port ${this.clbPort}, it does not have an existing certificate.`);
        process.exit(1);
    }

    console.log(`Updating certificate for clb ${this.clbID} on port ${this.clbPort}...`);
    const updateResp = await this.clbClient.ModifyListener({
      LoadBalancerId: this.clbID,
      ListenerId: targetListner.ListenerId,
      Certificate: {
        SSLMode: targetListner.Certificate.SSLMode,
        CertId: certID,
      }
    });
    console.log(JSON.stringify(updateResp));
  }
}

module.exports = CLB;
