import './styles.scss';

import { requestTransfer } from '@nfid/wallet';

Client();

async function Client() {
  const authButton = document.querySelector('#submit') as HTMLButtonElement;
  const to = document.querySelector('#to') as HTMLButtonElement;
  const amount = document.querySelector('#amount') as HTMLButtonElement;

  authButton.onclick = () => {
    if (!to.value || !amount.value) throw new Error("Can't be empty");

    const params = { to: to.value, amount: Number(amount.value) };
    console.log('>> authButton.onClick', params);

    requestTransfer(params);
  };
}
