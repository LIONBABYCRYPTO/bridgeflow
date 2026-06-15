import { useState } from 'react'
import { motion } from 'framer-motion'
import { CHAINS } from '../data/chains'
import { useBridge, type ChainId, type Asset } from '../context/BridgeContext'

export default function ChainSelect() {
  const { state, setFromChain, setToChain, fetchRoute } = useBridge()
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [search, setSearch] = useState('')

  const chainEntries = Object.entries(CHAINS) as [ChainId, typeof CHAINS[keyof typeof CHAINS]][]
  const filtered = chainEntries.filter(([id, chain]) => {
    if (search && !chain.name.toLowerCase().includes(search.toLowerCase()) && !id.includes(search.toLowerCase())) return false
    if (selecting === 'from' && state.toChain === id) return false
    if (selecting === 'to' && id === state.fromChain) return false
    return true
  })

  const handleSelect = (id: ChainId) => {
    if (selecting === 'from') {
      setFromChain(id)
      setSelecting('to')
      setSearch('')
    } else if (id !== state.fromChain) {
      setToChain(id)
      setSearch('')
      const amount = parseFloat(state.amount) || 100
      const asset = state.asset || 'USDC'
      fetchRoute(state.fromChain!, id, asset as Asset, amount)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">
          {selecting === 'from' ? 'Where is your asset now?' : 'Where do you want it?'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {selecting === 'from' ? 'Select source chain' : 'Select destination chain'}
        </p>
      </div>

      {/* Mini breadcrumb */}
      <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.fromChain ? CHAINS[state.fromChain].color : '#999' }} />
          {state.fromChain ? CHAINS[state.fromChain].name : '???'}
        </span>
        <span className="text-text-tertiary">→</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.toChain ? CHAINS[state.toChain].color : '#999' }} />
          {state.toChain ? CHAINS[state.toChain].name : '???'}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search chains..."
          className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-surface text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(([id, chain], i) => (
          <motion.button
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(id)}
            className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-light bg-surface hover:bg-surface-hover transition-all cursor-pointer"
          >
            <span
              className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl"
              style={{ backgroundColor: `${chain.color}15`, color: chain.color }}
            >
              {chain.icon}
            </span>
            <span className="text-sm font-medium text-text-primary">{chain.name}</span>
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-text-tertiary text-sm">
            No chains match "{search}"
          </div>
        )}
      </div>
    </div>
  )
}
