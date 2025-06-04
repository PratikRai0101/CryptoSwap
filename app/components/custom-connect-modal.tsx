"use client"

import { useState, useEffect } from "react"
import { X, Globe, Check, AlertCircle, Loader2 } from "lucide-react"
import { useConnect, useAccount } from "wagmi"

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

type ConnectionState = "idle" | "connecting" | "connected" | "error"

export function CustomConnectModal({ isOpen, onClose }: CustomConnectModalProps) {
  const { connectors, connect, isPending, error } = useConnect()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle")
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle connection success
  useEffect(() => {
    if (isConnected && connectionState === "connecting") {
      setConnectionState("connected")
      setTimeout(() => {
        onClose()
        setConnectionState("idle")
        setConnectingWallet(null)
      }, 1500) // Show success state for 1.5 seconds
    }
  }, [isConnected, connectionState, onClose])

  // Handle connection error
  useEffect(() => {
    if (error && connectionState === "connecting") {
      setConnectionState("error")
      setConnectionError(error.message || "Failed to connect wallet")
      setConnectingWallet(null)
      setTimeout(() => {
        setConnectionState("idle")
        setConnectionError(null)
      }, 3000) // Show error for 3 seconds
    }
  }, [error, connectionState])

  if (!mounted || !isOpen) return null

  const handleWalletConnect = async (walletId: string) => {
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
      setConnectionState("connecting")
      setConnectingWallet(walletId)
      setConnectionError(null)

      try {
        await connect({ connector })
      } catch (err) {
        console.error("Connection failed:", err)
      }
    }
  }

  const handleClose = () => {
    if (connectionState !== "connecting") {
      onClose()
      setConnectionState("idle")
      setConnectingWallet(null)
      setConnectionError(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden transform transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Connection Overlay */}
        {connectionState === "connecting" && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin">
                  <div
                    className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
                    style={{ animationDuration: "1s" }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Connecting...</h3>
                <p className="text-gray-400">
                  {connectingWallet && `Connecting to ${walletOptions.find((w) => w.id === connectingWallet)?.name}`}
                </p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {connectionState === "connected" && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                  <Check className="w-10 h-10 text-white animate-check-mark" />
                </div>
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Connected!</h3>
                <p className="text-gray-400">Wallet connected successfully</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {connectionState === "error" && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md mx-4">
              <div className="relative">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-shake">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Connection Failed</h3>
                <p className="text-gray-400 text-sm">{connectionError}</p>
                <button
                  onClick={() => {
                    setConnectionState("idle")
                    setConnectionError(null)
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

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
                onClick={handleClose}
                disabled={connectionState === "connecting"}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={connectionState === "connecting" || connectionState === "connected"}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                    connectingWallet === wallet.id
                      ? "bg-blue-600/20 border-blue-500 scale-105"
                      : connectionState === "connecting"
                        ? "bg-gray-800/30 border-gray-700/30 opacity-50 cursor-not-allowed"
                        : "bg-gray-800/50 hover:bg-gray-800 border-gray-700/50 hover:border-gray-600 hover:scale-105"
                  }`}
                >
                  {/* Loading overlay for connecting wallet */}
                  {connectingWallet === wallet.id && <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />}

                  <div
                    className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl transition-transform ${
                      connectingWallet === wallet.id ? "animate-pulse" : ""
                    }`}
                  >
                    {connectingWallet === wallet.id ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      wallet.icon
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div
                      className={`text-white font-semibold text-lg transition-colors ${
                        connectingWallet === wallet.id
                          ? "text-blue-400"
                          : connectionState === "connecting"
                            ? "text-gray-500"
                            : "group-hover:text-blue-400"
                      }`}
                    >
                      {wallet.name}
                    </div>
                    {wallet.installed && <div className="text-green-400 text-sm font-medium">Installed</div>}
                    {connectingWallet === wallet.id && (
                      <div className="text-blue-400 text-sm font-medium animate-pulse">Connecting...</div>
                    )}
                  </div>

                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      connectingWallet === wallet.id
                        ? "bg-blue-400 animate-ping"
                        : connectionState === "connecting"
                          ? "bg-gray-600"
                          : "bg-gray-600 group-hover:bg-blue-400"
                    }`}
                  />
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
                <div
                  className={`absolute inset-0 bg-blue-500/20 rounded-full blur-xl transition-all duration-1000 ${
                    connectionState === "connecting" ? "animate-pulse scale-110" : "animate-pulse"
                  }`}
                />

                {/* Main globe */}
                <div className="relative w-full h-full">
                  <Globe
                    className={`w-full h-full text-blue-400 transition-all duration-1000 ${
                      connectionState === "connecting"
                        ? "animate-spin text-blue-300"
                        : connectionState === "connected"
                          ? "text-green-400"
                          : "animate-spin"
                    }`}
                    style={{ animationDuration: connectionState === "connecting" ? "2s" : "20s" }}
                  />

                  {/* Grid lines overlay */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${
                      connectionState === "connected" ? "border-green-400/30" : "border-blue-400/30"
                    }`}
                  />
                  <div
                    className={`absolute inset-4 rounded-full border transition-colors duration-500 ${
                      connectionState === "connected" ? "border-green-400/20" : "border-blue-400/20"
                    }`}
                  />
                  <div
                    className={`absolute inset-8 rounded-full border transition-colors duration-500 ${
                      connectionState === "connected" ? "border-green-400/10" : "border-blue-400/10"
                    }`}
                  />

                  {/* Horizontal lines */}
                  <div
                    className={`absolute top-1/2 left-0 right-0 h-px transform -translate-y-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/30" : "bg-blue-400/30"
                    }`}
                  />
                  <div
                    className={`absolute top-1/3 left-0 right-0 h-px transform -translate-y-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/20" : "bg-blue-400/20"
                    }`}
                  />
                  <div
                    className={`absolute top-2/3 left-0 right-0 h-px transform -translate-y-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/20" : "bg-blue-400/20"
                    }`}
                  />

                  {/* Vertical lines */}
                  <div
                    className={`absolute top-0 bottom-0 left-1/2 w-px transform -translate-x-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/30" : "bg-blue-400/30"
                    }`}
                  />
                  <div
                    className={`absolute top-0 bottom-0 left-1/3 w-px transform -translate-x-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/20" : "bg-blue-400/20"
                    }`}
                  />
                  <div
                    className={`absolute top-0 bottom-0 left-2/3 w-px transform -translate-x-1/2 transition-colors duration-500 ${
                      connectionState === "connected" ? "bg-green-400/20" : "bg-blue-400/20"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white leading-tight">
                {connectionState === "connected" ? (
                  <>
                    Welcome to the
                    <br />
                    decentralized world
                  </>
                ) : (
                  <>
                    Your gateway to the
                    <br />
                    decentralized world
                  </>
                )}
              </h3>

              <p className="text-gray-400 text-lg">
                {connectionState === "connecting"
                  ? "Establishing connection..."
                  : connectionState === "connected"
                    ? "You're all set to start trading!"
                    : "Connect a wallet to get started"}
              </p>

              {connectionState === "idle" && (
                <button className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  New to wallets?
                </button>
              )}
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
