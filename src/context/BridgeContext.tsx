import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { fetchLiveRoute, addHistory, executeRoute, type LiveRoute } from '../data/chains'

export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc' | 'cronos'

export type Asset = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'

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
  migrationPlan: any[]
  bridgeStatus: 'idle' | 'approving' | 'approve_sent' | 'bridging' | 'confirming' | 'done' | 'error'
  bridgeError: string | null
  txHash: string | null
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
  startBridge: () => Promise<void>
  setBridgeStatus: (s: BridgeState['bridgeStatus']) => void
  setBridgeError: (e: string | null) => void
  setTxHash: (h: string | null) => void
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
  bridgeStatus: 'idle',
  bridgeError: null,
  txHash: null,
}

const BridgeContext = createContext<BridgeContextType | null>(null)

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>(defaultState)
  const routeRef = useRef<any>(null)
  const { address } = useAccount()

  const patch = (partial: Partial<BridgeState>) => setState(s => ({ ...s, ...partial }))

  const fetchRoute = useCallback(async (from: ChainId, to: ChainId, asset: Asset, amount: number) => {
    patch({ loadingRoute: true, route: null, bridgeStatus: 'idle', bridgeError: null })
    const { route, rawRoute } = await fetchLiveRoute(from, to, asset, amount, address || undefined)
    if (rawRoute) routeRef.current = rawRoute
    patch({ route, loadingRoute: false, step: 'route' })
  }, [address])

  const startBridge = useCallback(async () => {
    const s = state
    if (!s.route || !s.asset || !s.amount || !s.fromChain || !s.toChain) return

    patch({ bridgeStatus: 'approving', bridgeError: null })

    try {
      const result = await executeRoute(routeRef.current, (status: string, txHash?: string) => {
        const statusMap: Record<string, BridgeState['bridgeStatus']> = {
          'approve': 'approving',
          'approve_sent': 'approve_sent',
          'bridge': 'bridging',
          'confirming': 'confirming',
          'complete': 'done',
        }
        const mapped = statusMap[status] || 'bridging'
        patch({ bridgeStatus: mapped, ...(txHash ? { txHash } : {}) })
      })

      if (result.success) {
        addHistory({
          id: Date.now().toString(),
          asset: s.asset!,
          amount: parseFloat(s.amount) || 0,
          fromChain: s.fromChain!,
          toChain: s.toChain!,
          status: 'completed',
          timestamp: new Date().toLocaleString(),
          txHash: result.txHash || 'sent',
        })
        patch({ bridgeStatus: 'done', txHash: result.txHash || null, step: 'complete' })
      } else {
        patch({ bridgeStatus: 'error', bridgeError: result.error || 'Bridge failed' })
      }
    } catch (e: any) {
      patch({ bridgeStatus: 'error', bridgeError: e?.message || 'Unknown error' })
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
      setBridgeStatus: (s) => patch({ bridgeStatus: s }),
      setBridgeError: (e) => patch({ bridgeError: e }),
      setTxHash: (h) => patch({ txHash: h }),
      reset: () => { setState(defaultState); routeRef.current = null },
      fetchRoute,
      startBridge,
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
