import './styles.scss';

import { IFrameAuthClient } from '../../../packages/iframe-auth/src';
import { Identity } from '@dfinity/agent';

Client();

async function Client() {
  const container = document.querySelector('.form-container') as HTMLElement;

  const handleSuccess = (i: Identity) => {
    container.innerHTML = `<h3>Authenticated as: <br/> ${i
      .getPrincipal()
      .toString()}</h3>`;
  };

  IFrameAuthClient(container, process.env.NX_NFID_HOST, handleSuccess);
}
