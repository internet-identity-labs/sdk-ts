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

if (window.location.pathname.includes('provider')) {
    Provider();
} else {
    Client();
}

async function Client() {
    const authButton = document.querySelector('#auth') as HTMLButtonElement;
    const credButton = document.querySelector(
        '#credential'
    ) as HTMLButtonElement;
    const principal = document.querySelector('#principal') as HTMLDivElement;
    const certificate = document.querySelector(
        '#certificate'
    ) as HTMLDivElement;
    const verify = document.querySelector('#verify') as HTMLDivElement;

    authButton.onclick = async () => {
        const authClient = await AuthClient.create();
        await authClient.login({
            onSuccess: () => {
                const identity = authClient.getIdentity();
                (window as any).ic.agent = new HttpAgent({
                    identity,
                    host: 'https://ic0.app',
                });
                authButton.disabled = true;
                credButton.disabled = false;
                principal.innerText = `Principal: ${identity
                    .getPrincipal()
                    .toText()}`;
            },
            onError: error => {
                console.error(error);
            },
            identityProvider: 'https://nfid.dev/authenticate',
        });
    };

    credButton.onclick = () => {
        credButton.disabled = true;
        credButton.innerText = 'Loading...';
        requestPhoneNumberCredential({
            provider: new URL(
                `https://nfid.dev/credential/verified-phone-number`
            ),
            windowFeatures: {
                height: 705,
                width: 625,
            },
        })
            .then(result => {
                credButton.innerText = 'Complete!';
                certificate.innerText = JSON.stringify(result, null, 2);
                verify.innerText = 'Verifying credential...';
                return result && result.phoneNumberSha2
                    ? verifyPhoneNumberCredential(result.clientPrincipal)
                    : undefined;
            })
            .then(
                r =>
                    (verify.innerText = r
                        ? 'Phone number verified!'
                        : 'Could not verify credential.')
            )
            .catch(e => {
                console.error(e);
                credButton.disabled = false;
                credButton.innerText = 'Request Credential';
                verify.innerText = `Problem getting credential: ${e}`;
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
                        clientPrincipal: 'aaaaa-aaa',
                        phoneNumberSha2: 'abcdef123456',
                        createdDate: new Date(),
                        domain: 'dscvr.one',
                    }),
                3000
            )
        );
    }
    registerPhoneNumberCredentialHandler(handler);
}
