import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useBridge } from '../context/BridgeContext'
import { CHAINS } from '../data/chains'

const STEPS = [
  { label: 'Preparing', icon: '⚙️' },
  { label: 'Approving', icon: '✓' },
  { label: 'Bridging', icon: '⟁' },
  { label: 'Confirming', icon: '🔍' },
  { label: 'Completed', icon: '🎉' },
]

export default function BridgeProgress() {
  const { state, reset, completeBridge } = useBridge()
  const [currentStep, setCurrentStep] = useState(0)
  const route = state.route

  useEffect(() => {
    if (!route) return
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval)
          completeBridge()
          return prev
        }
        return prev + 1
      })
    }, 800)
    return () => clearInterval(interval)
  }, [route])

  const isComplete = currentStep === STEPS.length - 1

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary">
          {isComplete ? 'Transfer Complete!' : 'Bridging...'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {route?.amount} {route?.asset} {CHAINS[route?.fromChain!]?.name} → {CHAINS[route?.toChain!]?.name}
        </p>
      </div>

      {/* Progress timeline */}
      <div className="relative px-2">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
              <motion.div
                animate={{
                  scale: active ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  backgroundColor: done ? '#34c759' : active ? '#0071e3' : '#e5e5ea',
                  color: done || active ? 'white' : '#86868b',
                }}
              >
                {done ? '✓' : active ? step.icon : i + 1}
              </motion.div>

              {i < STEPS.length - 1 && (
                <div className="absolute left-[14px] top-8 w-0.5 h-6 -translate-x-1/2">
                  <div
                    className="h-full w-full rounded-full transition-all duration-500"
                    style={{ backgroundColor: done ? '#34c759' : '#e5e5ea' }}
                  />
                </div>
              )}

              <div className="pt-1.5">
                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{
                    color: done ? '#34c759' : active ? '#0071e3' : '#86868b',
                  }}
                >
                  {step.label}
                </span>
                {active && !done && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2 text-xs text-text-tertiary"
                  >
                    processing...
                  </motion.span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete action */}
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
            Your {route?.asset} has arrived on {CHAINS[route?.toChain!]?.name}
          </p>

          <div className="flex gap-3 justify-center pt-3">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-all cursor-pointer"
            >
              Bridge Again
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
