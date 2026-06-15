import { motion } from 'framer-motion'
import { useBridge, type Asset } from '../context/BridgeContext'
import { ASSETS } from '../data/chains'

export default function AssetSelect() {
  const { setAsset, setStep } = useBridge()

  const handleSelect = (symbol: Asset) => {
    setAsset(symbol)
    setStep('chain')
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">What would you like to transfer?</h2>
        <p className="text-sm text-text-secondary mt-1">Select an asset</p>
      </div>

      <div className="flex flex-col gap-2">
        {ASSETS.map((asset, i) => (
          <motion.button
            key={asset.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(asset.symbol as Asset)}
            className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-surface hover:bg-surface-hover transition-all text-left cursor-pointer"
          >
            <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-bg-secondary">
              {asset.icon}
            </span>
            <div>
              <div className="font-semibold text-text-primary">{asset.symbol}</div>
              <div className="text-xs text-text-secondary">{asset.name}</div>
            </div>
            <div className="ml-auto text-text-tertiary text-sm">→</div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
