import { NFID } from '@nfid/embed';

async function Client() {
  const authButton = document.querySelector(
    '#getDelegation'
  ) as HTMLButtonElement;

  const nfid = await NFID.init({ origin: 'https://nfid.one' });

  authButton.onclick = () => {
    nfid.getDelegation().then((delegation) => {
      console.debug('Client.onClick', { delegation });
    });
  };
}

Client();
