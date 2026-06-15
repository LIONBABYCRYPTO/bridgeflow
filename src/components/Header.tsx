import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'

export default function Header() {
  const { address, chain } = useAccount()
  const { data: balance } = useBalance({ address })

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
        <div className="flex items-center gap-3">
          {address && (
            <div className="hidden sm:block text-right text-xs leading-tight">
              <div className="text-text-secondary">{chain?.name || 'Unknown'}</div>
              <div className="text-text-primary font-medium">
                {balance ? (+balance.formatted).toFixed(4) : '0.0000'} {balance?.symbol || ''}
              </div>
            </div>
          )}
          <ConnectButton.Custom>
            {({ openConnectModal, account }) => (
              <button
                onClick={account ? undefined : openConnectModal}
                className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200 active:scale-[0.97]"
              >
                {account ? account.displayName : 'Connect Wallet'}
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
