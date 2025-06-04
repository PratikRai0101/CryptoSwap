"use client"

import { useState, useEffect } from "react"
import { X, Globe } from "lucide-react"
import { useConnect } from "wagmi"

interface WalletOption {
  id: string
  name: string
  icon: string
  installed?: boolean
  connector?: any
}

const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    installed: typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "👻",
    installed: typeof window !== "undefined" && !!(window as any).phantom?.ethereum,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🛡️",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
  },
  {
    id: "zerion",
    name: "Zerion Wallet",
    icon: "⚡",
  },
]

interface CustomConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomConnectModal({ isOpen, onClose }: CustomConnectModalProps) {
  const { connectors, connect } = useConnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const handleWalletConnect = (walletId: string) => {
    const connector = connectors.find((c) => {
      const name = c.name.toLowerCase()
      if (walletId === "metamask" && name.includes("metamask")) return true
      if (walletId === "coinbase" && name.includes("coinbase")) return true
      if (walletId === "walletconnect" && name.includes("walletconnect")) return true
      if (walletId === "rainbow" && name.includes("rainbow")) return true
      if (walletId === "trust" && name.includes("trust")) return true
      return false
    })

    if (connector) {
      connect({ connector })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Left Panel - Wallet List */}
          <div className="w-1/2 p-8 border-r border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-900 rounded-sm flex items-center justify-center">
                    <div className="w-4 h-1 bg-white rounded-full" />
                    <div className="w-1 h-4 bg-white rounded-full ml-1" />
                    <div className="w-4 h-1 bg-white rounded-full ml-1" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">Connect</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Wallet Options */}
            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletConnect(wallet.id)}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                    {wallet.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {wallet.name}
                    </div>
                    {wallet.installed && <div className="text-green-400 text-sm font-medium">Installed</div>}
                  </div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Info */}
          <div className="w-1/2 p-8 flex flex-col items-center justify-center text-center">
            {/* Globe Animation */}
            <div className="relative mb-8">
              <div className="w-48 h-48 relative">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />

                {/* Main globe */}
                <div className="relative w-full h-full">
                  <Globe className="w-full h-full text-blue-400 animate-spin" style={{ animationDuration: "20s" }} />

                  {/* Grid lines overlay */}
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/30" />
                  <div className="absolute inset-4 rounded-full border border-blue-400/20" />
                  <div className="absolute inset-8 rounded-full border border-blue-400/10" />

                  {/* Horizontal lines */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30 transform -translate-y-1/2" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-blue-400/20 transform -translate-y-1/2" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-blue-400/20 transform -translate-y-1/2" />

                  {/* Vertical lines */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-400/30 transform -translate-x-1/2" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-blue-400/20 transform -translate-x-1/2" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-blue-400/20 transform -translate-x-1/2" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white leading-tight">
                Your gateway to the
                <br />
                decentralized world
              </h3>

              <p className="text-gray-400 text-lg">Connect a wallet to get started</p>

              <button className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                New to wallets?
              </button>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <span>Powered by</span>
                <div className="flex items-center space-x-1 font-semibold">
                  <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-gray-900 rounded-full" />
                    <div className="w-0.5 h-2 bg-gray-900 rounded-full ml-0.5" />
                    <div className="w-2 h-0.5 bg-gray-900 rounded-full ml-0.5" />
                  </div>
                  <span>CryptoSwap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
