import { Delegation, DelegationChain } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { DerEncodedPublicKey, Signature } from '@dfinity/agent';

type ParsableDelegation = {
  delegation: {
    pubkey: Uint8Array;
    expiration: bigint;
    targets?: Principal[];
  };
  signature: Uint8Array;
};

type ResponseParsableDelegation = {
  delegations: ParsableDelegation[];
  userPublicKey: Uint8Array;
};

export const parseDelegation = (response: ResponseParsableDelegation) => {
  const delegations = response.delegations.map((signedDelegation) => {
    return {
      delegation: new Delegation(
        signedDelegation.delegation.pubkey,
        signedDelegation.delegation.expiration,
        signedDelegation.delegation.targets
      ),
      signature: signedDelegation.signature.buffer as Signature,
    };
  });
  const delegationChain = DelegationChain.fromDelegations(
    delegations,
    response.userPublicKey.buffer as DerEncodedPublicKey
  );
  return delegationChain;
};
