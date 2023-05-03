import { ethers } from 'ethers';
import { NFIDInpageProvider } from './inpage-provider';

describe('inpage-provider', () => {
  const nfidInpageProvider = new NFIDInpageProvider(5, undefined as any as ethers.providers.JsonRpcProvider);
  it('should return chainId', () => {
    expect(nfidInpageProvider.chainId).toEqual('0x05');
  });
});
