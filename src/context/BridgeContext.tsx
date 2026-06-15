import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { fetchLiveRoute, addHistory, executeBridge, type LiveRoute } from '../data/chains'
import type { Route } from '@lifi/sdk'

export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc' | 'cronos'
export type Asset = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'

export interface BridgeState {
  fromChain: ChainId | null
  toChain: ChainId | null
  asset: Asset | null
  amount: string
  route: LiveRoute | null
  loadingRoute: boolean
  routeError: string | null
  step: 'wallet' | 'asset' | 'chain' | 'route' | 'bridge' | 'complete'
  showNaturalInput: boolean
  naturalInput: string
  migrateMode: boolean
  bridgeStatus: 'idle' | 'preparing' | 'switching_chain' | 'approving' | 'approve_sent' | 'bridging' | 'confirming' | 'done' | 'error'
  bridgeError: string | null
  txHash: string | null
}

interface BridgeContextType {
  state: BridgeState
  setFromChain: (c: ChainId) => void
  setToChain: (c: ChainId) => void
  setAsset: (a: Asset) => void
  setAmount: (a: string) => void
  setStep: (s: BridgeState['step']) => void
  setShowNaturalInput: (v: boolean) => void
  setNaturalInput: (v: string) => void
  setMigrateMode: (v: boolean) => void
  reset: () => void
  fetchRoute: (from: ChainId, to: ChainId, asset: Asset, amount: number) => Promise<LiveRoute | null>
  startBridge: () => Promise<void>
  fetchAndBridge: (from: ChainId, to: ChainId, asset: Asset, amount: number) => Promise<void>
}

const defaultState: BridgeState = {
  fromChain: null,
  toChain: null,
  asset: null,
  amount: '',
  route: null,
  loadingRoute: false,
  routeError: null,
  step: 'wallet',
  showNaturalInput: false,
  naturalInput: '',
  migrateMode: false,
  bridgeStatus: 'idle',
  bridgeError: null,
  txHash: null,
}

const BridgeContext = createContext<BridgeContextType | null>(null)

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BridgeState>(defaultState)
  const routeRef = useRef<Route | null>(null)
  const { address } = useAccount()

  const patch = (partial: Partial<BridgeState>) => setState(s => ({ ...s, ...partial }))

  const fetchRouteFn = useCallback(async (from: ChainId, to: ChainId, asset: Asset, amount: number) => {
    patch({ loadingRoute: true, route: null, routeError: null, bridgeStatus: 'idle', bridgeError: null })
    const result = await fetchLiveRoute(from, to, asset, amount, address || undefined)
    if (result.rawRoute) routeRef.current = result.rawRoute
    if (result.route) {
      patch({ route: result.route, loadingRoute: false, step: 'route' })
      return result.route
    } else {
      patch({ loadingRoute: false, routeError: result.error || 'No route available for this pair.' })
      return null
    }
  }, [address])

  const startBridge = useCallback(async () => {
    // Read fresh state from refs to avoid stale closure
    const s = stateRef.current
    const rawRoute = routeRef.current
    if (!rawRoute || !s.asset || !s.amount || !s.fromChain || !s.toChain) return

    patch({ step: 'bridge', bridgeStatus: 'preparing', bridgeError: null })

    const result = await executeBridge(rawRoute, (status, txHash) => {
      const statusMap: Record<string, BridgeState['bridgeStatus']> = {
        preparing: 'preparing',
        switching_chain: 'switching_chain',
        approving: 'approving',
        approve_sent: 'approve_sent',
        bridging: 'bridging',
        confirming: 'confirming',
        complete: 'done',
        error: 'error',
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
  }, [])

  // fetch quote + immediately bridge (used by MigrateWallet)
  const fetchAndBridge = useCallback(async (from: ChainId, to: ChainId, asset: Asset, amount: number) => {
    patch({
      fromChain: from,
      toChain: to,
      asset: asset,
      amount: String(amount),
      loadingRoute: true,
      route: null,
      routeError: null,
      bridgeStatus: 'preparing',
      bridgeError: null,
      migrateMode: false,
    })

    const result = await fetchLiveRoute(from, to, asset, amount, address || undefined)
    if (result.rawRoute) routeRef.current = result.rawRoute

    if (!result.route) {
      patch({ loadingRoute: false, routeError: result.error || 'No route available.' })
      return
    }

    patch({ route: result.route, loadingRoute: false })

    // Now execute the bridge
    patch({ step: 'bridge', bridgeStatus: 'preparing' })

    const execResult = await executeBridge(result.rawRoute, (status, txHash) => {
      const statusMap: Record<string, BridgeState['bridgeStatus']> = {
        preparing: 'preparing',
        switching_chain: 'switching_chain',
        approving: 'approving',
        approve_sent: 'approve_sent',
        bridging: 'bridging',
        confirming: 'confirming',
        complete: 'done',
        error: 'error',
      }
      const mapped = statusMap[status] || 'bridging'
      patch({ bridgeStatus: mapped, ...(txHash ? { txHash } : {}) })
    })

    if (execResult.success) {
      addHistory({
        id: Date.now().toString(),
        asset,
        amount,
        fromChain: from,
        toChain: to,
        status: 'completed',
        timestamp: new Date().toLocaleString(),
        txHash: execResult.txHash || 'sent',
      })
      patch({ bridgeStatus: 'done', txHash: execResult.txHash || null, step: 'complete' })
    } else {
      patch({ bridgeStatus: 'error', bridgeError: execResult.error || 'Bridge failed' })
    }
  }, [address])

  // Keep state ref for use in callbacks
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  return (
    <BridgeContext.Provider value={{
      state,
      setFromChain: (c) => patch({ fromChain: c }),
      setToChain: (c) => patch({ toChain: c }),
      setAsset: (a) => patch({ asset: a }),
      setAmount: (a) => patch({ amount: a }),
      setStep: (s) => patch({ step: s }),
      setShowNaturalInput: (v) => patch({ showNaturalInput: v }),
      setNaturalInput: (v) => patch({ naturalInput: v }),
      setMigrateMode: (v) => patch({ migrateMode: v }),
      reset: () => { setState(defaultState); routeRef.current = null },
      fetchRoute: fetchRouteFn,
      startBridge,
      fetchAndBridge,
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
