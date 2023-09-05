import { getIframe } from '../iframe/get-iframe';
import { hideIframe, showIframe } from '../iframe/mount-iframe';
import { request } from '../postmsg-rpc';

export abstract class NFIDBaseProvider {
  abstract request({
    method,
    params,
  }: {
    method: string;
    params: Array<any>;
  }): Promise<any>;

  async _execRequest(
    method: string,
    params: Array<any>,
    meta: { chainId: string; rpcUrl: string }
  ): Promise<any> {
    const iframe = getIframe();
    showIframe();
    return await request(iframe, { method, params }, meta).then(
      (response: any) => {
        console.debug('NFIDInpageProvider.request', {
          response,
        });

        hideIframe();

        if (response.error) throw new Error(response.error.message);

        return response.result;
      }
    );
  }
}
