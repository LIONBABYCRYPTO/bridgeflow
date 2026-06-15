import { motion } from 'framer-motion'
import { useBridge, type Asset } from '../context/BridgeContext'
import { ASSETS } from '../data/chains'

export default function AssetSelect() {
  const { setAsset, setAmount, setStep, state } = useBridge()

  const handleSelect = (symbol: Asset) => {
    setAsset(symbol)
    if (state.amount && parseFloat(state.amount) > 0) {
      setStep('chain')
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">What would you like to transfer?</h2>
        <p className="text-sm text-text-secondary mt-1">Select asset and enter amount</p>
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          type="number"
          value={state.amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="any"
          className="w-full px-5 py-4 rounded-2xl border border-border-light bg-surface text-2xl font-semibold text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center"
        />
        {state.asset && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary bg-bg-secondary px-2 py-1 rounded-lg">
            {state.asset}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {ASSETS.map((asset, i) => {
          const selected = state.asset === asset.symbol
          return (
            <motion.button
              key={asset.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(asset.symbol as Asset)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                selected
                  ? 'border-accent bg-accent/5'
                  : 'border-border-light bg-surface hover:bg-surface-hover'
              }`}
            >
              <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-bg-secondary">
                {asset.icon}
              </span>
              <div>
                <div className="font-semibold text-text-primary">{asset.symbol}</div>
                <div className="text-xs text-text-secondary">{asset.name}</div>
              </div>
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-accent text-sm"
                >
                  ✓
                </motion.span>
              )}
              <div className="ml-auto text-text-tertiary text-sm">→</div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
