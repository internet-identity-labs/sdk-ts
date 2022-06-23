import './style.css';
import {
    requestPhoneNumberCredential,
    registerPhoneNumberCredentialHandler,
    CredentialResult,
} from '@nfid/credentials';

const app = document.querySelector<HTMLDivElement>('#app')!;

if (window.location.pathname.includes('provider')) {
    Provider();
} else {
    Client();
}

async function Client() {
    app.innerHTML = `
    <button>Request Credential</button>
  `;

    const button = document.querySelector('button') as HTMLButtonElement;
    const message = document.querySelector('#message') as HTMLDivElement;

    button.onclick = () => {
        button.disabled = true;
        button.innerText = 'Loading...';
        message.innerText = '';
        requestPhoneNumberCredential({
            provider: new URL(`${window.location.origin}/provider`),
        })
            .then(({ credential, result }) => {
                button.innerText = 'Complete!';
                message.innerText = `Result: ${result}, Credential: ${credential}`;
            })
            .catch(e => {
                console.error(e);
                button.disabled = false;
                button.innerText = 'Request Credential';
                message.innerText = `Problem getting credential: ${e}`;
            });
    };
}

async function Provider() {
    app.innerHTML = `
    <h1>Provider</h1>
    <p>Doing credential magic..</p>
    `;
    async function handler(): Promise<CredentialResult> {
        return new Promise(resolve =>
            setTimeout(
                () => resolve({ result: true, credential: 'abcdefg' }),
                3000
            )
        );
    }
    registerPhoneNumberCredentialHandler(handler);
}
