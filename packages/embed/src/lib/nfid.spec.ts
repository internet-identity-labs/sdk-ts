import { NFID } from './nfid';

describe('NFID test suite', () => {
  it('should initialise the NFID sdk', async () => {
    expect(NFID.init).toBeDefined();
  });
});
