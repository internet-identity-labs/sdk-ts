# NFID Typescript SDK

A Typescript SDK for the NFID credential system.

## Core Package

Typescript methods to authenticate user credentials via zero knowledge proofs. Proof calls will often open a new window to the NFID dapp, which will perform authentication and return the proof back to your application. If a verification can be performed passively, no new window may be required.

### `hasPhoneNumber (identity, config) : Promise<boolean>`

Verify that the user has a phone number associated with their account.

**Parameters**

-   Identity: the NFID user identity to authenticate (as anchor? as delegatoin chain? etc?)
-   Window configuration
    -   Size?
    -   Other?
-   Verification configuration
    -   Freshness?
    -   Other?

**Returns**

`Boolean`: true if the criteria of the verification call are met, otherwise false.

## Development Guidelines

### Making Releases

To release a new version to NPM

1. `npm run version (patch/minor/major)`
2. `git tag vX.X.X`
3. `git push origin --tags`
