import { ethers } from 'ethers';
import { NFIDIcInpageProvider } from './inpage-provider/ic';
import { NFID } from './nfid';

describe('NFID test suite', () => {
  it('should initialise the NFID sdk', async () => {
    jest.spyOn(ethers.providers, 'JsonRpcProvider').mockImplementation(
      () =>
        ({
          getNetwork: async () => ({ chainId: 1 }),
        } as ethers.providers.JsonRpcProvider)
    );

    const nfid = await NFID.init({
      origin: 'https://nfid.one',
      rpcUrl: 'https://mainnet-rpc.near.org',
    });

    expect(nfid).toBeInstanceOf(NFID);
    expect(nfid.ic).toBeInstanceOf(NFIDIcInpageProvider);
  });
});
