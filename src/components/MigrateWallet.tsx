import { motion } from 'framer-motion'
import { useBridge, type ChainId } from '../context/BridgeContext'
import { CHAINS } from '../data/chains'

const MOCK_BALANCES = [
  { asset: 'USDC', amount: 1250, chain: 'ethereum' as ChainId },
  { asset: 'ETH', amount: 0.42, chain: 'arbitrum' as ChainId },
  { asset: 'LINK', amount: 100, chain: 'polygon' as ChainId },
]

export default function MigrateWallet() {
  const { setMigrateMode } = useBridge()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">Migrate Wallet</h2>
        <p className="text-sm text-text-secondary mt-1">
          Move all your assets in one flow
        </p>
      </div>

      <div className="space-y-2">
        {MOCK_BALANCES.map((item, i) => (
          <motion.div
            key={item.asset + item.chain}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-border-light bg-surface"
          >
            <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary">
              {item.asset === 'USDC' ? '💲' : item.asset === 'ETH' ? '⟠' : '🔗'}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{item.amount} {item.asset}</div>
              <div className="text-xs text-text-secondary">on {CHAINS[item.chain].name}</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-all cursor-pointer"
            >
              Bridge →
            </motion.button>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all cursor-pointer"
      >
        Bridge All to Base
      </motion.button>

      <button
        onClick={() => setMigrateMode(false)}
        className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer"
      >
        Cancel
      </button>
    </motion.div>
  )
}
