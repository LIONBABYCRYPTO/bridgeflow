import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback } from 'react'
import { fetchLiveRoute, addHistory, type LiveRoute } from '../data/chains'

export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc' | 'cronos'

export type Asset = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'

export interface BridgeRoute {
  fromChain: ChainId
  toChain: ChainId
  asset: Asset
  amount: number
  estimatedReceive: number
  estimatedTime: string
  networkFee: number
  bridgeFee: number
  safetyScore: number
}

export interface BridgeState {
  fromChain: ChainId | null
  toChain: ChainId | null
  asset: Asset | null
  amount: string
  route: LiveRoute | null
  loadingRoute: boolean
  step: 'wallet' | 'asset' | 'chain' | 'route' | 'bridge' | 'complete'
  showNaturalInput: boolean
  naturalInput: string
  migrateMode: boolean
  migrationPlan: BridgeRoute[]
}

interface BridgeContextType {
  state: BridgeState
  setFromChain: (c: ChainId) => void
  setToChain: (c: ChainId) => void
  setAsset: (a: Asset) => void
  setAmount: (a: string) => void
  setRoute: (r: LiveRoute | null) => void
  setStep: (s: BridgeState['step']) => void
  setShowNaturalInput: (v: boolean) => void
  setNaturalInput: (v: string) => void
  setMigrateMode: (v: boolean) => void
  reset: () => void
  fetchRoute: (from: ChainId, to: ChainId, asset: Asset, amount: number) => Promise<void>
  completeBridge: () => void
}

const defaultState: BridgeState = {
  fromChain: null,
  toChain: null,
  asset: null,
  amount: '',
  route: null,
  loadingRoute: false,
  step: 'wallet',
  showNaturalInput: false,
  naturalInput: '',
  migrateMode: false,
  migrationPlan: [],
}

const BridgeContext = createContext<BridgeContextType | null>(null)

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>(defaultState)

  const patch = (partial: Partial<BridgeState>) => setState(s => ({ ...s, ...partial }))

  const fetchRoute = useCallback(async (from: ChainId, to: ChainId, asset: Asset, amount: number) => {
    patch({ loadingRoute: true, route: null })
    const route = await fetchLiveRoute(from, to, asset, amount)
    patch({ route, loadingRoute: false, step: 'route' })
  }, [])

  const completeBridge = useCallback(() => {
    const s = state
    if (s.route && s.asset && s.amount) {
      addHistory({
        id: Date.now().toString(),
        asset: s.asset,
        amount: parseFloat(s.amount) || 0,
        fromChain: s.fromChain || 'unknown',
        toChain: s.toChain || 'unknown',
        status: 'completed',
        timestamp: new Date().toLocaleString(),
        txHash: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
      })
    }
  }, [state])

  return (
    <BridgeContext.Provider value={{
      state,
      setFromChain: (c) => patch({ fromChain: c }),
      setToChain: (c) => patch({ toChain: c }),
      setAsset: (a) => patch({ asset: a }),
      setAmount: (a) => patch({ amount: a }),
      setRoute: (r) => patch({ route: r }),
      setStep: (s) => patch({ step: s }),
      setShowNaturalInput: (v) => patch({ showNaturalInput: v }),
      setNaturalInput: (v) => patch({ naturalInput: v }),
      setMigrateMode: (v) => patch({ migrateMode: v }),
      reset: () => setState(defaultState),
      fetchRoute,
      completeBridge,
    }}>
      {children}
    </BridgeContext.Provider>
  )
}

export function useBridge() {
  const ctx = useContext(BridgeContext)
  if (!ctx) throw new Error('useBridge must be within BridgeProvider')
  return ctx
}
