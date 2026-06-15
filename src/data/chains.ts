import { createClient, getQuote, ChainKey } from '@lifi/sdk'

const client = createClient({
  integrator: 'bridgeflow',
})

export interface ChainInfo {
  id: number
  name: string
  key: ChainKey
  color: string
  icon: string
}

export const CHAINS: Record<string, ChainInfo> = {
  ethereum: { id: 1, name: 'Ethereum', key: ChainKey.ETH, color: '#627eea', icon: '◆' },
  base: { id: 8453, name: 'Base', key: ChainKey.BAS, color: '#0052ff', icon: '◈' },
  arbitrum: { id: 42161, name: 'Arbitrum', key: ChainKey.ARB, color: '#28a0f0', icon: '◇' },
  polygon: { id: 137, name: 'Polygon', key: ChainKey.POL, color: '#8247e5', icon: '⬡' },
  optimism: { id: 10, name: 'Optimism', key: ChainKey.OPT, color: '#ff0420', icon: '○' },
  bsc: { id: 56, name: 'BNB Chain', key: ChainKey.BSC, color: '#f0b90b', icon: '⬟' },
  cronos: { id: 25, name: 'Cronos', key: ChainKey.CRO, color: '#1a0f2e', icon: '⟐' },
}

export const ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💲' },
  { symbol: 'USDT', name: 'Tether', icon: '💵' },
  { symbol: 'ETH', name: 'Ether', icon: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin (WBTC)', icon: '₿' },
  { symbol: 'CRO', name: 'Cronos', icon: '🔷' },
]

export type AssetSymbol = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'

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

export async function fetchLiveRoute(
  fromChain: string,
  toChain: string,
  asset: AssetSymbol,
  amount: number
): Promise<LiveRoute | null> {
  try {
    const fromChainId = CHAINS[fromChain].id
    const toChainId = CHAINS[toChain].id

    const step = await getQuote(client, {
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: asset,
      toToken: asset,
      fromAmount: (amount * 1e18).toString(),
      fromAddress: '0x0000000000000000000000000000000000000001',
      slippage: 0.01,
      order: 'RECOMMENDED',
    })

    if (!step?.estimate) throw new Error('No estimate')

    const est = step.estimate as any
    let totalGas = 0
    let totalFee = 0
    if (est.gasCosts) est.gasCosts.forEach((g: any) => { totalGas += parseFloat(g.amountUSD || '0') })
    if (est.feeCosts) est.feeCosts.forEach((f: any) => { totalFee += parseFloat(f.amountUSD || '0') })

    const receive = parseFloat(est.toAmountMin) / 1e18 || amount * 0.995
    const execDur = est.executionDuration || 120
    const timeStr = execDur < 60 ? `~${execDur}s` : execDur < 3600 ? `~${Math.round(execDur / 60)}m` : `~${(execDur / 3600).toFixed(1)}h`

    return {
      fromChain,
      toChain,
      asset,
      amount,
      estimatedReceive: Math.round(receive * 100) / 100,
      estimatedTime: timeStr,
      networkFee: Math.round(totalGas * 100) / 100,
      bridgeFee: Math.round(totalFee * 100) / 100,
      safetyScore: 95,
    }
  } catch (e) {
    console.warn('LI.FI quote failed, using fallback:', e)
    const fee = amount * 0.0015
    const network = Math.random() * 0.5 + 0.2
    const receive = amount - fee - network * 0.01
    const safety = Math.floor(85 + Math.random() * 15)
    const times = ['~30s', '~1m', '~2m', '~3m', '~5m']
    return {
      fromChain,
      toChain,
      asset,
      amount,
      estimatedReceive: Math.round(receive * 100) / 100,
      estimatedTime: times[Math.floor(Math.random() * times.length)],
      networkFee: Math.round(network * 100) / 100,
      bridgeFee: Math.round(fee * 100) / 100,
      safetyScore: safety,
    }
  }
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
