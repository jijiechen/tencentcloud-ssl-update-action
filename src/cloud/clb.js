//  https://cloud.tencent.com/document/api/214/36907

const core = require("@actions/core");
const CLB_SDK = require("tencentcloud-sdk-nodejs/tencentcloud/services/clb");
const Client = CLB_SDK.clb.v20180317.Client;

class CLB {
  static getInput() {
    return ["secret_id", "secret_key", "clb_id", "clb_port", "clb_protocol"];
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
    this.clbProtocol = inputs.clb_protocol;
  }

  async process(_, certID) {
    const describeReq = {
      LoadBalancerId: this.clbID, 
      Port: this.clbPort, 
      Protocol: this.clbProtocol, 
    };
    core.debug('Getting listener information from clb ' + this.clbID + " on port " + this.clbPort);
    core.debug(JSON.stringify(describeReq));
    
    const clbResp = await this.clbClient.DescribeListeners(describeReq);
    
    core.debug('Got response from tencent cloud:');
    core.debug(JSON.stringify(clbResp));
    if (!clbResp.Listeners){
      core.info('Invalid response from Tencent Cloud:');
      core.info(JSON.stringify(clbResp));
      process.exit(1);
    }
    
    if (clbResp.TotalCount !== 1){
      core.info(`Skipping updating clb ${this.clbID} on port ${this.clbPort}: There are ${clbResp.TotalCount} listeners match the clb query.`);
      return;
    }
    
    const targetListner = clbResp.Listeners[0];
    if(!targetListner.Certificate){
      core.info(`Could not update certificate for clb ${this.clbID} on port ${this.clbPort}, it does not have an existing certificate.`);
      process.exit(1);
    }

    const modifyReq = {
      LoadBalancerId: this.clbID,
      ListenerId: targetListner.ListenerId,
      Certificate: {
        SSLMode: targetListner.Certificate.SSLMode,
        CertId: certID,
      }
    };
    core.info(`Updating certificate for clb ${this.clbID} on port ${this.clbPort}...`);
    core.debug(JSON.stringify(modifyReq));
    const updateResp = await this.clbClient.ModifyListener(modifyReq);
    core.debug('Got response from tencent cloud:');
    core.info(JSON.stringify(updateResp));
  }
}

module.exports = CLB;
