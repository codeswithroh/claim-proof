import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? "3001"),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/claimproof",
  stellarNetwork: (process.env.STELLAR_NETWORK ?? "testnet") as
    | "testnet"
    | "mainnet",
  stellarRpcUrl:
    process.env.STELLAR_RPC_URL ??
    "https://soroban-testnet.stellar.org",
  claimproofContractId: process.env.CLAIMPROOF_CONTRACT_ID ?? "",
  adminSecretKey: process.env.ADMIN_SECRET_KEY ?? "",
  usdcContractId:
    process.env.USDC_CONTRACT_ID ??
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // testnet USDC
};
