import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi'
import { fetchLiveRoute, addHistory, getRouteTxData, type LiveRoute, type RouteTxData } from '../data/chains'
import type { Route } from '@lifi/sdk'

export type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'bsc' | 'cronos'
export type Asset = 'USDC' | 'USDT' | 'ETH' | 'BTC' | 'CRO'

export interface BridgeState {
  fromChain: ChainId | null
  toChain: ChainId | null
  asset: Asset | null
  amount: string
  route: LiveRoute | null
  routeTx: RouteTxData | null
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
  startBridge: () => void
  fetchAndBridge: (from: ChainId, to: ChainId, asset: Asset, amount: number) => Promise<void>
}

const defaultState: BridgeState = {
  fromChain: null,
  toChain: null,
  asset: null,
  amount: '',
  route: null,
  routeTx: null,
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
  const stateRef = useRef<BridgeState>(state)
  const [bridgeLocked, setBridgeLocked] = useState(false)
  const { address } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()

  const patch = (partial: Partial<BridgeState>) => setState(s => ({ ...s, ...partial }))

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

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

  // Execute bridge using wagmi hooks instead of raw window.ethereum
  const executeBridge = useCallback(async (
    route: Route | null,
    onStatus: (status: string, txHash?: string) => void
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!route) {
      onStatus('error')
      return { success: false, error: 'No route data. Get a quote first.' }
    }

    const txData = getRouteTxData(route)
    if (!txData) {
      onStatus('error')
      return { success: false, error: 'No transaction data in route. The bridge tool did not return executable data.' }
    }

    try {
      onStatus('preparing')

      // Step 1: Switch to the source chain with verification
      onStatus('switching_chain')
      try {
        const switchResult = await switchChainAsync({ chainId: txData.fromChainId })
        // Verify we're actually on the correct chain after switch
        if (switchResult.id !== txData.fromChainId) {
          return { success: false, error: `Failed to verify chain switch to ${txData.fromChainId}. Please try again.` }
        }
      } catch (switchErr: any) {
        if (switchErr?.code === 4902) {
          return { success: false, error: `Chain ${txData.fromChainId} not available in your wallet.` }
        }
        // User rejected switch or other error
        return { success: false, error: 'Network switch cancelled. Please switch to the correct network manually.' }
      }

      // Step 2: Handle token approval if needed (ERC-20 tokens)
      if (txData.approvalTx) {
        onStatus('approving')
        try {
          const approveHash = await sendTransactionAsync({
            to: txData.approvalTx.to as `0x${string}`,
            data: txData.approvalTx.data as `0x${string}`,
            value: 0n,
          })
          onStatus('approve_sent', approveHash)
          
          // Wait for approval confirmation with longer timeout
          // In production, use useWaitForTransactionReceipt to verify on-chain
          await new Promise(r => setTimeout(r, 3000))
        } catch (approveErr: any) {
          const msg = approveErr?.message || ''
          if (msg.includes('User rejected') || msg.includes('user rejected')) {
            return { success: false, error: 'Token approval was cancelled.' }
          }
          return { success: false, error: `Approval failed: ${msg}` }
        }
      }

      // Step 3: Send the bridge transaction
      onStatus('bridging')
      try {
        const hash = await sendTransactionAsync({
          to: txData.tx.to as `0x${string}`,
          data: txData.tx.data as `0x${string}`,
          value: txData.tx.value ? BigInt(txData.tx.value) : 0n,
        })
        
        onStatus('confirming', hash)
        
        // Transaction was sent — success is when it's submitted to mempool
        // For cross-chain, the bridge will complete on the destination chain later
        onStatus('complete', hash)
        return { success: true, txHash: hash }
      } catch (txErr: any) {
        const msg = txErr?.message || ''
        if (msg.includes('User rejected') || msg.includes('user rejected')) {
          return { success: false, error: 'Bridge transaction was cancelled.' }
        }
        return { success: false, error: msg || 'Transaction failed.' }
      }
    } catch (e: any) {
      console.error('[BridgeFlow] Execute error:', {
        error: e?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      })
      const msg = e?.message || ''
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        return { success: false, error: 'Transaction was cancelled.' }
      }
      return { success: false, error: msg || 'Bridge failed.' }
    }
  }, [switchChainAsync, sendTransactionAsync])

  // fetch quote + immediately bridge (used by MigrateWallet)
  const fetchAndBridge = useCallback(async (from: ChainId, to: ChainId, asset: Asset, amount: number) => {
    // Prevent duplicate bridge executions
    if (bridgeLocked) {
      patch({ bridgeError: 'Bridge is already in progress. Please wait...' })
      return
    }

    setBridgeLocked(true)
    try {
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

      // Now execute the bridge via wagmi hooks
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
    } finally {
      setBridgeLocked(false)
    }
  }, [address, executeBridge, bridgeLocked])

  // Non-migrate flow: review then bridge
  const startBridge = useCallback(async () => {
    // Prevent duplicate bridge executions
    if (bridgeLocked) {
      patch({ bridgeError: 'Bridge is already in progress. Please wait...' })
      return
    }

    const rawRoute = routeRef.current
    const s = stateRef.current
    if (!rawRoute || !s.asset || !s.amount || !s.fromChain || !s.toChain) return

    setBridgeLocked(true)
    try {
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
    } finally {
      setBridgeLocked(false)
    }
  }, [executeBridge, bridgeLocked])

  // Clear routes when account changes
  useEffect(() => {
    if (!address) {
      setState(defaultState)
      routeRef.current = null
    }
  }, [address])

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
