import * as uuid from 'uuid';
import { ethers } from 'ethers';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { RPCMessage, request } from './postmsg-rpc';
import { getIframe } from './iframe/get-iframe';

export interface NFIDInpageProviderObservable {
  chainId: string | null;
  provider: ethers.providers.JsonRpcProvider;
  selectedAddress?: string;
}

type RPCRequest = {
  method: string;
  params: Array<any>;
};

export class NFIDInpageProvider extends ethers.providers.JsonRpcProvider {
  chainId = '0x5';
  provider = this;
  private _messageQueue: RPCMessage[] = [];

  constructor() {
    super(
      'https://eth-goerli.g.alchemy.com/v2/KII7f84ZxFDWMdnm_CNVW5hI8NfbnFhZ'
    );
  }

  get messageQueue(): RPCMessage[] {
    return this._messageQueue;
  }

  private _prepareRPCRequest({ method, params }: RPCRequest): RPCMessage {
    const requestId = uuid.v4();
    const req = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };
    console.debug('request', { ...req });
    return req;
  }

  private _queueRPCMessage(req: RPCMessage) {
    this._messageQueue.push(req);
    this._handleIFrameVisibility();
  }

  private _popRPCMessage(id: string) {
    this._messageQueue = this._messageQueue.filter((req) => req.id !== id);
    this._handleIFrameVisibility();
  }

  private _handleIFrameVisibility() {
    this.messageQueue.length > 0 ? showIframe() : hideIframe();
  }

  async request({ method, params }: RPCRequest): Promise<any> {
    console.debug('NFIDInpageProvider.request', { method, params });
    switch (method) {
      case 'eth_signTypedData_v4':
      case 'eth_sendTransaction':
      case 'personal_sign':
      case 'eth_accounts': {
        const req = this._prepareRPCRequest({ method, params });
        this._queueRPCMessage(req);

        const iframe = getIframe();
        return await request(iframe, req).then((response: any) => {
          this._popRPCMessage(req.id);
          console.debug('NFIDInpageProvider.request eth_accounts', {
            response,
          });
          if (response.error) throw new Error(response.error.message);
          return response.result;
        });
      }

      default: {
        console.debug('NFIDInpageProvider.request default', { method, params });
        return await this.send(method, params);
      }
    }
  }
}
