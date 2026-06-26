/**
 * Stellar / Soroban interaction service.
 * Uses @stellar/stellar-sdk to submit transactions.
 */
import {
  Contract,
  Keypair,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  nativeToScVal,
  Address,
  scValToNative,
} from "@stellar/stellar-sdk";
import { config } from "../config";

const RPC = new SorobanRpc.Server(config.stellarRpcUrl, {
  allowHttp: false,
});
const NETWORK_PASSPHRASE =
  config.stellarNetwork === "mainnet"
    ? Networks.PUBLIC
    : Networks.TESTNET;

/** Submit a Soroban contract invocation. Returns the transaction hash. */
export async function invokeContract(
  secretKey: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<{ hash: string; result: unknown }> {
  const kp = Keypair.fromSecret(secretKey);
  const account = await RPC.getAccount(kp.publicKey());

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await RPC.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  assembled.sign(kp);

  const sendResult = await RPC.sendTransaction(assembled);
  if (sendResult.status === "ERROR") {
    const errXdr = sendResult.errorResult;
    const errStr = errXdr
      ? errXdr.toXDR("base64")
      : "unknown error";
    throw new Error(`Send error: ${errStr}`);
  }

  // Poll for confirmation
  let getResult = await RPC.getTransaction(sendResult.hash);
  let attempts = 0;
  while (
    getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < 20
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    getResult = await RPC.getTransaction(sendResult.hash);
    attempts++;
  }

  if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${getResult.status}`);
  }

  const resultScVal = getResult.returnValue;
  return {
    hash: sendResult.hash,
    result: resultScVal ? scValToNative(resultScVal) : null,
  };
}

/** Get the current ledger sequence number. */
export async function getLedger(): Promise<number> {
  const latest = await RPC.getLatestLedger();
  return latest.sequence;
}
