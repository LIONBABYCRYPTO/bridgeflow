import { motion, AnimatePresence } from 'framer-motion'
import { useBridge, type ChainId, type Asset } from '../context/BridgeContext'
import { CHAINS, estimateRoute } from '../data/chains'
import AssetSelect from './AssetSelect'
import ChainSelect from './ChainSelect'
import RouteSummary from './RouteSummary'
import BridgeProgress from './BridgeProgress'
import NaturalInput from './NaturalInput'

export default function BridgeWidget() {
  const { state, setStep, setAsset, setAmount, setFromChain, setToChain, setRoute, setShowNaturalInput, setMigrateMode } = useBridge()

  const handleBridge = () => {
    setStep('bridge')
    setTimeout(() => setStep('complete'), 4000)
  }

  const handleNaturalParse = (text: string) => {
    const match = text.match(/(\d+\.?\d*)\s*(USDC|USDT|ETH|BTC|CRO)\s*(?:from\s+)?(\w+)\s*(?:to|->|→)\s*(\w+)/i)
    if (match) {
      const amount = match[1]
      const asset = match[2].toUpperCase() as Asset
      const fromName = match[3].toLowerCase()
      const toName = match[4].toLowerCase()
      const chainKeys = Object.keys(CHAINS) as ChainId[]
      const fromChain = chainKeys.find(k => CHAINS[k].name.toLowerCase().includes(fromName) || k.includes(fromName)) || null
      const toChain = chainKeys.find(k => CHAINS[k].name.toLowerCase().includes(toName) || k.includes(toName)) || null
      if (fromChain && toChain && asset) {
        setAsset(asset)
        setAmount(amount)
        setFromChain(fromChain)
        setToChain(toChain)
        const route = estimateRoute(fromChain, toChain, asset, parseFloat(amount))
        setRoute({
          fromChain,
          toChain,
          asset,
          amount: parseFloat(amount),
          ...route,
        })
        setStep('route')
        setShowNaturalInput(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Migrate Wallet button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setMigrateMode(true)}
        className="w-full p-4 rounded-2xl border border-dashed border-gold/40 bg-gold/[0.03] hover:bg-gold/[0.06] transition-all text-center cursor-pointer"
      >
        <div className="text-sm font-semibold text-gold">🚀 Migrate Wallet</div>
        <div className="text-xs text-text-secondary mt-0.5">Move all assets in one go</div>
      </motion.button>

      <AnimatePresence mode="wait">
        {state.step === 'asset' && (
          <motion.div key="asset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AssetSelect />
          </motion.div>
        )}

        {state.step === 'chain' && (
          <motion.div key="chain" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ChainSelect />
          </motion.div>
        )}

        {state.step === 'route' && (
          <motion.div key="route" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <RouteSummary onBridge={handleBridge} />
          </motion.div>
        )}

        {(state.step === 'bridge' || state.step === 'complete') && (
          <motion.div key="bridge" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <BridgeProgress />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Natural language toggle */}
      {state.step === 'asset' && (
        <div className="text-center">
          <button
            onClick={() => setShowNaturalInput(!state.showNaturalInput)}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            {state.showNaturalInput ? '✕ Close' : '✨ Type it instead'}
          </button>
          <AnimatePresence>
            {state.showNaturalInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <NaturalInput onParse={handleNaturalParse} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
