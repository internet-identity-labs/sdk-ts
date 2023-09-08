import { ethers } from 'ethers';
import { NFIDBaseProvider } from './provider';

export interface NFIDInpageProviderObservable {
  chainId: string | null;
  provider: ethers.providers.JsonRpcProvider;
  selectedAddress?: string;
}

const supportedChainIds = new Set([
  '0x01', // Ethereum Mainnet
  '0x05', // Ethereum Goerli Testnet
  '0x89', // Polygon Mainnet
  '0x013881', // Polygon Mumbai Testnet
]);

export class NFIDEthInpageProvider extends NFIDBaseProvider {
  chainId: string;
  provider: ethers.providers.JsonRpcProvider;

  constructor(chainId: number, provider: ethers.providers.JsonRpcProvider) {
    super();
    const chainIdHex = ethers.utils.hexlify(chainId);
    this.checkChain(chainIdHex);
    this.chainId = chainIdHex;
    this.provider = provider;
  }

  async request({
    method,
    params,
  }: {
    method: string;
    params: Array<any>;
  }): Promise<any> {
    console.debug('NFIDInpageProvider.request', { method, params });
    switch (method) {
      case 'eth_signTypedData_v4':
      case 'eth_sendTransaction':
      case 'personal_sign':
      case 'eth_accounts': {
        throw new Error('Method is not implemented');
        // const meta = {
        //   chainId: this.chainId,
        //   rpcUrl: this.provider.connection.url,
        // };
        // return this._execRequest(method, params, meta);
      }
      default: {
        console.debug('NFIDInpageProvider.request default', { method, params });
        return await this.provider.send(method, params);
      }
    }
  }

  private checkChain(chainId: string): void {
    if (!supportedChainIds.has(chainId)) {
      throw Error(`The chainid ${chainId} is not supported.`);
    }
  }
}
