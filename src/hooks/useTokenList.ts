"use client"

import { useState, useEffect } from "react"
import type { Token } from "../types/token"

const ZEROEX_TOKEN_LIST_URL = "https://tokens.coingecko.com/uniswap/all.json"

export function useTokenList(chainId = 1) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
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

        // Filter tokens by chainId and add some popular tokens if not present
        const filteredTokens = data.tokens.filter((token: Token) => token.chainId === chainId).slice(0, 50) // Limit to first 50 tokens for performance

        setTokens(filteredTokens)
      } catch (err) {
        console.error("Error fetching token list:", err)
        setError("Failed to load token list")

        // Fallback to hardcoded tokens
        setTokens([
          {
            chainId: 1,
            name: "Wrapped Ether",
            symbol: "WETH",
            decimals: 18,
            address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            logoURI:
              "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/weth.svg",
          },
          {
            chainId: 1,
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            logoURI:
              "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/usdc.svg",
          },
          {
            chainId: 1,
            name: "Dai Stablecoin",
            symbol: "DAI",
            decimals: 18,
            address: "0x6b175474e89094c44da98b954eedeac495271d0f",
            logoURI:
              "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/dai.svg",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTokenList()
  }, [chainId])

  return { tokens, loading, error }
}
