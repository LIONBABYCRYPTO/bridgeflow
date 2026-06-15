import { motion } from 'framer-motion'
import { useBridge } from '../context/BridgeContext'
import { CHAINS } from '../data/chains'

export default function BridgeProgress() {
  const { state, reset } = useBridge()
  const { route, bridgeStatus, bridgeError, txHash } = state

  const getStepIndex = () => {
    switch (bridgeStatus) {
      case 'approving': return 0
      case 'approve_sent': return 1
      case 'bridging': return 2
      case 'confirming': return 3
      case 'done': return 4
      case 'error': return -1
      default: return 0
    }
  }

  const STEPS = [
    { label: 'Approve Token', desc: 'Authorize the bridge to use your tokens' },
    { label: 'Approval Sent', desc: 'Waiting for approval to confirm' },
    { label: 'Sending', desc: 'Bridging your asset to destination chain' },
    { label: 'Confirming', desc: 'Waiting for on-chain confirmation' },
    { label: 'Done!', desc: 'Your assets have arrived' },
  ]

  const currentStep = getStepIndex()
  const isComplete = bridgeStatus === 'done'
  const isError = bridgeStatus === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">
          {isComplete ? 'Transfer Complete!' : isError ? 'Transfer Failed' : 'Bridging...'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {route?.amount} {route?.asset} {CHAINS[route?.fromChain!]?.name} → {CHAINS[route?.toChain!]?.name}
        </p>
      </div>

      {txHash && bridgeStatus !== 'error' && (
        <div className="text-center">
          <span className="text-xs text-text-secondary font-mono truncate block max-w-[200px] mx-auto">
            {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </span>
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline mt-1 inline-block"
          >
            View on Explorer ↗
          </a>
        </div>
      )}

      {/* Progress timeline */}
      <div className="px-2">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          const failed = isError && i === currentStep

          return (
            <div key={i} className="flex items-start gap-4 mb-6 last:mb-0 relative">
              <motion.div
                animate={{ scale: active ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                style={{
                  backgroundColor: done ? '#34c759' : failed ? '#ff3b30' : active ? '#0071e3' : '#e5e5ea',
                  color: done || active || failed ? 'white' : '#86868b',
                }}
              >
                {done ? '✓' : failed ? '✕' : active ? '●' : i + 1}
              </motion.div>

              {i < STEPS.length - 1 && (
                <div
                  className="absolute left-[14px] top-8 w-0.5 h-6 -translate-x-1/2 z-0"
                  style={{
                    background: done
                      ? '#34c759'
                      : 'linear-gradient(to bottom, #0071e3, #e5e5ea)',
                  }}
                />
              )}

              <div className="pt-1.5 flex-1 min-w-0">
                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: done ? '#34c759' : failed ? '#ff3b30' : active ? '#0071e3' : '#86868b' }}
                >
                  {step.label}
                </span>
                <p className="text-xs text-text-tertiary mt-0.5">{step.desc}</p>
              </div>

              {active && !done && !failed && (
                <motion.div className="pt-2 shrink-0">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
                  />
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {isError && (
        <div className="text-center space-y-3">
          <p className="text-sm text-danger px-4">{bridgeError || 'Something went wrong'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center gap-1 text-2xl">
            {['🎉', '✨', '🎊', '🌟', '✨'].map((e, i) => (
              <motion.span
                key={i}
                initial={{ y: 0, rotate: 0 }}
                animate={{ y: [-20, 0], rotate: [0, 360] }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              >
                {e}
              </motion.span>
            ))}
          </div>
          <p className="text-text-secondary text-sm">
            {route?.amount} {route?.asset} sent to {CHAINS[route?.toChain!]?.name}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all cursor-pointer"
          >
            Bridge Again
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
