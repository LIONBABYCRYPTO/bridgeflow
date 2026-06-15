import { useAccount } from 'wagmi'
import { BridgeProvider } from './context/BridgeContext'
import Header from './components/Header'
import Hero from './components/Hero'
import BridgeWidget from './components/BridgeWidget'
import History from './components/History'
import Footer from './components/Footer'

export default function App() {
  const { isConnected } = useAccount()

  return (
    <BridgeProvider>
      <div className="min-h-screen bg-bg-primary">
        <Header />
        {!isConnected ? (
          <Hero />
        ) : (
          <main className="max-w-lg mx-auto px-4 pb-32 pt-8 space-y-10">
            <BridgeWidget />
            <History />
          </main>
        )}
        <Footer />
      </div>
    </BridgeProvider>
  )
}
