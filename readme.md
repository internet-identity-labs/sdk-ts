# NFID Typescript SDK

A Typescript SDK for the NFID credential system.

## Using The Credentials SDK

The credentials SDK exposes typescript methods to authenticate user credentials via zero knowledge proofs. Proof calls will often open a new window to the NFID dapp, which will perform authentication and return the proof back to your application. If a verification can be performed passively, no new window may be required.

### `requestPhoneNumberCredential () : Promise<CredentialResult>`

Verify that the user has a phone number associated with their account.

**Returns**

`CredentialResult` - `result : boolean` true if the identity has an associated phone number - `credential : string` a hashed phone number

**Note**

The credential should be validated with our blackhole canister.

## Development Guidelines

### Provider Example

The SDK provides a hook for providers to handle credential requests, keeping the implementation details of returning data to the client out of provider implementations.

```
import { registerPhoneNumberCredentialHandler } from '@nfid/credentials';

async function handler(): Promise<CredentialResult> {
    return new Promise(resolve =>
        setTimeout(
            () => resolve({ result: true, credential: 'abcdefg' }),
            3000
        )
    );
}

registerPhoneNumberCredentialHandler(handler);
```

### Making Releases

To release a new version to NPM

1. `npm run version (patch/minor/major)`
2. `git tag vX.X.X`
3. `git push origin --tags`
