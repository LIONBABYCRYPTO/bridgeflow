import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getHistory, type HistoryItem } from '../data/chains'

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    setItems(getHistory())
    const interval = setInterval(() => setItems(getHistory()), 3000)
    return () => clearInterval(interval)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Bridge History</h3>

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
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
            <div className="text-right shrink-0">
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
      </div>
    </div>
  )
}
