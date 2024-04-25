import { NFID } from './nfid';
import { NfidAuthClient } from './authentication/auth-client';
import { buildIframe } from './iframe/make-iframe';

jest.mock('./iframe/make-iframe', () => ({
  buildIframe: jest.fn().mockImplementation(({ onLoad }) => {
    console.debug('mocked buildIframe');
    setTimeout(() => {
      console.debug('mocked buildIframe onLoad');
      onLoad();
    });
    return {};
  }),
}));
jest.mock('./authentication/auth-client');

describe('NFID', () => {
  describe('init', () => {
    it('should initialise the iframe', async () => {
      await NFID.init({ origin: 'https://nfid.one' });
      expect(NfidAuthClient.create).toHaveBeenCalled();
      expect(buildIframe).toHaveBeenCalled();
      expect(NFID.isIframeInstantiated).toBe(true);
    });
    it('should initialise with keytype params', async () => {
      await NFID.init({ origin: 'https://nfid.one', keyType: 'Ed25519' });
      expect(NfidAuthClient.create).toHaveBeenCalledWith({
        keyType: 'Ed25519',
      });
      expect(buildIframe).toHaveBeenCalled();
      expect(NFID.isIframeInstantiated).toBe(true);
    });
  });
});
