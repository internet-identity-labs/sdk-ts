import { ethers } from 'ethers';
import { NFIDEthInpageProvider } from './eth';

describe('inpage-provider', () => {
  const nfidInpageProvider = new NFIDEthInpageProvider(
    1,
    undefined as any as ethers.providers.JsonRpcProvider
  );
  it('should return chainId', () => {
    expect(nfidInpageProvider.chainId).toEqual('0x01');
  });
});
