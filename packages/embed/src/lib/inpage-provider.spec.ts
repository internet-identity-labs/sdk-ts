import { NFIDInpageProvider } from './inpage-provider';

describe('inpage-provider', () => {
  const nfidInpageProvider = new NFIDInpageProvider();
  it('should return chainId', () => {
    expect(nfidInpageProvider.chainId).toEqual('0x5');
  });
});
