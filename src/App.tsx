import './index.css';

import {
  ConnectButton,
  ErrorCode,
  SuiChainId,
  formatSUI,
  useAccountBalance,
  useSuiClient,
  useWallet,
} from "@suiet/wallet-kit";
import { useMemo, useState } from "react";

import { BottomNav } from "./components/BottomNav";
import { Buffer } from "buffer";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { MessageBoard } from "./components/MessageBoard";
import { Transaction } from "@mysten/sui/transactions";
import suietLogo from "./assets/suiet-logo.svg";

const sampleNft = new Map([
  [
    "sui:devnet",
    "0xe146dbd6d33d7227700328a9421c58ed34546f998acdc42a1d05b4818b49faa2::nft::mint",
  ],
  [
    "sui:testnet",
    "0x5ea6aafe995ce6506f07335a40942024106a57f6311cb341239abf2c3ac7b82f::nft::mint",
  ],
  [
    "sui:mainnet",
    "0x5b45da03d42b064f5e051741b6fed3b29eb817c7923b83b92f37a1d2abf4fbab::nft::mint",
  ],
]);

function createMintNftTxb(contractAddress: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: contractAddress,
    arguments: [
      tx.pure.string("Suiet NFT"),
      tx.pure.string("Suiet Sample NFT"),
      tx.pure.string(
        "https://xc6fbqjny4wfkgukliockypoutzhcqwjmlw2gigombpp2ynufaxa.arweave.net/uLxQwS3HLFUailocJWHupPJxQsli7aMgzmBe_WG0KC4"
      ),
    ],
  });
  return tx;
}

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "preparation">("home");
  const wallet = useWallet();
  const client = useSuiClient();

  const { balance } = useAccountBalance();
  const nftContractAddr = useMemo(() => {
    if (!wallet.chain) return "";
    return sampleNft.get(wallet.chain.id) ?? "";
  }, [wallet]);

  function uint8arrayToHex(value: Uint8Array | undefined) {
    if (!value) return "";
    // @ts-ignore
    return value.toString("hex");
  }

  async function handleSignAndExecuteTransaction(
    target: string | undefined,
    opts?: {
      isCustomExecution?: boolean;
    }
  ) {
    if (!target) return;
    try {
      const tx = createMintNftTxb(target);

      if (!opts?.isCustomExecution) {
        const resData = await wallet.signAndExecuteTransaction({
          transaction: tx,
        });
        console.log("signAndExecuteTransaction success", resData);
      } else {
        const resData = await wallet.signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            execute: async ({ bytes, signature }) => {
              return await client.executeTransactionBlock({
                transactionBlock: bytes,
                signature: signature,
                options: {
                  showRawEffects: true,
                  showObjectChanges: true,
                },
              });
            },
          }
        );
        console.log("signAndExecuteTransaction success", resData);
      }

      alert("executeTransactionBlock succeeded (see response in the console)");
    } catch (e) {
      console.error("executeMoveCall failed", e);
      alert("executeTransactionBlock failed (see response in the console)");
    }
  }

  async function handleSignMsg() {
    if (!wallet.account) return;
    try {
      const msg = "Hello world!";
      const msgBytes = new TextEncoder().encode(msg);
      const result = await wallet.signPersonalMessage({
        message: msgBytes,
      });
      const verifyResult = await wallet.verifySignedMessage(
        result,
        wallet.account.publicKey as any
      );
      console.log("verify signedMessage", verifyResult);
      if (!verifyResult) {
        alert(`signMessage succeed, but verify signedMessage failed`);
      } else {
        alert(`signMessage succeed, and verify signedMessage succeed!`);
      }
    } catch (e) {
      console.error("signMessage failed", e);
      alert("signMessage failed (see response in the console)");
    }
  }

  const handleSignTxnAndVerifySignature = async (contractAddress: string) => {
    const txn = createMintNftTxb(contractAddress);
    txn.setSender(wallet.account?.address as string);
    try {
      const signedTxn = await wallet.signTransaction({
        transaction: txn,
      });

      console.log(`Sign and verify txn:`);
      console.log("--wallet: ", wallet.adapter?.name);
      console.log("--account: ", wallet.account?.address);
      const publicKey = wallet.account?.publicKey as any;
      if (!publicKey) {
        console.error("no public key provided by wallet");
        return;
      }
      console.log("-- publicKey: ", publicKey);
      const pubKey = new Ed25519PublicKey(publicKey);
      console.log("-- signed txnBytes: ", signedTxn.bytes);
      console.log("-- signed signature: ", signedTxn.signature);
      const txnBytes = new Uint8Array(Buffer.from(signedTxn.bytes, "base64"));
      const isValid = await pubKey.verifyTransaction(
        txnBytes,
        signedTxn.signature
      );
      console.log("-- use pubKey to verify transaction: ", isValid);
      if (!isValid) {
        alert(`signTransaction succeed, but verify transaction failed`);
      } else {
        alert(`signTransaction succeed, and verify transaction succeed!`);
      }
    } catch (e) {
      console.error("signTransaction failed", e);
      alert("signTransaction failed (see response in the console)");
    }
  };

  const chainName = (chainId: string | undefined) => {
    switch (chainId) {
      case SuiChainId.MAIN_NET:
        return "Mainnet";
      case SuiChainId.TEST_NET:
        return "Testnet";
      case SuiChainId.DEV_NET:
        return "Devnet";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === "home" ? (
        <MessageBoard />
      ) : (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Preparation Page</h1>
          <p className="mt-4">Coming soon...</p>
        </div>
      )}
      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
}

export default App;
