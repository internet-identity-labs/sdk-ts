import './styles.scss';

import { IFrameAuthClient } from '../../../packages/iframe-auth/src';

Client();

const APPLICATION_LOGO_URL = 'https%3A%2F%2Flogo.clearbit.com%2Fclearbit.com';
// const PROVIDER_URL = `${process.env.NX_NFID_HOST}/authenticate`;

async function Client() {
  const container = document.querySelector('.form-container') as HTMLElement;
  IFrameAuthClient(container, `${process.env.NX_NFID_HOST}/authenticate`);
}
