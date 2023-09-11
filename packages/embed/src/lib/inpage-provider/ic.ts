import { NFIDBaseProvider } from './provider';
import {
  isDelegationValid,
  DelegationChain,
  DelegationIdentity,
  Ed25519KeyIdentity,
} from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import { NFIDAuthStorage } from '../authentication/nfid-auth-storage';
import { parseDelegation } from '../authentication/parse-delegations';

export const KEY_STORAGE_KEY = 'identity';
export const KEY_STORAGE_DELEGATION = 'delegation';

type Method =
  | 'ic_getDelegation'
  | 'ic_requestTransfer' /* add more method names as needed */;

type MethodToReturnType = {
  ic_getDelegation: ResponseParsableDelegation;
  ic_requestTransfer: {
    status: ResponseStatus;
    errorMessage?: string;
    blockIndex?: number;
  };
  // Define return types for other methods here
};

export type ResponseStatus = 'SUCCESS' | 'ERROR' | 'REJECTED'

type ParsableDelegation = {
  delegation: {
    pubkey: Uint8Array;
    expiration: bigint;
    targets?: Principal[];
  };
  signature: Uint8Array;
};

type ResponseParsableDelegation = {
  status: ResponseStatus;
  errorMessage?: string;
  authSession?: {
    delegations: ParsableDelegation[];
    userPublicKey: Uint8Array;
  }
};

export class NFIDIcInpageProvider extends NFIDBaseProvider {
  private _authStorage = new NFIDAuthStorage();

  constructor() {
    super();
  }

  override request<T extends Method>({
    method,
    params,
  }: {
    method: T;
    params: any[];
  }): Promise<MethodToReturnType[T]> {
    console.debug('NFIDIcInpageProvider.request', { method, params });
    switch (method) {
      case 'ic_getDelegation': {
        const meta = {
          chainId: 'IC',
          rpcUrl: '',
        };
        return this._execRequest(method, params, meta);
      }
      case 'ic_requestTransfer': {
        const meta = {
          chainId: 'IC',
          rpcUrl: '',
        };
        return this._execRequest(method, params, meta);
      }
      default: {
        console.debug('NFIDIcInpageProvider.request default', {
          method,
          params,
        });
        throw new Error('NFIDIcInpageProvider.request unknown method');
      }
    }
  }

  async isAuthenticated() {
    console.debug('NFIDIcInpageProvider.isAuthenticated');
    return !!(await this._getCachedDelegation());
  }

  async getDelegation() {
    console.debug('NFIDIcInpageProvider.getDelegation');
    const delegationIdentity = await this._getCachedDelegation();

    if (delegationIdentity) return delegationIdentity;

    const sessionKey = Ed25519KeyIdentity.generate();
    const response = await this.request({
      method: 'ic_getDelegation',
      params: [
        {
          sessionPublicKey: new Uint8Array(
            sessionKey.getPublicKey().toDer() as ArrayBuffer
          ),
          maxTimeToLive: BigInt(Date.now() + 6 * 30 * 24 * 60 * 60 * 1e9),
        },
      ],
    });

    if (!response.authSession) {
      throw new Error("No auth session provided.")
    }

    const chain = parseDelegation(response.authSession);

    this._setCachedDelegation(sessionKey, chain);

    return DelegationIdentity.fromDelegation(sessionKey, chain);
  }

  async disconnect() {
    console.debug('NFIDIcInpageProvider.disconnect');
    this._authStorage.remove(KEY_STORAGE_KEY);
    this._authStorage.remove(KEY_STORAGE_DELEGATION);
  }

  private async _setCachedDelegation(
    key: Ed25519KeyIdentity,
    chain: DelegationChain
  ) {
    this._authStorage.set(KEY_STORAGE_KEY, JSON.stringify(key.toJSON()));
    this._authStorage.set(
      KEY_STORAGE_DELEGATION,
      JSON.stringify(chain.toJSON())
    );
  }
  /**
   * Get the cached {@link DelegationIdentity} if it exists and is valid.
   */
  private async _getCachedDelegation() {
    const [storedKey, storedDelegationChain] = await Promise.all([
      this._authStorage.get(KEY_STORAGE_KEY),
      this._authStorage.get(KEY_STORAGE_DELEGATION),
    ]);
    console.debug('NFIDIcInpageProvider._getCachedDelegation', {
      storedKey,
      storedDelegationChain,
    });
    if (!storedKey || !storedDelegationChain) return;

    const key = Ed25519KeyIdentity.fromJSON(storedKey);
    const chain = DelegationChain.fromJSON(storedDelegationChain);

    if (!isDelegationValid(chain)) return;

    return DelegationIdentity.fromDelegation(key, chain);
  }
}
