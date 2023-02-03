import { nfidInpageProvider } from './inpage-provider';

describe('inpage-provider', () => {
  it('should return chainId', () => {
    expect(nfidInpageProvider.chainId).toEqual('0x5');
  });
});
