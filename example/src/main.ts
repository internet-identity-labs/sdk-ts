import './style.css';
import {
    requestPhoneNumberCredential,
    verifyPhoneNumberCredential,
} from '@nfid/credentials';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';

window.global = window;

let identity: DelegationIdentity;

Client();

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
            windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=525,height=705`,
        });
    };

    credButton.onclick = () => {
        credButton.disabled = true;
        credButton.innerText = 'Loading...';
        requestPhoneNumberCredential(identity, {
            provider: new URL(
                `${
                    import.meta.env.VITE_NFID_HOST
                }/credential/verified-phone-number`
            ),
        })
            .then(result => {
                certificate.innerText = JSON.stringify(result, null, 2);
                if (result.status === 'SUCCESS') {
                    credButton.innerText = 'Complete!';
                    verify.innerText = 'Verifying credential...';
                    return verifyPhoneNumberCredential(
                        identity.getPrincipal().toText()
                    );
                } else {
                    credButton.disabled = false;
                    credButton.innerText = 'Request Credential';
                    return undefined;
                }
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
