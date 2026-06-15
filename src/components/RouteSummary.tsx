import { motion } from 'framer-motion'
import { useBridge } from '../context/BridgeContext'
import { CHAINS } from '../data/chains'

interface Props {
  onBridge: () => void
}

export default function RouteSummary({ onBridge }: Props) {
  const { state, setStep } = useBridge()
  const { route, loadingRoute } = state

  if (loadingRoute) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="text-4xl w-16 h-16 mx-auto flex items-center justify-center rounded-full border-2 border-accent border-t-transparent"
        >
          ⟠
        </motion.div>
        <p className="text-text-secondary text-sm">Finding the best route...</p>
      </motion.div>
    )
  }

  if (!route) return null

  const fromChain = CHAINS[route.fromChain]
  const toChain = CHAINS[route.toChain]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">Review Transfer</h2>
      </div>

      {/* Chain-to-chain visual */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl" style={{ color: fromChain.color }}>{fromChain.icon}</span>
          <span className="text-xs font-medium text-text-secondary">{fromChain.name}</span>
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-text-tertiary text-lg"
        >
          →
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl" style={{ color: toChain.color }}>{toChain.icon}</span>
          <span className="text-xs font-medium text-text-secondary">{toChain.name}</span>
        </div>
      </div>

      {/* Route card */}
      <div className="rounded-2xl border border-border-light bg-surface p-5 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-border-light">
          <span className="text-sm text-text-secondary">You Send</span>
          <span className="text-lg font-semibold text-text-primary">{route.amount} {route.asset}</span>
        </div>

        {/* Recommended badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-medium w-fit mx-auto">
          ⭐ Recommended
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">You Receive</span>
          <span className="text-lg font-semibold text-success">{route.estimatedReceive} {route.asset}</span>
        </div>

        <div className="h-px bg-border-light" />

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Estimated Time</span>
          <span className="text-sm font-medium text-text-primary">{route.estimatedTime}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Network Fee</span>
          <span className="text-sm font-medium text-text-primary">${route.networkFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">BridgeFlow Service Fee</span>
          <span className="text-sm font-medium text-warning">${route.bridgeFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border-light">
          <span className="text-sm text-text-secondary">Safety Score</span>
          <span className={`text-sm font-semibold ${route.safetyScore >= 95 ? 'text-success' : route.safetyScore >= 85 ? 'text-warning' : 'text-danger'}`}>
            {route.safetyScore}/100
            {route.safetyScore >= 95 && ' ✅'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setStep('chain')}
          className="flex-1 py-3.5 rounded-xl border border-border-light text-text-secondary font-medium text-sm hover:bg-surface-hover transition-all cursor-pointer"
        >
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBridge}
          className="flex-[2] py-3.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover shadow-lg shadow-accent/20 transition-all cursor-pointer"
        >
          Bridge Now
        </motion.button>
      </div>
    </motion.div>
  )
}
