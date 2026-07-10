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
    contractId: "CC7S7UTP3UYF6IN757GCXECLB7LV4NC27UFSSO6SOHZY5Y7GRCOP3BJX",
  }
} as const

export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"PaymentFailed"},
  4: {message:"DailyLimitExceeded"},
  5: {message:"TooEarlyToRenew"}
}

export type DataKey = {tag: "Admin", values: void} | {tag: "MockToken", values: void} | {tag: "Tier", values: readonly [PlanTier]} | {tag: "UserSub", values: readonly [string]} | {tag: "UserUsage", values: readonly [string]};

export enum PlanTier {
  Alpha = 0,
  Vector = 1,
  Nexus = 2,
}


export interface TierInfo {
  daily_tx_limit: u32;
  has_nft_access: boolean;
  monthly_fee: i128;
}


export interface DailyUsage {
  count: u32;
  first_tx_timestamp: u64;
}


export interface UserSubscription {
  last_billing_timestamp: u64;
  next_billing_timestamp: u64;
  tier: PlanTier;
}

export interface Client {
  /**
   * Construct and simulate a subscribe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  subscribe: ({user, tier}: {user: string, tier: PlanTier}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_user_tier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_tier: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<PlanTier>>

  /**
   * Construct and simulate a check_nft_access transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_nft_access: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a record_transaction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_transaction: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_subscription transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_subscription: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_remaining_transactions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_remaining_transactions: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, mock_token}: {admin: string, mock_token: string},
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
    return ContractClient.deploy({admin, mock_token}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANUGF5bWVudEZhaWxlZAAAAAAAAAMAAAAAAAAAEkRhaWx5TGltaXRFeGNlZWRlZAAAAAAABAAAAAAAAAAPVG9vRWFybHlUb1JlbmV3AAAAAAU=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAJTW9ja1Rva2VuAAAAAAAAAQAAAAAAAAAEVGllcgAAAAEAAAfQAAAACFBsYW5UaWVyAAAAAQAAAAAAAAAHVXNlclN1YgAAAAABAAAAEwAAAAEAAAAAAAAACVVzZXJVc2FnZQAAAAAAAAEAAAAT",
        "AAAAAwAAAAAAAAAAAAAACFBsYW5UaWVyAAAAAwAAAAAAAAAFQWxwaGEAAAAAAAAAAAAAAAAAAAZWZWN0b3IAAAAAAAEAAAAAAAAABU5leHVzAAAAAAAAAg==",
        "AAAAAQAAAAAAAAAAAAAACFRpZXJJbmZvAAAAAwAAAAAAAAAOZGFpbHlfdHhfbGltaXQAAAAAAAQAAAAAAAAADmhhc19uZnRfYWNjZXNzAAAAAAABAAAAAAAAAAttb250aGx5X2ZlZQAAAAAL",
        "AAAAAQAAAAAAAAAAAAAACkRhaWx5VXNhZ2UAAAAAAAIAAAAAAAAABWNvdW50AAAAAAAABAAAAAAAAAASZmlyc3RfdHhfdGltZXN0YW1wAAAAAAAG",
        "AAAAAQAAAAAAAAAAAAAAEFVzZXJTdWJzY3JpcHRpb24AAAADAAAAAAAAABZsYXN0X2JpbGxpbmdfdGltZXN0YW1wAAAAAAAGAAAAAAAAABZuZXh0X2JpbGxpbmdfdGltZXN0YW1wAAAAAAAGAAAAAAAAAAR0aWVyAAAH0AAAAAhQbGFuVGllcg==",
        "AAAAAAAAAAAAAAAJc3Vic2NyaWJlAAAAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAABHRpZXIAAAfQAAAACFBsYW5UaWVyAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAKbW9ja190b2tlbgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANZ2V0X3VzZXJfdGllcgAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAB9AAAAAIUGxhblRpZXI=",
        "AAAAAAAAAAAAAAAQY2hlY2tfbmZ0X2FjY2VzcwAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAE=",
        "AAAAAAAAAAAAAAAScmVjb3JkX3RyYW5zYWN0aW9uAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAATY2FuY2VsX3N1YnNjcmlwdGlvbgAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAaZ2V0X3JlbWFpbmluZ190cmFuc2FjdGlvbnMAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    subscribe: this.txFromJSON<Result<void>>,
        get_user_tier: this.txFromJSON<PlanTier>,
        check_nft_access: this.txFromJSON<boolean>,
        record_transaction: this.txFromJSON<Result<void>>,
        cancel_subscription: this.txFromJSON<Result<void>>,
        get_remaining_transactions: this.txFromJSON<u32>
  }
}