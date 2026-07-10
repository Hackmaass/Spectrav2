import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CANG6GRC4662LJA3ZIFU24XX55NGS2HXKFAMFX7O3AIDGPX53XSZMGB3",
  }
} as const

export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"InsufficientTier"},
  3: {message:"BadgeAlreadyMinted"},
  4: {message:"NotOwner"},
  5: {message:"NonTransferable"}
}

export type DataKey = {tag: "SaasContract", values: void} | {tag: "TokenCount", values: void} | {tag: "TokenOwner", values: readonly [u32]} | {tag: "TokenUri", values: readonly [u32]} | {tag: "UserBadge", values: readonly [string, BadgeType]};

export enum BadgeType {
  Genesis = 1,
  Vector = 2,
  Nexus = 3,
}

export interface Client {
  /**
   * Construct and simulate a owner_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  owner_of: ({token_id}: {token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, token_id}: {from: string, to: string, token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a token_uri transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  token_uri: ({token_id}: {token_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a mint_nexus transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint_nexus: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a mint_vector transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint_vector: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a mint_genesis transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint_genesis: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {saas_contract}: {saas_contract: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({saas_contract}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEEluc3VmZmljaWVudFRpZXIAAAACAAAAAAAAABJCYWRnZUFscmVhZHlNaW50ZWQAAAAAAAMAAAAAAAAACE5vdE93bmVyAAAABAAAAAAAAAAPTm9uVHJhbnNmZXJhYmxlAAAAAAU=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAADFNhYXNDb250cmFjdAAAAAAAAAAAAAAAClRva2VuQ291bnQAAAAAAAEAAAAAAAAAClRva2VuT3duZXIAAAAAAAEAAAAEAAAAAQAAAAAAAAAIVG9rZW5VcmkAAAABAAAABAAAAAEAAAAAAAAACVVzZXJCYWRnZQAAAAAAAAIAAAATAAAH0AAAAAlCYWRnZVR5cGUAAAA=",
        "AAAAAwAAAAAAAAAAAAAACUJhZGdlVHlwZQAAAAAAAAMAAAAAAAAAB0dlbmVzaXMAAAAAAQAAAAAAAAAGVmVjdG9yAAAAAAACAAAAAAAAAAVOZXh1cwAAAAAAAAM=",
        "AAAAAAAAAAAAAAAIb3duZXJfb2YAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAQAAAABAAAD6QAAABMAAAAD",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAACHRva2VuX2lkAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAJdG9rZW5fdXJpAAAAAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAEAAAAAQAAA+kAAAAQAAAAAw==",
        "AAAAAAAAAAAAAAAKbWludF9uZXh1cwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6QAAAAQAAAAD",
        "AAAAAAAAAAAAAAALbWludF92ZWN0b3IAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6QAAAAQAAAAD",
        "AAAAAAAAAAAAAAAMbWludF9nZW5lc2lzAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6QAAAAQAAAAD",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAADXNhYXNfY29udHJhY3QAAAAAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    owner_of: this.txFromJSON<Result<string>>,
        transfer: this.txFromJSON<Result<void>>,
        token_uri: this.txFromJSON<Result<string>>,
        mint_nexus: this.txFromJSON<Result<u32>>,
        mint_vector: this.txFromJSON<Result<u32>>,
        mint_genesis: this.txFromJSON<Result<u32>>
  }
}