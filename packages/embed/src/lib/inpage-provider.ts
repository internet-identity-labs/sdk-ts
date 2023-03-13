import { ethers } from 'ethers';
import { deepCopy } from '@ethersproject/properties';
import { hideIframe, showIframe } from './iframe/mount-iframe';
import { request } from './postmsg-rpc';
import { getIframe } from './iframe/get-iframe';

export interface NFIDInpageProviderObservable {
  chainId: string | null;
  provider: ethers.providers.JsonRpcProvider;
  selectedAddress?: string;
}

export class NFIDInpageProvider extends ethers.providers.AlchemyProvider {
  chainId = '0x5';
  provider = this;

  constructor(network: string, apiKey: string) {
    super(network, apiKey);
  }

  async request({
    method,
    params,
  }: {
    method: string;
    params: Array<any>;
  }): Promise<any> {
    this.emit('debug', {
      action: 'request',
      request: deepCopy(request),
      provider: this,
    });

    console.debug('NFIDInpageProvider.request', { method, params });
    switch (method) {
      case 'eth_signTypedData_v4':
      case 'eth_sendTransaction':
      case 'eth_accounts': {
        const iframe = getIframe();
        showIframe();
        return await request(iframe, { method, params }).then(
          (response: any) => {
            console.debug('NFIDInpageProvider.request eth_accounts', {
              response,
            });
            hideIframe();
            if (response.error) {
              const error = new Error(response.error.message);
              this.emit('debug', {
                action: 'response',
                error,
                request,
                provider: this,
              });
              throw error;
            }
            this.emit('debug', {
              action: 'response',
              request: request,
              response: response.result,
              provider: this,
            });
            return response.result;
          }
        );
      }

      default: {
        console.debug('NFIDInpageProvider.request default', { method, params });
        return await this.send(method, params);
      }
    }
  }
}
