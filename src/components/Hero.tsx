import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const floatingIcons = ['◆', '◈', '◇', '⬡', '○', '⬟']

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Floating chain icons */}
      {floatingIcons.map((icon, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl opacity-[0.04] pointer-events-none select-none"
          style={{
            left: `${15 + (i * 17) % 70}%`,
            top: `${20 + (i * 23) % 60}%`,
            color: ['#627eea', '#0052ff', '#28a0f0', '#8247e5', '#ff0420', '#f0b90b'][i],
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.7,
          }}
        >
          {icon}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-medium mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Cross-chain made simple
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[#1d1d1f] dark:text-[#f5f5f7] mb-4">
          Move Crypto Between Chains
          <br />
          <span className="bg-gradient-to-r from-[#0071e3] to-[#40a9ff] bg-clip-text text-transparent">
            Without The Confusion
          </span>
        </h1>

        <p className="text-lg text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
          The simplest way to transfer assets across Ethereum, Base, Arbitrum, Polygon, Cronos and more.
        </p>

        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={openConnectModal}
              className="px-8 py-3.5 rounded-2xl bg-accent text-white text-lg font-semibold shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300"
            >
              Start Bridging
            </motion.button>
          )}
        </ConnectButton.Custom>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
    </section>
  )
}
