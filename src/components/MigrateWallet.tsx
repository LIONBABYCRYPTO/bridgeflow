import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBridge, type ChainId } from '../context/BridgeContext'
import { CHAINS } from '../data/chains'

const MOCK_BALANCES = [
  { asset: 'USDC', amount: 1250, chain: 'ethereum' as ChainId },
  { asset: 'ETH', amount: 0.42, chain: 'arbitrum' as ChainId },
  { asset: 'LINK', amount: 100, chain: 'polygon' as ChainId },
]

export default function MigrateWallet() {
  const { setAsset, setAmount, setFromChain, setToChain, setMigrateMode, fetchRoute } = useBridge()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [dests, setDests] = useState<Record<string, ChainId>>({})

  const setAmt = (key: string, val: string) => setAmounts(prev => ({ ...prev, [key]: val }))
  const setDest = (key: string, chain: ChainId) => setDests(prev => ({ ...prev, [key]: chain }))

  const bridgeSingle = (item: typeof MOCK_BALANCES[0]) => {
    const amt = amounts[item.asset + item.chain]
    const dest = dests[item.asset + item.chain]
    if (!amt || parseFloat(amt) <= 0) return
    if (!dest) return
    setAsset(item.asset as any)
    setAmount(amt)
    setFromChain(item.chain)
    setToChain(dest)
    setMigrateMode(false)
    fetchRoute(item.chain, dest, item.asset as any, parseFloat(amt))
  }

  const bridgeAll = (dest: ChainId) => {
    const first = MOCK_BALANCES[0]
    if (!first) return
    const amt = amounts[first.asset + first.chain] || String(first.amount)
    setAsset(first.asset as any)
    setAmount(amt)
    setFromChain(first.chain)
    setToChain(dest)
    setMigrateMode(false)
    fetchRoute(first.chain, dest, first.asset as any, parseFloat(amt))
  }

  const chainKeys = Object.keys(CHAINS) as ChainId[]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">Migrate Wallet</h2>
        <p className="text-sm text-text-secondary mt-1">
          Select how much to bridge and where to
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_BALANCES.map((item, i) => {
          const key = item.asset + item.chain
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl border border-border-light bg-surface space-y-3"
            >
              {/* Asset header */}
              <div className="flex items-center gap-3">
                <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary">
                  {item.asset === 'USDC' ? '💲' : item.asset === 'ETH' ? '⟠' : '🔗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{item.asset}</div>
                  <div className="text-xs text-text-secondary">on {CHAINS[item.chain].name}</div>
                </div>
                <div className="text-xs text-text-tertiary">Balance: {item.amount}</div>
              </div>

              {/* Amount input */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Amount"
                  value={amounts[key] || ''}
                  onChange={e => setAmt(key, e.target.value)}
                  min="0"
                  step="any"
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                />
                <span className="text-xs text-text-tertiary w-8 text-right">max</span>
              </div>

              {/* Destination selector */}
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

              {/* Bridge button per asset */}
              <button
                onClick={() => bridgeSingle(item)}
                disabled={!amounts[key] || parseFloat(amounts[key]) <= 0 || !dests[key]}
                className="w-full py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Bridge {amounts[key] || '...'} {item.asset} →
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Bridge All */}
      <div className="flex gap-2 items-center pt-1">
        <span className="text-xs text-text-secondary">Bridge all to:</span>
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

      <button
        onClick={() => setMigrateMode(false)}
        className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer"
      >
        Cancel
      </button>
    </motion.div>
  )
}
