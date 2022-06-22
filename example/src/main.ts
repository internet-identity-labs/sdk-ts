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

    const button = document.querySelector('button');

    if (button) {
        button.onclick = async () => {
            button.disabled = true;
            button.innerText = 'Loading...';
            const { credential, result } = await requestPhoneNumberCredential({
                provider: new URL(`${window.location.origin}/provider`),
            });
            button.disabled = true;
            button.innerText = 'Complete!';
            app.append(`Result: ${result}, Credential: ${credential}`);
        };
    }
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
