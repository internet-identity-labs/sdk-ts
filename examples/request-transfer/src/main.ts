import './styles.scss';

import { transfer } from '@nfid/wallet';

Client();

const APPLICATION_LOGO_URL = 'https%3A%2F%2Flogo.clearbit.com%2Fclearbit.com';
const PROVIDER_URL = new URL(
  `${process.env.NX_NFID_HOST}/wallet/request-transfer?applicationName=RequestTransfer&applicationLogo=${APPLICATION_LOGO_URL}`
);

async function Client() {
  const authButton = document.querySelector('#submit') as HTMLButtonElement;
  const to = document.querySelector('#to') as HTMLButtonElement;
  const amount = document.querySelector('#amount') as HTMLButtonElement;

  authButton.onclick = () => {
    if (!to.value || !amount.value) throw new Error("Can't be empty");

    const params = { to: to.value, amount: Number(amount.value) };

    transfer.requestTransfer(params, {
      provider: PROVIDER_URL,
    });
  };
}
