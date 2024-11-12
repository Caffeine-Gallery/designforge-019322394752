import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'deleteDesign' : ActorMethod<[string], boolean>,
  'getDesignVersion' : ActorMethod<[string], [] | [bigint]>,
  'listDesigns' : ActorMethod<[], Array<[string, bigint, bigint]>>,
  'loadDesign' : ActorMethod<[string], [] | [string]>,
  'saveDesign' : ActorMethod<[string, string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
