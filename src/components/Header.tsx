import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { address, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-border-light">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight" style={{ color: '#0071e3' }}>
            ⟠
          </span>
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            BridgeFlow
          </span>
        </div>

        <ConnectButton.Custom>
          {({ openConnectModal, account, authenticationStatus, mounted }) => {
            const ready = mounted && authenticationStatus !== 'loading'
            const connected = ready && account

            return (
              <div className="relative">
                {connected ? (
                  <>
                    {/* Wallet button */}
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-light bg-surface hover:bg-surface-hover transition-all active:scale-[0.97]"
                    >
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm font-medium text-text-primary">
                        {account.displayName}
                      </span>
                      <motion.span
                        animate={{ rotate: showMenu ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-text-tertiary"
                      >
                        ▼
                      </motion.span>
                    </button>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {showMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-border-light bg-surface shadow-xl"
                          >
                            {/* Wallet info */}
                            <div className="p-4 border-b border-border-light">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-success" />
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                  Connected
                                </span>
                              </div>
                              <div className="text-sm font-medium text-text-primary font-mono truncate">
                                {account.address}
                              </div>
                              {chain && (
                                <div className="text-xs text-text-secondary mt-1">
                                  {chain.name}
                                </div>
                              )}
                              {balance && (
                                <div className="text-sm font-semibold text-text-primary mt-1.5">
                                  {(+balance.formatted).toFixed(4)} {balance.symbol}
                                </div>
                              )}
                            </div>

                            {/* Disconnect */}
                            <div className="p-2">
                              <ConnectButton.Custom>
                                  {({ openChainModal }) => (
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => { setShowMenu(false); openChainModal?.() }}
                                      className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-surface-hover transition-all text-left"
                                    >
                                      Switch Network
                                    </button>
                                    <button
                                      onClick={() => { setShowMenu(false) }}
                                      className="w-full px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-surface-hover transition-all text-left"
                                    >
                                      Account Details
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowMenu(false)
                                        disconnect()
                                      }}
                                      className="w-full px-3 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/5 transition-all text-left"
                                    >
                                      Disconnect
                                    </button>
                                  </div>
                                )}
                              </ConnectButton.Custom>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    onClick={openConnectModal}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200 active:scale-[0.97]"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}
