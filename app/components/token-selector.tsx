"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, ChevronDown } from "lucide-react"
import type { Token } from "../../src/types/token"
import { LoadingSpinner } from "./loading-spinner"

interface TokenSelectorProps {
  tokens: Token[]
  selectedToken: string
  onTokenSelect: (tokenSymbol: string) => void
  loading?: boolean
  label: string
}

export function TokenSelector({ tokens, selectedToken, onTokenSelect, loading, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedTokenData = tokens.find((token) => token.symbol.toLowerCase() === selectedToken)

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {selectedTokenData && (
            <Image
              src={selectedTokenData.logoURI || "/placeholder.svg"}
              alt={selectedTokenData.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="font-medium">{selectedTokenData?.symbol || "Select Token"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-60">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-500">Loading tokens...</span>
              </div>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onTokenSelect(token.symbol.toLowerCase())
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Image
                    src={token.logoURI || "/placeholder.svg"}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500 truncate">{token.name}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No tokens found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
