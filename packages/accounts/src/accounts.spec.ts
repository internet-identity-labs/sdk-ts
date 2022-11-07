import {
  createWindow,
  defaultWindowFeatures,
  done,
  postMessageToProvider,
} from '@nfid/core';
import { defaultProvider } from './default-provider';
import { requestAccounts } from './accounts';
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

      requestAccounts();

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

      expect(postMessageToProvider).toHaveBeenCalledWith({
        kind: 'RequestAccounts',
      });
    });
  });
});
