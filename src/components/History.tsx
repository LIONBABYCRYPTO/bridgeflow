import { motion } from 'framer-motion'

interface HistoryItem {
  id: string
  asset: string
  amount: number
  fromChain: string
  toChain: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
  txHash: string
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    asset: 'USDC',
    amount: 100,
    fromChain: 'Ethereum',
    toChain: 'Base',
    status: 'completed',
    timestamp: '2 hours ago',
    txHash: '0x1234...abcd',
  },
  {
    id: '2',
    asset: 'ETH',
    amount: 0.5,
    fromChain: 'Arbitrum',
    toChain: 'Optimism',
    status: 'completed',
    timestamp: '1 day ago',
    txHash: '0x5678...ef01',
  },
]

export default function History() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Bridge History</h3>

      <div className="space-y-2">
        {mockHistory.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border-light bg-surface"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              item.status === 'completed' ? 'bg-success' :
              item.status === 'pending' ? 'bg-warning' : 'bg-danger'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">
                {item.amount} {item.asset}
              </div>
              <div className="text-xs text-text-secondary truncate">
                {item.fromChain} → {item.toChain}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-tertiary">{item.timestamp}</div>
              <a
                href={`https://etherscan.io/tx/${item.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent-hover"
              >
                View ↗
              </a>
            </div>
          </motion.div>
        ))}

        {mockHistory.length === 0 && (
          <div className="text-center py-8 text-text-tertiary text-sm">
            No transfers yet
          </div>
        )}
      </div>
    </div>
  )
}
