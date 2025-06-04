"use client"

import * as React from "react"
import { RainbowKitProvider, connectorsForWallets, lightTheme, darkTheme } from "@rainbow-me/rainbowkit"
import {
  coinbaseWallet,
  metaMaskWallet,
  argentWallet,
  trustWallet,
  ledgerWallet,
  rainbowWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { mainnet } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, http } from "wagmi"

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string
coinbaseWallet.preference = "smartWalletOnly"

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended Wallet",
      wallets: [coinbaseWallet],
    },
    {
      groupName: "Other",
      wallets: [rainbowWallet, metaMaskWallet, argentWallet, trustWallet, ledgerWallet, injectedWallet],
    },
  ],
  {
    appName: "CryptoSwap by Pratik",
    projectId,
  },
)

const config = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  connectors,
  ssr: true,
  transports: { [mainnet.id]: http() },
})

const queryClient = new QueryClient()

// Custom theme configuration
const customLightTheme = lightTheme({
  accentColor: "#3b82f6",
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
})

const customDarkTheme = darkTheme({
  accentColor: "#3b82f6",
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }

    checkDarkMode()

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div style={{ padding: "20px" }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={isDarkMode ? customDarkTheme : customLightTheme}
            modalSize="compact"
            appInfo={{
              appName: "CryptoSwap by Pratik",
              learnMoreUrl: "https://cryptoswap.com/learn",
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}
