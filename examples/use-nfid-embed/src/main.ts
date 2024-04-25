import { NFID } from '@nfid/embed';

async function Client() {
  const authButton = document.querySelector(
    '#getDelegation'
  ) as HTMLButtonElement;


  authButton.onclick = async () => {
    const nfid = await NFID.init({ origin: 'https://nfid.one' });
    const delegation =  nfid.getDelegation()
    console.debug('Client.onClick', { delegation });
  };
}

Client();
