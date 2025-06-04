"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, ChevronDown } from "lucide-react"
import type { Token } from "../../src/types/token"

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedTokenData && (
            <Image
              src={selectedTokenData.logoURI || "/placeholder.svg"}
              alt={selectedTokenData.symbol}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">{selectedTokenData?.symbol || "Select"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{selectedTokenData?.name || "Choose token"}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-60">
              {filteredTokens.length > 0 ? (
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
                      <div className="font-medium text-gray-900 dark:text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{token.name}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No tokens found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
