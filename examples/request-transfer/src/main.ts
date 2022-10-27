import './styles.scss';

import { requestTransfer } from '@nfid/wallet';

Client();

const APPLICATION_LOGO_URL = 'https%3A%2F%2Flogo.clearbit.com%2Fclearbit.com';

async function Client() {
  const authButton = document.querySelector('#submit') as HTMLButtonElement;
  const to = document.querySelector('#to') as HTMLButtonElement;
  const amount = document.querySelector('#amount') as HTMLButtonElement;

  authButton.onclick = () => {
    if (!to.value || !amount.value) throw new Error("Can't be empty");

    const params = { to: to.value, amount: Number(amount.value) };
    console.log('>> authButton.onClick', params);

    requestTransfer(params, {
      provider: new URL(
        `http://localhost:9090/wallet/request-transfer?applicationName=RequestTransfer&applicationLogo=${APPLICATION_LOGO_URL}`
      ),
    });
  };
}
