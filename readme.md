# NFID Typescript SDK

A Typescript SDK for the NFID credential system.

-   [Credential SDK](packages/credentials/readme.md)

## Deploying Demo App

The production demo app is available at https://pncred.nfid.one. Changes to the `main` branch are automatically deployed here.

The development demo app is available at https://pncred.nfid.dev. Changes to the `dev` branch are automatically deployed here.

## Making Releases

To release a new version to NPM

1. `npm run version (patch/minor/major)`
2. `git tag vX.X.X`
3. `git push origin --tags`
