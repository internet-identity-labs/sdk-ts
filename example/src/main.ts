import './style.css';
import {
    requestPhoneNumberCredential,
    verifyPhoneNumberCredential,
    registerPhoneNumberCredentialHandler,
    CredentialResult,
} from '@nfid/credentials';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';

window.global = window;

const app = document.querySelector<HTMLDivElement>('#app')!;
let identity: DelegationIdentity;

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
        console.log(`${import.meta.env.VITE_NFID_HOST}/authenticate`);
        await authClient.login({
            onSuccess: () => {
                identity = authClient.getIdentity() as DelegationIdentity;
                if (!(window as any).ic) (window as any).ic = {};
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
            identityProvider: `${import.meta.env.VITE_NFID_HOST}/authenticate`,
            windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=625,height=705`,
        });
    };

    credButton.onclick = () => {
        credButton.disabled = true;
        credButton.innerText = 'Loading...';
        requestPhoneNumberCredential(identity, {
            windowFeatures: {
                height: 705,
                width: 525,
                top: window.screen.height / 2 - 705 / 2,
                left: window.screen.width / 2 - 525 / 2,
                toolbar: false,
                location: false,
                menubar: false,
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
                certificate.innerText = `Problem getting credential: ${e}`;
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
