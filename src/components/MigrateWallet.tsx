import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useBridge, type ChainId } from '../context/BridgeContext'
import { CHAINS, fetchWalletBalances, type WalletBalance } from '../data/chains'

const ASSET_ICONS: Record<string, string> = {
  USDC: '💲', USDT: '💵', ETH: '⟠', BTC: '₿', CRO: '🔷',
}

export default function MigrateWallet() {
  const { address } = useAccount()
  const { setAsset, setAmount, setFromChain, setToChain, setMigrateMode, fetchRoute } = useBridge()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [dests, setDests] = useState<Record<string, ChainId>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchWalletBalances(address)
      .then(b => {
        setBalances(b)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load balances')
        setLoading(false)
      })
  }, [address])

  const setAmt = (key: string, val: string) => setAmounts(prev => ({ ...prev, [key]: val }))
  const setDest = (key: string, chain: ChainId) => setDests(prev => ({ ...prev, [key]: chain }))

  const bridgeSingle = (item: WalletBalance) => {
    const key = item.asset + item.chain
    const amt = amounts[key] || String(item.amount)
    const dest = dests[key]
    if (!dest) return
    setAsset(item.asset as any)
    setAmount(amt)
    setFromChain(item.chain)
    setToChain(dest)
    setMigrateMode(false)
    fetchRoute(item.chain, dest, item.asset as any, parseFloat(amt))
  }

  const bridgeAll = (dest: ChainId) => {
    const first = balances[0]
    if (!first) return
    const key = first.asset + first.chain
    const amt = amounts[key] || String(first.amount)
    setAsset(first.asset as any)
    setAmount(amt)
    setFromChain(first.chain)
    setToChain(dest)
    setMigrateMode(false)
    fetchRoute(first.chain, dest, first.asset as any, parseFloat(amt))
  }

  const chainKeys = Object.keys(CHAINS) as ChainId[]

  if (!address) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <p className="text-text-secondary text-sm">Connect your wallet first to see balances.</p>
        <button onClick={() => setMigrateMode(false)} className="mt-4 text-sm text-accent hover:underline cursor-pointer">Back</button>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-secondary text-sm mt-3">Scanning your wallet...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-3">
        <p className="text-danger text-sm">{error}</p>
        <button onClick={() => setMigrateMode(false)} className="text-sm text-accent hover:underline cursor-pointer">Back</button>
      </motion.div>
    )
  }

  if (balances.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-3">
        <p className="text-text-secondary text-sm">No supported assets found in your wallet.</p>
        <p className="text-text-tertiary text-xs">We scan for USDC, USDT, ETH, WBTC, and CRO across 7 chains.</p>
        <button onClick={() => setMigrateMode(false)} className="text-sm text-accent hover:underline cursor-pointer">Back</button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">Migrate Wallet</h2>
        <p className="text-sm text-text-secondary mt-1">
          {balances.length} asset{balances.length > 1 ? 's' : ''} found — select amount and destination
        </p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {balances.map((item, i) => {
          const key = item.asset + item.chain
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-border-light bg-surface space-y-3"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary">
                  {ASSET_ICONS[item.asset] || '🪙'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{item.asset}</div>
                  <div className="text-xs text-text-secondary">{CHAINS[item.chain].name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">{item.amount < 0.001 ? '<0.001' : item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  {item.usdValue > 0 && (
                    <div className="text-xs text-text-tertiary">${item.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  )}
                </div>
              </div>

              {/* Amount input */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Amount"
                  value={amounts[key] ?? item.amount}
                  onChange={e => setAmt(key, e.target.value)}
                  min="0"
                  max={item.amount}
                  step={item.asset === 'ETH' ? '0.01' : '0.1'}
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                />
                <button
                  onClick={() => setAmt(key, String(item.amount))}
                  className="text-xs text-accent hover:underline cursor-pointer shrink-0"
                >
                  max
                </button>
              </div>

              {/* Destination */}
              <div className="flex gap-1.5 flex-wrap">
                {chainKeys
                  .filter(c => c !== item.chain)
                  .map(c => {
                    const selected = dests[key] === c
                    return (
                      <button
                        key={c}
                        onClick={() => setDest(key, selected ? '' as any : c)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          selected
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-border-light text-text-secondary hover:bg-surface-hover'
                        }`}
                      >
                        {CHAINS[c].icon} {CHAINS[c].name}
                      </button>
                    )
                  })}
              </div>

              {/* Bridge button */}
              <button
                onClick={() => bridgeSingle(item)}
                disabled={!dests[key]}
                className="w-full py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Bridge {amounts[key] || item.amount} {item.asset} → {dests[key] ? CHAINS[dests[key]].name : '...'}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Bridge all */}
      {balances.length > 1 && (
        <div className="flex gap-2 items-center pt-1">
          <span className="text-xs text-text-secondary shrink-0">Bridge all:</span>
          {(['base', 'arbitrum', 'ethereum'] as ChainId[]).map(c => (
            <button
              key={c}
              onClick={() => bridgeAll(c)}
              className="flex-1 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-all cursor-pointer"
            >
              {CHAINS[c].icon} {CHAINS[c].name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setMigrateMode(false)}
        className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer"
      >
        Cancel
      </button>
    </motion.div>
  )
}
