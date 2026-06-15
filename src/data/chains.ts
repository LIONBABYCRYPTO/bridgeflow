export const CHAINS = {
  ethereum: { id: 1, name: 'Ethereum', color: '#627eea', icon: '◆' },
  base: { id: 8453, name: 'Base', color: '#0052ff', icon: '◈' },
  arbitrum: { id: 42161, name: 'Arbitrum', color: '#28a0f0', icon: '◇' },
  polygon: { id: 137, name: 'Polygon', color: '#8247e5', icon: '⬡' },
  optimism: { id: 10, name: 'Optimism', color: '#ff0420', icon: '○' },
  bsc: { id: 56, name: 'BNB Chain', color: '#f0b90b', icon: '⬟' },
  cronos: { id: 25, name: 'Cronos', color: '#1a0f2e', icon: '⟐' },
} as const

export const ASSETS: { symbol: string; name: string; icon: string }[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💲' },
  { symbol: 'USDT', name: 'Tether', icon: '💵' },
  { symbol: 'ETH', name: 'Ether', icon: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'CRO', name: 'Cronos', icon: '🔷' },
]

export function estimateRoute(
  _fromChain: string,
  _toChain: string,
  _asset: string,
  amount: number
) {
  const fee = amount * 0.0015
  const network = Math.random() * 0.5 + 0.2
  const receive = amount - fee - network * 0.01
  const safety = Math.floor(85 + Math.random() * 15)
  const times = ['~30 seconds', '~1 minute', '~2 minutes', '~3 minutes', '~5 minutes']
  const time = times[Math.floor(Math.random() * times.length)]
  return {
    estimatedReceive: Math.round(receive * 100) / 100,
    estimatedTime: time,
    networkFee: Math.round(network * 100) / 100,
    bridgeFee: Math.round(fee * 100) / 100,
    safetyScore: safety,
  }
}
