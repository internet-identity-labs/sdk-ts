import { Identity } from '@dfinity/agent';
import { AuthClientLoginOptions } from '@dfinity/auth-client';

export interface IHandleAuthenticate {
  provider: string;
  onSuccess?: (identity: Identity) => void;
  onError?: (error?: string) => void;
  authClientConfig?: AuthClientLoginOptions;
}

export interface IIFrameAuthClient {
  iframeElement: HTMLElement;
  provider: string;
  onSuccess?: (identity: Identity) => void;
  onError?: (error?: string) => void;
  iframeStyleQueries?: string;
}
