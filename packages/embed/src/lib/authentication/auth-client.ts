import {
  SignIdentity,
  AnonymousIdentity,
  Identity,
  Signature,
  DerEncodedPublicKey,
} from '@dfinity/agent';
import {
  AuthClientCreateOptions,
  IdleManager,
  IdleOptions,
} from '@dfinity/auth-client';
import {
  Ed25519KeyIdentity,
  DelegationChain,
  DelegationIdentity,
  ECDSAKeyIdentity,
  isDelegationValid,
  Delegation,
} from '@dfinity/identity';
import {
  AuthClientStorage,
  IdbStorage,
  isBrowser,
  KEY_STORAGE_DELEGATION,
  KEY_STORAGE_KEY,
  KEY_VECTOR,
  LocalStorage,
} from './storage';
import { getIframe } from '../iframe/get-iframe';
import { NFIDDelegationResult, request } from '../postmsg-rpc';
import { Principal } from '@dfinity/principal';

export enum DelegationType {
  GLOBAL,
  ANONYMOUS,
}

const ECDSA_KEY_LABEL = 'ECDSA';
const ED25519_KEY_LABEL = 'Ed25519';
type BaseKeyType = typeof ECDSA_KEY_LABEL | typeof ED25519_KEY_LABEL;

export const ERROR_USER_INTERRUPT = 'UserInterrupt';

export class NfidAuthClient {
  public static async create(
    options: {
      /**
       * An {@link Identity} to use as the base.
       *  By default, a new {@link AnonymousIdentity}
       */
      identity?: SignIdentity;
      /**
       * {@link AuthClientStorage}
       * @description Optional storage with get, set, and remove. Uses {@link IdbStorage} by default
       */
      storage?: AuthClientStorage;
      /**
       * type to use for the base key
       * @default 'ECDSA'
       * If you are using a custom storage provider that does not support CryptoKey storage,
       * you should use 'Ed25519' as the key type, as it can serialize to a string
       */
      keyType?: BaseKeyType;
      /**
       * Options to handle idle timeouts
       * @default after 10 minutes, invalidates the identity
       */
      idleOptions?: IdleOptions;
    } = {}
  ): Promise<NfidAuthClient> {
    console.log('NfidAuthClient');
    const storage = options.storage ?? new IdbStorage();
    const keyType = options.keyType ?? ECDSA_KEY_LABEL;

    let key: null | SignIdentity | ECDSAKeyIdentity = null;
    if (options.identity) {
      key = options.identity;
    } else {
      let maybeIdentityStorage = await storage.get(KEY_STORAGE_KEY);
      if (!maybeIdentityStorage && isBrowser) {
        // Attempt to migrate from localstorage
        try {
          const fallbackLocalStorage = new LocalStorage();
          const localChain = await fallbackLocalStorage.get(
            KEY_STORAGE_DELEGATION
          );
          const localKey = await fallbackLocalStorage.get(KEY_STORAGE_KEY);
          // not relevant for Ed25519
          if (localChain && localKey && keyType === ECDSA_KEY_LABEL) {
            console.log(
              'Discovered an identity stored in localstorage. Migrating to IndexedDB'
            );
            await storage.set(KEY_STORAGE_DELEGATION, localChain);
            await storage.set(KEY_STORAGE_KEY, localKey);

            maybeIdentityStorage = localChain;
            // clean up
            await fallbackLocalStorage.remove(KEY_STORAGE_DELEGATION);
            await fallbackLocalStorage.remove(KEY_STORAGE_KEY);
          }
        } catch (error) {
          console.error(
            'error while attempting to recover localstorage: ' + error
          );
        }
      }
      if (maybeIdentityStorage) {
        try {
          if (typeof maybeIdentityStorage === 'object') {
            if (
              keyType === ED25519_KEY_LABEL &&
              typeof maybeIdentityStorage === 'string'
            ) {
              key = await Ed25519KeyIdentity.fromJSON(maybeIdentityStorage);
            } else {
              key = await ECDSAKeyIdentity.fromKeyPair(maybeIdentityStorage);
            }
          } else if (typeof maybeIdentityStorage === 'string') {
            // This is a legacy identity, which is a serialized Ed25519KeyIdentity.
            key = Ed25519KeyIdentity.fromJSON(maybeIdentityStorage);
          }
        } catch (e) {
          // Ignore this, this means that the localStorage value isn't a valid Ed25519KeyIdentity or ECDSAKeyIdentity
          // serialization.
        }
      }
    }

    let identity = new AnonymousIdentity();
    let chain: null | DelegationChain = null;
    if (key) {
      try {
        const chainStorage = await storage.get(KEY_STORAGE_DELEGATION);
        if (typeof chainStorage === 'object' && chainStorage !== null) {
          throw new Error(
            'Delegation chain is incorrectly stored. A delegation chain should be stored as a string.'
          );
        }

        if (options.identity) {
          identity = options.identity;
        } else if (chainStorage) {
          chain = DelegationChain.fromJSON(chainStorage);

          // Verify that the delegation isn't expired.
          if (!isDelegationValid(chain)) {
            await _deleteStorage(storage);
            key = null;
          } else {
            identity = DelegationIdentity.fromDelegation(key, chain);
          }
        }
      } catch (e) {
        console.error(e);
        // If there was a problem loading the chain, delete the key.
        await _deleteStorage(storage);
        key = null;
      }
    }
    let idleManager: IdleManager | undefined = undefined;
    if (options.idleOptions?.disableIdle) {
      idleManager = undefined;
    }
    // if there is a delegation chain or provided identity, setup idleManager
    else if (chain || options.identity) {
      idleManager = IdleManager.create(options.idleOptions);
    }

    if (!key) {
      key = await getKey(storage, keyType, options.storage);
    }

    return new this(identity, key, chain, storage, idleManager, options);
  }

  protected constructor(
    private _identity: Identity,
    private _key: SignIdentity | null,
    private _chain: DelegationChain | null,
    private _storage: AuthClientStorage,
    public idleManager: IdleManager | undefined,
    private _createOptions: AuthClientCreateOptions | undefined,
    // A handle on the IdP window.
    private _idpWindow?: Window,
    // The event handler for processing events from the IdP.
    private _eventHandler?: (event: MessageEvent) => void
  ) {
    const logout = this.logout.bind(this);
    const idleOptions = _createOptions?.idleOptions;
    /**
     * Default behavior is to clear stored identity and reload the page.
     * By either setting the disableDefaultIdleCallback flag or passing in a custom idle callback, we will ignore this config
     */
    if (!idleOptions?.onIdle && !idleOptions?.disableDefaultIdleCallback) {
      this.idleManager?.registerCallback(() => {
        logout();
        location.reload();
      });
    }
  }

  public async getKey(): Promise<ECDSAKeyIdentity | Ed25519KeyIdentity> {
    return getKey(
      this._storage,
      this._createOptions?.keyType,
      this._createOptions?.storage
    );
  }

  public getDelegationType() {
    console.log(this);
    return this._chain?.delegations[0].delegation.targets?.length
      ? DelegationType.GLOBAL
      : DelegationType.ANONYMOUS;
  }

  public async renewDelegation(options?: {
    /**
     * Expiration of the authentication in nanoseconds
     * @default  BigInt(8) hours * BigInt(3_600_000_000_000) nanoseconds
     */
    maxTimeToLive?: bigint;
    /**
     * Callback once login has completed
     */
    onSuccess?: (() => void) | (() => Promise<void>);
    targets: string[];
  }) {
    console.debug('NfidAuthClient.renewDelegation');
    // Set default maxTimeToLive to 8 hours
    const defaultTimeToLive =
      /* hours */ BigInt(8) * /* nanoseconds */ BigInt(3_600_000_000_000);

    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_renewDelegation',
      params: [
        {
          sessionPublicKey: new Uint8Array(
            this._key?.getPublicKey().toDer() as ArrayBuffer
          ),
          maxTimeToLive: options?.maxTimeToLive ?? defaultTimeToLive,
          targets: options?.targets,
        },
      ],
    });

    if ('error' in response) throw new Error(response.error.message);

    return this._handleSuccess(response.result);
  }

  public async login(options?: {
    /**
     * Expiration of the authentication in nanoseconds
     * @default  BigInt(8) hours * BigInt(3_600_000_000_000) nanoseconds
     */
    maxTimeToLive?: bigint;
    /**
     * Target canisterIds
     * @default  undefined
     */
    targets?: string[];
    /**
     * Origin for Identity Provider to use while generating the delegated identity. For II, the derivation origin must authorize this origin by setting a record at `<derivation-origin>/.well-known/ii-alternative-origins`.
     * @see https://github.com/dfinity/internet-identity/blob/main/docs/internet-identity-spec.adoc
     */
    derivationOrigin?: string | URL;
  }): Promise<Identity> {
    if (!this._key) {
      this._key = await this.getKey();
    }
    // Set default maxTimeToLive to 8 hours
    const defaultTimeToLive =
      /* hours */ BigInt(8) * /* nanoseconds */ BigInt(3_600_000_000_000);

    const targets = options?.targets;
    const derivationOrigin = options?.derivationOrigin;

    const iframe = getIframe();
    const response = await request(iframe, {
      method: 'ic_getDelegation',
      params: [
        {
          sessionPublicKey: new Uint8Array(
            this._key.getPublicKey().toDer() as ArrayBuffer
          ),
          maxTimeToLive: options?.maxTimeToLive ?? defaultTimeToLive,
          ...(targets ? { targets } : {}),
          ...(derivationOrigin ? { derivationOrigin } : {}),
        },
      ],
    });

    if ('error' in response) {
      throw new Error(response.error.message);
    }
    return this._handleSuccess(response.result);
  }

  public async logout(options: { returnTo?: string } = {}): Promise<void> {
    await _deleteStorage(this._storage);

    // Reset this auth client to a non-authenticated state.
    this._identity = new AnonymousIdentity();
    this._key = null;
    this._chain = null;

    if (options.returnTo) {
      try {
        window.history.pushState({}, '', options.returnTo);
      } catch (e) {
        window.location.href = options.returnTo;
      }
    }
  }

  public getIdentity(): Identity {
    return this._identity;
  }

  public get isAuthenticated() {
    return (
      !this.getIdentity().getPrincipal().isAnonymous() && this._chain !== null
    );
  }

  private async _handleSuccess(result: NFIDDelegationResult) {
    const delegations = result.delegations.map((signedDelegation) => {
      return {
        delegation: new Delegation(
          signedDelegation.delegation.pubkey,
          signedDelegation.delegation.expiration,
          signedDelegation.delegation.targets?.map((principalId) =>
            Principal.fromText(principalId)
          )
        ),
        signature: signedDelegation.signature.buffer as Signature,
      };
    });

    console.debug('NfidAuthClient._handleSuccess', {
      delegations,
    });

    const delegationChain = DelegationChain.fromDelegations(
      delegations,
      result.userPublicKey.buffer as DerEncodedPublicKey
    );

    const key = this._key;
    if (!key) {
      throw new Error('missing key');
    }

    console.log({ delegationChain });
    this._chain = delegationChain;
    this._identity = DelegationIdentity.fromDelegation(key, this._chain);

    if (!this.idleManager) {
      const idleOptions = this._createOptions?.idleOptions;
      this.idleManager = IdleManager.create(idleOptions);

      if (!idleOptions?.onIdle && !idleOptions?.disableDefaultIdleCallback) {
        this.idleManager?.registerCallback(() => {
          this.logout();
          location.reload();
        });
      }
    }

    if (this._chain) {
      await this._storage.set(
        KEY_STORAGE_DELEGATION,
        JSON.stringify(this._chain.toJSON())
      );
    }

    return this._identity;
  }
}

async function _deleteStorage(storage: AuthClientStorage) {
  await storage.remove(KEY_STORAGE_KEY);
  await storage.remove(KEY_STORAGE_DELEGATION);
  await storage.remove(KEY_VECTOR);
}

async function getKey(
  storage: AuthClientStorage,
  keyType?: BaseKeyType,
  optionsStorage?: AuthClientStorage
): Promise<ECDSAKeyIdentity | Ed25519KeyIdentity> {
  let key;

  // Create a new key (whether or not one was in storage).
  if (keyType === ED25519_KEY_LABEL) {
    key = Ed25519KeyIdentity.generate();
    await storage.set(
      KEY_STORAGE_KEY,
      JSON.stringify((key as Ed25519KeyIdentity).toJSON())
    );
  } else {
    if (optionsStorage && keyType === ECDSA_KEY_LABEL) {
      console.warn(
        `You are using a custom storage provider that may not support CryptoKey storage. If you are using a custom storage provider that does not support CryptoKey storage, you should use '${ED25519_KEY_LABEL}' as the key type, as it can serialize to a string`
      );
    }
    key = await ECDSAKeyIdentity.generate();
    await storage.set(KEY_STORAGE_KEY, (key as ECDSAKeyIdentity).getKeyPair());
  }

  return key;
}
