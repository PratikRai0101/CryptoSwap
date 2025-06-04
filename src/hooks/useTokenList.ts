"use client"

import { useState, useEffect } from "react"
import type { Token } from "../types/token"

// Hardcoded popular tokens including the ones you requested
const POPULAR_TOKENS: Token[] = [
  {
    chainId: 1,
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/weth.svg",
  },
  {
    chainId: 1,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/usdc.svg",
  },
  {
    chainId: 1,
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    logoURI: "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/dai.svg",
  },
  {
    chainId: 1,
    name: "FLOKI",
    symbol: "FLOKI",
    decimals: 9,
    address: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e",
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/c37119334a24f9933f373c6cc028a5bdbad2ecb4/blockchains/ethereum/assets/0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E/logo.png",
  },
]

const ZEROEX_TOKEN_LIST_URL = "https://tokens.coingecko.com/uniswap/all.json"

export function useTokenList(chainId = 1) {
  const [tokens, setTokens] = useState<Token[]>(POPULAR_TOKENS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTokenList() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(ZEROEX_TOKEN_LIST_URL)
        if (!response.ok) {
          throw new Error("Failed to fetch token list")
        }

        const data = await response.json()

        // Filter tokens by chainId and merge with popular tokens
        const filteredTokens = data.tokens.filter((token: Token) => token.chainId === chainId).slice(0, 30) // Limit for performance

        // Merge popular tokens with fetched tokens, avoiding duplicates
        const allTokens = [...POPULAR_TOKENS]
        filteredTokens.forEach((token: Token) => {
          if (!allTokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
            allTokens.push(token)
          }
        })

        setTokens(allTokens)
      } catch (err) {
        console.error("Error fetching token list:", err)
        setError("Failed to load additional tokens")
        // Keep popular tokens as fallback
        setTokens(POPULAR_TOKENS)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenList()
  }, [chainId])

  return { tokens, loading, error }
}
