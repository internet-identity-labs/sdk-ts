import './style.css';
import {
    requestPhoneNumberCredential,
    verifyPhoneNumberCredential,
    registerPhoneNumberCredentialHandler,
    CredentialResult,
} from '@nfid/credentials';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';

window.global = window;

const app = document.querySelector<HTMLDivElement>('#app')!;
let principal: string | undefined;
let agent: HttpAgent | undefined;

if (window.location.pathname.includes('provider')) {
    Provider();
} else {
    Client();
}

async function Client() {
    app.innerHTML = `
    <button id="auth">Authenticate</button>
    <button id="credential" disabled=true>Request Credential</button>
  `;

    const authButton = document.querySelector('#auth') as HTMLButtonElement;
    const credButton = document.querySelector(
        '#credential'
    ) as HTMLButtonElement;
    const message = document.querySelector('#message') as HTMLDivElement;

    authButton.onclick = async () => {
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: () => {
                const identity = authClient.getIdentity();
                (window as any).ic.agent = new HttpAgent({
                    identity,
                    host: 'https://ic0.app',
                });
                principal = identity.getPrincipal().toText();
                authButton.disabled = true;
                credButton.disabled = false;
                message.innerText = `Principal: ${principal}`;
            },
            onError: error => {
                console.error(error);
            },
            identityProvider: 'https://nfid.dev/idp',
        });
    };

    credButton.onclick = () => {
        credButton.disabled = true;
        credButton.innerText = 'Loading...';
        message.innerText = '';
        requestPhoneNumberCredential({
            provider: new URL(
                `http://localhost:9090/credential/verified-phone-number`
            ),
            windowFeatures: {
                height: 705,
                width: 625,
            },
        })
            .then(({ hashedPhoneNumber }) => {
                credButton.innerText = 'Complete!';
                message.innerText = `Result: ${hashedPhoneNumber}`;
                if (!principal) throw new Error('Missing principal');
                return verifyPhoneNumberCredential(
                    hashedPhoneNumber,
                    principal
                );
            })
            .then(
                r =>
                    (message.innerText = r
                        ? 'Phone number verified!'
                        : 'Could not verify credential.')
            )
            .catch(e => {
                console.error(e);
                credButton.disabled = false;
                credButton.innerText = 'Request Credential';
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
                () =>
                    resolve({
                        hashedPhoneNumber: 'abcdef123456',
                        createdDate: new Date(),
                    }),
                3000
            )
        );
    }
    registerPhoneNumberCredentialHandler(handler);
}
