import { NFIDInpageProvider } from './inpage-provider';

describe('inpage-provider', () => {
  const nfidInpageProvider = new NFIDInpageProvider('goerli', "Gvl6jhntAUlqmfKASgr4aYGG");
  it('should return chainId', () => {
    expect(nfidInpageProvider.chainId).toEqual('0x5');
  });
});
