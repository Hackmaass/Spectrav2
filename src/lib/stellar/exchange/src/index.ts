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
    contractId: "CCT727YX5TAAHBEZIGXLFF2T6OITD52R7SCPAIQQOCCMR7FMYG5I4QC3",
  }
} as const

export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"InsufficientAmount"},
  3: {message:"SlippageTooHigh"},
  4: {message:"QuotaExceeded"}
}

export type DataKey = {tag: "Admin", values: void} | {tag: "SaasContract", values: void};

export interface Client {
  /**
   * Construct and simulate a swap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  swap: ({user, token_in, token_out, amount_in, min_amount_out}: {user: string, token_in: string, token_out: string, amount_in: i128, min_amount_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_quote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Very basic mock swap logic. Assumes 1:1 if same, or hardcoded mock rates.
   */
  get_quote: ({token_in, token_out, amount_in}: {token_in: string, token_out: string, amount_in: i128}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, saas_contract}: {admin: string, saas_contract: string},
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
    return ContractClient.deploy({admin, saas_contract}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkluc3VmZmljaWVudEFtb3VudAAAAAAAAgAAAAAAAAAPU2xpcHBhZ2VUb29IaWdoAAAAAAMAAAAAAAAADVF1b3RhRXhjZWVkZWQAAAAAAAAE",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMU2Fhc0NvbnRyYWN0",
        "AAAAAAAAAAAAAAAEc3dhcAAAAAUAAAAAAAAABHVzZXIAAAATAAAAAAAAAAh0b2tlbl9pbgAAABMAAAAAAAAACXRva2VuX291dAAAAAAAABMAAAAAAAAACWFtb3VudF9pbgAAAAAAAAsAAAAAAAAADm1pbl9hbW91bnRfb3V0AAAAAAALAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAElWZXJ5IGJhc2ljIG1vY2sgc3dhcCBsb2dpYy4gQXNzdW1lcyAxOjEgaWYgc2FtZSwgb3IgaGFyZGNvZGVkIG1vY2sgcmF0ZXMuAAAAAAAACWdldF9xdW90ZQAAAAAAAAMAAAAAAAAACHRva2VuX2luAAAAEwAAAAAAAAAJdG9rZW5fb3V0AAAAAAAAEwAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAEAAAAL",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAANc2Fhc19jb250cmFjdAAAAAAAABMAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    swap: this.txFromJSON<Result<i128>>,
        get_quote: this.txFromJSON<i128>
  }
}