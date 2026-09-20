import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, walletConnectWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { bscTestnet } from "wagmi/chains";

export const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName: "SellCex",
    projectId: "YOUR_PROJECT_ID", // your real Reown project ID from before
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [anvilLocal, bscTestnet],
  transports: {
    [anvilLocal.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});