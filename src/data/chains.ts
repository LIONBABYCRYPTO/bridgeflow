import { createClient, getQuote, getToken, convertQuoteToRoute, ChainKey } from '@lifi/sdk'
import type { Route, Step } from '@lifi/sdk'

const client = createClient({
  integrator: 'bridgeflow',
})

export interface ChainInfo {
  id: number
  name: string
  key: ChainKey
  color: string
  icon: string
  explorer: string
  tokenListUrl?: string
}

export const CHAINS: Record<string, ChainInfo> = {
  ethereum: { id: 1, name: 'Ethereum', key: ChainKey.ETH, color: '#627eea', icon: '◆', explorer: 'https://etherscan.io' },
  base: { id: 8453, name: 'Base', key: ChainKey.BAS, color: '#0052ff', icon: '◈', explorer: 'https://basescan.org' },
  arbitrum: { id: 42161, name: 'Arbitrum', key: ChainKey.ARB, color: '#28a0f0', icon: '◇', explorer: 'https://arbiscan.io' },
  polygon: { id: 137, name: 'Polygon', key: ChainKey.POL, color: '#8247e5', icon: '⬡', explorer: 'https://polygonscan.com' },
  optimism: { id: 10, name: 'Optimism', key: ChainKey.OPT, color: '#ff0420', icon: '○', explorer: 'https://optimistic.etherscan.io' },
  bsc: { id: 56, name: 'BNB Chain', key: ChainKey.BSC, color: '#f0b90b', icon: '⬟', explorer: 'https://bscscan.com' },
  cronos: { id: 25, name: 'Cronos', key: ChainKey.CRO, color: '#1a0f2e', icon: '⟐', explorer: 'https://cronoscan.com' },
}

export const ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💲', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', icon: '💵', decimals: 6 },
  { symbol: 'ETH', name: 'Ether', icon: '⟠', decimals: 18 },
  { symbol: 'BTC', name: 'WBTC', icon: '₿', decimals: 8 },
  { symbol: 'CRO', name: 'Cronos', icon: '🔷', decimals: 18 },
]

export type AssetSymbol = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'
export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc' | 'cronos'

export interface WalletBalance {
  asset: AssetSymbol
  amount: number
  chain: ChainId
  usdValue: number
  tokenAddress: string
  decimals: number
  logoURI: string
}

export interface LiveRoute {
  fromChain: string
  toChain: string
  asset: string
  amount: number
  estimatedReceive: number
  estimatedTime: string
  networkFee: number
  bridgeFee: number
  safetyScore: number
}

// Resolve token address for a given chain+symbol via LI.FI's token database
async function resolveTokenAddress(chainId: number, symbol: string): Promise<string> {
  try {
    const token = await getToken(client, chainId, symbol)
    if (token?.address) return token.address
  } catch {}
  // Fallback to known addresses
  const ADDRESSES: Record<number, Record<string, string>> = {
    1: {
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ETH: '0x0000000000000000000000000000000000000000',
      BTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      CRO: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
    },
    8453: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      ETH: '0x0000000000000000000000000000000000000000',
      BTC: '0xc1CBa3fCea344f92D9232cF961d89d7eB6f719B7',
    },
    42161: {
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      ETH: '0x0000000000000000000000000000000000000000',
      BTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    },
    137: {
      USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      ETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      BTC: '0x1bfd67037b42cf73acF2047067bd4F2C47D9BfD6',
    },
    10: {
      USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      ETH: '0x0000000000000000000000000000000000000000',
    },
    56: {
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      BTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    },
    25: {
      USDC: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
      USDT: '0x66e428c3f67a68878562e79A0234c1F83c208770',
      CRO: '0x0000000000000000000000000000000000000000',
    },
  }
  const addr = ADDRESSES[chainId]?.[symbol]
  if (!addr) throw new Error(`No address known for ${symbol} on chain ${chainId}`)
  return addr
}

function getAssetDecimals(symbol: string): number {
  return ASSETS.find(a => a.symbol === symbol)?.decimals || 18
}

function formatAmount(amount: number, decimals: number): string {
  return BigInt(Math.round(amount * 10 ** decimals)).toString()
}

export async function fetchLiveRoute(
  fromChain: string,
  toChain: string,
  asset: AssetSymbol,
  amount: number,
  fromAddress?: string
): Promise<{ route: LiveRoute | null; rawRoute: Route | null; error?: string }> {
  const decimals = getAssetDecimals(asset)
  try {
    const fromChainId = CHAINS[fromChain].id
    const toChainId = CHAINS[toChain].id
    const addr = fromAddress || '0x0000000000000000000000000000000000000001'

    // Resolve token addresses
    const fromToken = await resolveTokenAddress(fromChainId, asset)
    const toToken = await resolveTokenAddress(toChainId, asset)

    const result = await getQuote(client, {
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken,
      toToken,
      fromAmount: formatAmount(amount, decimals),
      fromAddress: addr,
      slippage: 0.01,
      order: 'RECOMMENDED',
    })

    // SDK v4 getQuote returns a Step, not a Route
    // Use convertQuoteToRoute to get a proper Route object
    if (!result?.estimate) throw new Error('No route found — this pair may not be supported.')
    
    const fullRoute = convertQuoteToRoute(result)
    // @ts-ignore - SDK v4 types
    const est = result.estimate

    let totalGas = 0
    let totalFee = 0
    if (est.gasCosts) est.gasCosts.forEach((g: any) => { totalGas += parseFloat(g.amountUSD || '0') })
    if (est.feeCosts) est.feeCosts.forEach((f: any) => { totalFee += parseFloat(f.amountUSD || '0') })

    const toDecimals = getAssetDecimals(asset)
    const receive = parseFloat(est.toAmountMin) / (10 ** toDecimals) || amount * 0.995
    const execDur = est.executionDuration || 120
    const timeStr = execDur < 60 ? `~${execDur}s` : execDur < 3600 ? `~${Math.round(execDur / 60)}m` : `~${(execDur / 3600).toFixed(1)}h`

    return {
      route: {
        fromChain,
        toChain,
        asset,
        amount,
        estimatedReceive: Math.round(receive * 100) / 100,
        estimatedTime: timeStr,
        networkFee: Math.round(totalGas * 100) / 100,
        bridgeFee: Math.round(totalFee * 100) / 100,
        safetyScore: 95,
      },
      rawRoute: fullRoute,
    }
  } catch (e: any) {
    const msg = e?.message || 'Quote failed'
    console.warn('LI.FI quote failed:', msg)
    return { route: null, rawRoute: null, error: msg }
  }
}

const CHAIN_IDS_BY_KEY: Record<string, number> = {}
for (const [key, info] of Object.entries(CHAINS)) {
  CHAIN_IDS_BY_KEY[key] = info.id
}

function getDefaultDecimals(symbol: string): number {
  for (const a of ASSETS) {
    if (a.symbol === symbol) return a.decimals
  }
  return 18
}

export async function fetchWalletBalances(address: string): Promise<WalletBalance[]> {
  try {
    const { getWalletBalances } = await import('@lifi/sdk')
    const result = await getWalletBalances(client, address)
    const balances: WalletBalance[] = []
    const chainReverseMap: Record<number, string> = {}
    for (const [key, info] of Object.entries(CHAINS)) {
      chainReverseMap[info.id] = key
    }
    for (const [chainIdStr, tokens] of Object.entries(result)) {
      const chainId = parseInt(chainIdStr)
      const chainKey = chainReverseMap[chainId]
      if (!chainKey || !Array.isArray(tokens)) continue
      for (const t of tokens as any[]) {
        const symbol = (t.symbol || '').toUpperCase()
        if (!['USDC', 'USDT', 'ETH', 'BTC', 'CRO'].includes(symbol)) continue
        const decimals = t.decimals ?? getDefaultDecimals(symbol)
        // LI.FI returns amounts in smallest unit (raw), convert to human-readable
        const rawAmount = BigInt(t.amount || '0')
        const divisor = 10n ** BigInt(decimals)
        const wholeAmt = Number(rawAmount / divisor) + Number(rawAmount % divisor) / Math.pow(10, decimals)
        if (wholeAmt <= 0) continue
        const priceUSD = parseFloat(t.priceUSD || '0')
        balances.push({
          asset: symbol as AssetSymbol,
          amount: wholeAmt,
          chain: chainKey as ChainId,
          usdValue: wholeAmt * priceUSD,
          tokenAddress: t.address || '',
          decimals: t.decimals || 18,
          logoURI: t.logoURI || '',
        })
      }
    }
    return balances
  } catch (e) {
    console.warn('Failed to fetch wallet balances:', e)
    return []
  }
}

export interface RouteTxData {
  fromChainId: number
  toChainId: number
  fromToken: string
  toToken: string
  fromAmount: string
  toAmountMin: string
  tx: {
    to: string
    data: string
    value: string
  }
  approvalTx?: {
    to: string
    data: string
  }
}

/**
 * Extract transaction data from a LI.FI Route for use with wagmi hooks.
 * This replaces the SDK's lifiExecute which internally uses window.ethereum.
 * Returns structured data that BridgeContext's wagmi hooks can send.
 */
export function getRouteTxData(route: Route | Step): RouteTxData | null {
  const step = 'steps' in route ? route.steps?.[0] : route
  if (!step) return null

  const txRequest = step.transactionRequest as any
  if (!txRequest?.to || !txRequest?.data) return null

  const action = step.action as any
  const estimate = step.estimate as any

  const result: RouteTxData = {
    fromChainId: action?.fromChainId || 0,
    toChainId: action?.toChainId || 0,
    fromToken: action?.fromToken || '',
    toToken: action?.toToken || '',
    fromAmount: action?.fromAmount || '0',
    toAmountMin: estimate?.toAmountMin || '0',
    tx: {
      to: txRequest.to,
      data: txRequest.data,
      value: txRequest.value || '0x0',
    },
  }

  // Check if approval is needed
  const approvalAddress = estimate?.approvalAddress
  if (approvalAddress) {
    result.approvalTx = {
      to: approvalAddress,
      data: txRequest.data, // same data is the approve call
    }
  }

  return result
}

export interface HistoryItem {
  id: string
  asset: string
  amount: number
  fromChain: string
  toChain: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
  txHash: string
}

export function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem('bridgeflow_history') || '[]')
  } catch { return [] }
}

export function addHistory(item: HistoryItem) {
  const existing = getHistory()
  existing.unshift(item)
  localStorage.setItem('bridgeflow_history', JSON.stringify(existing.slice(0, 50)))
}
