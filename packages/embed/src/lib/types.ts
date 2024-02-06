import { SignIdentity } from '@dfinity/agent';
import { AuthClientStorage } from './authentication/storage';
import { IdleOptions } from '@dfinity/auth-client';

const ECDSA_KEY_LABEL = 'ECDSA';
const ED25519_KEY_LABEL = 'Ed25519';

type BaseKeyType = typeof ECDSA_KEY_LABEL | typeof ED25519_KEY_LABEL;

export type NFIDConfig = {
  origin?: string;
  application?: {
    name?: string;
    logo?: string;
  };
  ic?: {
    derivationOrigin?: string | URL;
  };
  identity?: SignIdentity;
  storage?: AuthClientStorage;
  keyType?: BaseKeyType;
  idleOptions?: IdleOptions;
};
