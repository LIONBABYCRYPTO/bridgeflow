import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBridge } from '../context/BridgeContext'
import { CHAINS, estimateRoute } from '../data/chains'
import type { ChainId } from '../context/BridgeContext'

export default function ChainSelect() {
  const { state, setFromChain, setToChain, setRoute, setStep } = useBridge()
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const chainEntries = Object.entries(CHAINS) as [ChainId, typeof CHAINS[keyof typeof CHAINS]][]

  const handleSelect = (id: ChainId) => {
    if (selecting === 'from') {
      setFromChain(id)
      setSelecting('to')
    } else if (id !== state.fromChain) {
      setToChain(id)
      // Auto-calculate route
      const asset = state.asset!
      const amount = parseFloat(state.amount) || 100
      const route = estimateRoute(state.fromChain!, id, asset, amount)
      setRoute({
        fromChain: state.fromChain!,
        toChain: id,
        asset,
        amount,
        ...route,
      })
      setStep('route')
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

      {state.fromChain && (
        <div className="flex items-center justify-center gap-3 text-sm text-text-secondary mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHAINS[state.fromChain].color }} />
            {CHAINS[state.fromChain].name}
          </span>
          <span>→</span>
          <span className="text-text-tertiary">{selecting === 'to' ? '???' : CHAINS[state.toChain!].name}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {chainEntries
          .filter(([id]) => !(selecting === 'from' && state.toChain === id) && !(selecting === 'to' && id === state.fromChain))
          .map(([id, chain], i) => (
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
      </div>
    </div>
  )
}
