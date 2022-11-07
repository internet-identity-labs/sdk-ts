import { requestTransfer } from './request-transfer';
import {
  createWindow,
  defaultWindowFeatures,
  done,
  postMessageToProvider,
} from '@nfid/core';
import { defaultProvider } from './default-provider';

jest.mock('@nfid/core', () => ({
  createWindow: jest.fn(),
  validateEventOrigin: jest.fn().mockImplementation(() => true),
  postMessageToProvider: jest.fn(),
  done: jest.fn(),
}));

describe('wallet', () => {
  describe('requestTransfer', () => {
    it('should work', () => {
      const listeners = new Map();
      const addEventListener = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation((type, handler) => listeners.set(type, handler));

      const removeEventListener = jest
        .spyOn(window, 'removeEventListener')
        .mockImplementation((type, handler) => {
          const listener = listeners.get(type);
          if (listener === handler) {
            listeners.delete(type);
          }
        });

      const params = { to: 'myAccount', amount: 1_000_000 };
      requestTransfer(params);
      expect(createWindow).toBeCalledWith(
        defaultProvider.toString(),
        expect.any(Function),
        defaultWindowFeatures
      );
      expect(addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );

      const listener = listeners.get('message');

      // NFID will send a Ready event when flow has been mounted
      listener({ data: { kind: 'Ready' }, origin: 'https://nfid.one' });

      expect(postMessageToProvider).toHaveBeenCalledWith({
        kind: 'RequestTransfer',
        params,
      });

      // NFID will send a RequestTransferResponse event when user has
      // accepted and the transfer has been successful
      listener({
        data: { kind: 'RequestTransferResponse', result: { height: 1 } },
        origin: 'https://nfid.one',
      });
      expect(done).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenCalledTimes(1);
      expect(listeners.get('message')).toBeUndefined();
    });
  });
});
