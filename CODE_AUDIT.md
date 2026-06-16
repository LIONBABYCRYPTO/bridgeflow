# BridgeFlow Code Audit Report

**Date:** June 16, 2026  
**Repository:** LIONBABYCRYPTO/bridgeflow  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

Your cross-chain bridge application has a **solid architecture** using LI.FI SDK, Wagmi, and React. However, there are **3 critical bugs**, **4 medium issues**, and **3 code quality concerns** that must be addressed before production use.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing State Reference in `startBridge()` (BridgeContext.tsx)**

**Location:** `src/context/BridgeContext.tsx`, lines 233-270  
**Severity:** 🔴 CRITICAL - Function will crash

**Problem:**
```typescript
const startBridge = useCallback(async () => {
  const rawRoute = routeRef.current
  const s = stateRef.current  // ❌ stateRef not defined at this point
  if (!rawRoute || !s.asset || !s.amount || !s.fromChain || !s.toChain) return
```

`stateRef` is defined **AFTER** `startBridge` on line 272. JavaScript hoisting won't work here because it's inside a useCallback scope.

**Fix:**
```typescript
// Move stateRef definition BEFORE startBridge
const stateRef = useRef(state)
useEffect(() => { stateRef.current = state }, [state])

const startBridge = useCallback(async () => {
  const rawRoute = routeRef.current
  const s = stateRef.current  // ✅ Now stateRef exists
  // ... rest of logic
}, [executeBridge, stateRef]) // Add stateRef to dependencies
```

---

### 2. **Token Approval Data Bug in `getRouteTxData()` (chains.ts)**

**Location:** `src/data/chains.ts`, lines 291-298  
**Severity:** 🔴 CRITICAL - Approval transactions will fail

**Problem:**
```typescript
// Check if approval is needed
const approvalAddress = estimate?.approvalAddress
if (approvalAddress) {
  result.approvalTx = {
    to: approvalAddress,
    data: txRequest.data,  // ❌ WRONG! This is the BRIDGE call data, not approval
  }
}
```

You're copying the **bridge transaction data** into the approval call. This will cause the approval to fail because:
- Bridge data is contract-specific, not ERC-20 approval data
- LI.FI step.transactionRequest should contain separate approval instructions

**Fix:**
```typescript
const stepsTxs = Array.isArray(step) ? step : [step]
const approvalStep = stepsTxs.find((s: any) => s.action?.type === 'approve')

if (approvalStep?.transactionRequest) {
  result.approvalTx = {
    to: approvalStep.transactionRequest.to,
    data: approvalStep.transactionRequest.data, // ✅ Correct approval data
  }
}
```

---

### 3. **Missing Error Handling in `executeBridge()` (BridgeContext.tsx)**

**Location:** `src/context/BridgeContext.tsx`, lines 87-170  
**Severity:** 🔴 CRITICAL - Transactions silently fail

**Problem:**
```typescript
// Step 1: Switch chain
onStatus('switching_chain')
try {
  await switchChainAsync({ chainId: txData.fromChainId })
} catch (switchErr: any) {
  // Catches errors, but...
}

// Step 2: What if user is NOT on the right chain after catch?
// Code proceeds anyway with wrong chain!
```

If chain switching fails or times out, the code continues to send transactions on the wrong network.

**Fix:**
```typescript
// Step 1: Switch to source chain with verification
onStatus('switching_chain')
try {
  const currentChainId = (await switchChainAsync({ chainId: txData.fromChainId })).chainId
  if (currentChainId !== txData.fromChainId) {
    throw new Error(`Failed to switch to chain ${txData.fromChainId}`)
  }
} catch (switchErr: any) {
  if (switchErr?.code === 4902) {
    return { success: false, error: `Chain ${txData.fromChainId} not available in your wallet.` }
  }
  return { success: false, error: 'Network switch failed. Please try again.' }
}
```

---

## 🟠 MEDIUM ISSUES

### 4. **Race Condition in `fetchAndBridge()` (BridgeContext.tsx)**

**Location:** `src/context/BridgeContext.tsx`, lines 173-230  
**Severity:** 🟠 MEDIUM - Multiple bridges could execute simultaneously

**Problem:**
```typescript
const fetchAndBridge = useCallback(async (from, to, asset, amount) => {
  patch({ fromChain: from, toChain: to, ... })
  const result = await fetchLiveRoute(...)
  // ❌ No debounce/lock - if user clicks "Bridge All" twice, this runs twice
  const execResult = await executeBridge(...)
})
```

No prevention of duplicate bridge executions if user clicks multiple times.

**Fix:** Add a lock flag
```typescript
const [bridgeLocked, setBridgeLocked] = useState(false)

const fetchAndBridge = useCallback(async (...) => {
  if (bridgeLocked) return
  setBridgeLocked(true)
  try {
    // ... bridge logic
  } finally {
    setBridgeLocked(false)
  }
}, [bridgeLocked, ...])
```

---

### 5. **Incorrect Token Decimal Handling (chains.ts)**

**Location:** `src/data/chains.ts`, line 165  
**Severity:** 🟠 MEDIUM - Estimation might be inaccurate

**Problem:**
```typescript
const toDecimals = getAssetDecimals(asset)  // ❌ Should use destination chain decimals
const receive = parseFloat(est.toAmountMin) / (10 ** toDecimals) || amount * 0.995
```

`est.toAmountMin` is already in smallest units for the **destination token**, but you're assuming the same decimals as the source asset. Different chains may have different token specs.

**Fix:**
```typescript
// LI.FI returns toAmountMin already adjusted - just convert from wei
const receive = parseFloat(est.toAmountMin) / 1e18  // Standard 18 decimals
// OR better: let LI.FI handle decimal conversion in its result
```

---

### 6. **Missing Account Change Listener (BridgeContext.tsx)**

**Location:** `src/context/BridgeContext.tsx`, lines 64-84  
**Severity:** 🟠 MEDIUM - Stale user data in routes

**Problem:**
```typescript
const fetchRouteFn = useCallback(async (from, to, asset, amount) => {
  const result = await fetchLiveRoute(from, to, asset, amount, address || undefined)
  // ...
}, [address])  // ✅ Good dependency, but no listener for address changes

// If user switches wallet address, routes aren't invalidated
```

When user changes connected wallet, existing routes should be cleared.

**Fix:**
```typescript
useEffect(() => {
  if (address !== state.address) {
    setState(defaultState)  // Clear routes on account change
  }
}, [address])
```

---

### 7. **Weak Approval Detection (chains.ts)**

**Location:** `src/data/chains.ts`, line 292  
**Severity:** 🟠 MEDIUM - May not catch all approval scenarios

**Problem:**
```typescript
const approvalAddress = estimate?.approvalAddress
```

Some bridge protocols return approval data differently. This single check is too simplistic.

**Fix:**
```typescript
const needsApproval = 
  estimate?.approvalAddress || 
  step.action?.type === 'approve' ||
  (step.transactionRequest?.data?.includes('095ea7b3'))  // approve() function selector
```

---

## 🟡 CODE QUALITY ISSUES

### 8. **TypeScript `@ts-ignore` Comments (chains.ts)**

**Location:** `src/data/chains.ts`, line 157-158  
**Severity:** 🟡 MEDIUM - Masks type errors

```typescript
// @ts-ignore - SDK v4 types
const est = result.estimate
```

This hides type mismatches. The LI.FI SDK types should be properly imported.

**Fix:** Update type imports:
```typescript
import type { Step, Quote } from '@lifi/sdk'

const est = (result as Quote).estimate
```

---

### 9. **No Timeout on Bridge Transactions (BridgeContext.tsx)**

**Location:** `src/context/BridgeContext.tsx`, line 130  
**Severity:** 🟡 MEDIUM - Users stuck in "confirming" state

```typescript
// Wait for approval confirmation
await new Promise(r => setTimeout(r, 2000))  // ❌ Hardcoded 2 seconds
```

This simple timeout doesn't actually confirm the approval on-chain.

**Fix:**
```typescript
import { useWaitForTransactionReceipt } from 'wagmi'

// In component or context
const { data: approvalReceipt } = useWaitForTransactionReceipt({
  hash: approveHash,
  confirmation: 1,
})

// Wait for receipt instead of arbitrary delay
```

---

### 10. **Missing Error Logging (chains.ts)**

**Location:** `src/data/chains.ts`, line 238-241  
**Severity:** 🟡 LOW - Hard to debug

```typescript
} catch (e) {
  console.warn('Failed to fetch wallet balances:', e)
  return []
}
```

No structured error logging. Users won't know why balances failed to load.

**Fix:**
```typescript
} catch (e) {
  const errorMsg = e instanceof Error ? e.message : String(e)
  console.error('[BridgeFlow] Wallet balance fetch failed:', {
    error: errorMsg,
    address,
    timestamp: new Date().toISOString(),
  })
  return []
}
```

---

## ✅ WHAT'S WORKING WELL

1. **LI.FI SDK Integration** - Good use of `getQuote` and `convertQuoteToRoute`
2. **Wagmi Hooks** - Proper use of `useSwitchChain` and `sendTransactionAsync`
3. **State Management** - BridgeContext pattern is clean
4. **UI/UX** - Beautiful animations with Framer Motion
5. **Chain Support** - Good multi-chain support (7 chains)
6. **Mobile Responsive** - Tailwind CSS classes are well-structured

---

## 🛠️ PRIORITY FIX ORDER

| Priority | Issue | Fix Time |
|----------|-------|----------|
| 🔴 P0 | stateRef hoisting | 5 min |
| 🔴 P0 | Approval data bug | 10 min |
| 🔴 P0 | Chain switch verification | 10 min |
| 🟠 P1 | Race condition | 15 min |
| 🟠 P1 | Account change listener | 10 min |
| 🟡 P2 | TypeScript types | 20 min |
| 🟡 P2 | Timeout handling | 15 min |

---

## 📋 TESTING CHECKLIST

After fixes, test:

- [ ] Bridge USDC from Ethereum to Base
- [ ] Bridge ETH requiring approval across chains
- [ ] Switch wallet address mid-transfer
- [ ] Click "Bridge All" twice rapidly
- [ ] Network connection loss during approval
- [ ] Unsupported token/chain pair error handling
- [ ] Mobile responsiveness on all flows

---

## 📞 RECOMMENDATIONS

1. **Add Integration Tests** for bridge flows (currently none)
2. **Implement Sentry/LogRocket** for production error tracking
3. **Add Transaction Monitoring** - track status on destination chain
4. **Rate Limiting** - prevent spam bridge requests
5. **Wallet Balance Caching** - reduce API calls to LI.FI

---

**Report Generated:** 2026-06-16  
**Audit Tool:** GitHub Copilot Code Review
