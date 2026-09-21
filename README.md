# SellCex

**Trade Crypto. Own Your Assets.**

SellCex is a decentralized exchange (DEX) built from scratch — not a Uniswap fork with a new logo. The AMM core (constant-product pricing, LP tokens, swap/mint/burn logic), the Router, and the Factory are all custom Solidity implementations, tested with Foundry and deployed via a scripted pipeline.

---

## Stack

```
Frontend        Next.js 16 (App Router) · TypeScript · Tailwind CSS
Web3            wagmi v2 · viem · RainbowKit
Animation       Framer Motion
Contracts       Solidity ^0.8.24 · Foundry (forge, cast, anvil)
```

---

## Architecture

```
User
 ↓
Connect Wallet (RainbowKit)
 ↓
Choose token A → token B
 ↓
SellCexRouter        — slippage protection, deadlines, multi-hop routing
 ↓
SellCexPair           — constant-product AMM (x·y=k), holds reserves
 ↓
AMM calculates output — 0.3% fee, K-invariant enforced on-chain
 ↓
Tokens transferred, LP shares minted/burned
 ↓
Transaction confirmed
```

### Contracts (`contracts/src/`)

| Contract | Purpose |
|---|---|
| `core/SellCexERC20.sol` | Base ERC20 + EIP-2612 `permit()`, used as the LP token every pool mints |
| `core/SellCexPair.sol` | The AMM itself — `mint()`, `burn()`, `swap()`, K-invariant enforcement, reentrancy-guarded |
| `core/SellCexFactory.sol` | Deploys a `SellCexPair` per token pair via `CREATE2`, deterministic addresses |
| `periphery/SellCexRouter.sol` | User-facing entrypoint — `addLiquidity`, `removeLiquidity`, `swapExactTokensForTokens`, ETH/BNB wrapping, multi-hop paths |
| `periphery/libraries/SellCexLibrary.sol` | Pure pricing math (`getAmountOut`, `getAmountsOut`, quoting) shared by the Router |
| `periphery/libraries/TransferHelper.sol` | Safe ERC20 transfer wrapper (tolerates non-standard tokens) |
| `test-tokens/MockERC20.sol`, `MockWETH.sol` | Testnet-only tokens with an open `mint()`, for testing without real assets |

Full test suite lives in `contracts/test/` — unit tests for every contract plus a fuzz test (`testFuzz_SwapNeverDecreasesK`) proving the K-invariant holds across 256 randomized trade sizes.

### Frontend (`app/`)

| Page | Status |
|---|---|
| `/` — Landing | Marketing page, static |
| `/swap` | **Fully wired** — real balances, real quotes (`getAmountsOut`), real approve, real swap transactions |
| `/liquidity` | **Fully wired** for the SELL/USDT pool — real reserves, real LP position, real add/remove liquidity. Other listed pools are illustrative placeholders (no deployed contracts yet) |
| `/wallet` | Real connect state, real USDT/SELL balances, real network info, live on-chain activity feed (session-only, not history) |
| `/dashboard` | Real TVL contribution from the SELL/USDT pool + a live swap feed; volume charts and token-price history remain mock (need an indexer reading past blocks) |

`components/Header.tsx` is the shared nav across every page, with RainbowKit's real connect button.

---

## Local development

### 1. Contracts

```bash
cd contracts
forge build
forge test -vv
```

Requires [Foundry](https://getfoundry.sh) (`forge`, `cast`, `anvil`).

### 2. Run a local chain

In a dedicated terminal (leave it running):

```bash
anvil
```

### 3. Deploy locally

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Copy the five printed addresses (`WETH`, `Factory`, `Router`, `USDT`, `SELL`) into `lib/contracts.ts` under the `anvil` key.

> **Note:** Anvil's chain only exists in memory. Restarting it wipes all deployed contracts and balances — redeploy after every restart.

### 4. Frontend

```bash
npm install
npm run dev
```

Add **Anvil Local** to MetaMask manually or via `add-networks.html` (chain ID `31337`, RPC `http://127.0.0.1:8545`), and import one of Anvil's pre-funded test accounts to interact with the deployed contracts.

---

## Deploying to BSC Testnet

1. Fund a wallet with tBNB (see faucet options — some require a small mainnet balance, others don't)
2. Set `PRIVATE_KEY` in `contracts/.env` (never commit this file — already in `.gitignore`)
3. Deploy:
   ```bash
   forge script script/Deploy.s.sol --rpc-url https://bsc-testnet-rpc.publicnode.com --broadcast
   ```
4. Fill in the `bscTestnet` addresses in `lib/contracts.ts`
5. Switch the app's active chain to BSC Testnet

---

## Known gaps / next steps

- **Indexer**: Dashboard's volume chart, token-price sparklines, and the "Popular pools" table are mock data. A Supabase indexer listening to `Sync`/`Swap`/`Mint`/`Burn` events (per the original architecture) would replace these with real historical data.
- **More test tokens**: only USDT and SELL are deployed. BNB, ETH, WBTC, USDC, CAKE shown across the UI are illustrative placeholders.
- **Price impact math** on the real Swap quote is a rough approximation, not a precise second-quote calculation.
- **BSC Testnet deployment**: contracts are proven on Anvil; testnet deployment is the actual finish line for a shareable, always-on version of this project.

---

## Security notes

- `SellCexPair` burns `MINIMUM_LIQUIDITY` (1000 wei) to `address(0)` on first mint, preventing a first-depositor price-manipulation attack
- Reentrancy guarded via a lightweight `unlocked` mutex on every state-changing `Pair` function
- All token transfers use a safe-transfer pattern tolerating non-standard ERC20s (e.g. real mainnet USDT)
- `ecrecover` in `permit()` doesn't reject signature malleability — acceptable for testnet, worth hardening before any mainnet deployment