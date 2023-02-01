import './styles.scss';

import { IFrameAuthClient } from '../../../packages/iframe-auth/src';

Client();

async function Client() {
  const container = document.querySelector('.form-container') as HTMLElement;
  IFrameAuthClient(container, process.env.NX_NFID_HOST);
}
