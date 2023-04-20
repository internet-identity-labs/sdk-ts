import { NFIDInpageProvider } from './inpage-provider';
import * as postMsgRpc from './postmsg-rpc';
import * as mountIframe from './iframe/mount-iframe';
import * as getIframe from './iframe/get-iframe';
import { NFIDIframeElement } from './iframe/get-iframe';

beforeAll(() => {
  jest.clearAllMocks();
});

describe('inpage-provider', () => {
  it('should start with empty message queue', () => {
    const nfidInpageProvider = new NFIDInpageProvider();
    expect(nfidInpageProvider.messageQueue).toEqual([]);
  });

  it.only('should queue new messages', async () => {
    const requestId = '123';

    jest.mock('uuid', () => ({ v4: () => requestId }));

    jest.spyOn(postMsgRpc, 'request').mockImplementation(() =>
      Promise.resolve({
        ...postMsgRpc.RPC_BASE,
        id: requestId,
        result: ['0x123'],
      })
    );

    jest
      .spyOn(getIframe, 'getIframe')
      .mockImplementation(
        () => document.createElement('iframe') as NFIDIframeElement
      );

    const showIframe = jest
      .spyOn(mountIframe, 'showIframe')
      .mockImplementation(() => Promise.resolve());

    const hideIframe = jest
      .spyOn(mountIframe, 'hideIframe')
      .mockImplementation(() => Promise.resolve());

    const nfidInpageProvider = new NFIDInpageProvider();
    expect(nfidInpageProvider.messageQueue).toEqual([]);

    nfidInpageProvider.request({ method: 'eth_accounts', params: [] });

    expect(showIframe).toHaveBeenCalledTimes(1);
    expect(nfidInpageProvider.messageQueue.length).toEqual(1);

    await new Promise(process.nextTick);

    expect(nfidInpageProvider.messageQueue.length).toEqual(0);
    expect(hideIframe).toHaveBeenCalledTimes(1);
  });

  it('should return chainId', () => {
    const nfidInpageProvider = new NFIDInpageProvider();
    expect(nfidInpageProvider.chainId).toEqual('0x5');
  });
});
