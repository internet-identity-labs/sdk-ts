import { Identity } from '@dfinity/agent';

export type IFrameAuthClientResult = Identity;
export type IFrameAuthClientEvents =
  | { kind: 'Ready' }
  | {
      kind: 'Authenticated';
      result: IFrameAuthClientResult;
    };
