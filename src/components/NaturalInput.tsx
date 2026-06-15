import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onParse: (text: string) => void
}

export default function NaturalInput({ onParse }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onParse(text.trim())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Move 100 USDC from Ethereum to Cronos"
          className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        Parse & Fill
      </button>
    </motion.div>
  )
}
