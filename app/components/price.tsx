"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useEffect, useState } from "react"
import { formatUnits, parseUnits } from "ethers"
import { useReadContract, useBalance, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { erc20Abi, type Address } from "viem"
import { MAX_ALLOWANCE, AFFILIATE_FEE, FEE_RECIPIENT } from "../../src/constants"
import { useTokenList } from "../../src/hooks/useTokenList"
import { TokenSelector } from "./token-selector"
import { SwapAnimation } from "./swap-animation"
import { LoadingSpinner } from "./loading-spinner"
import { CustomConnectModal } from "./custom-connect-modal"
import { Settings, Sun, Moon, Wallet, ChevronDown } from "lucide-react"
import qs from "qs"

export default function PriceView({
  price,
  taker,
  setPrice,
  setFinalize,
  chainId,
}: {
  price: any
  taker: Address | undefined
  setPrice: (price: any) => void
  setFinalize: (finalize: boolean) => void
  chainId: number
}) {
  const [sellToken, setSellToken] = useState("weth")
  const [buyToken, setBuyToken] = useState("usdc")
  const [sellAmount, setSellAmount] = useState("")
  const [buyAmount, setBuyAmount] = useState("")
  const [tradeDirection, setTradeDirection] = useState("sell")
  const [error, setError] = useState([])
  const [buyTokenTax, setBuyTokenTax] = useState({
    buyTaxBps: "0",
    sellTaxBps: "0",
  })
  const [sellTokenTax, setSellTokenTax] = useState({
    buyTaxBps: "0",
    sellTaxBps: "0",
  })
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  )
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)

  // Use dynamic token list
  const { tokens, loading: tokensLoading } = useTokenList(chainId)

  // Create token mappings from dynamic list
  const tokensBySymbol = tokens.reduce(
    (acc, token) => {
      acc[token.symbol.toLowerCase()] = token
      return acc
    },
    {} as Record<string, any>,
  )

  const sellTokenObject = tokensBySymbol[sellToken]
  const buyTokenObject = tokensBySymbol[buyToken]

  const sellTokenDecimals = sellTokenObject?.decimals || 18
  const buyTokenDecimals = buyTokenObject?.decimals || 18
  const sellTokenAddress = sellTokenObject?.address

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell" ? parseUnits(sellAmount, sellTokenDecimals).toString() : undefined

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy" ? parseUnits(buyAmount, buyTokenDecimals).toString() : undefined

  // Fetch price data and set the buyAmount whenever the sellAmount changes
  useEffect(() => {
    if (!sellTokenObject || !buyTokenObject || !sellAmount) return

    const params = {
      chainId: chainId,
      sellToken: sellTokenAddress,
      buyToken: buyTokenObject.address,
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      taker,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: buyTokenObject.address,
      tradeSurplusRecipient: FEE_RECIPIENT,
    }

    async function main() {
      setIsLoadingPrice(true)
      try {
        const response = await fetch(`/api/price?${qs.stringify(params)}`)
        const data = await response.json()

        if (data?.validationErrors?.length > 0) {
          setError(data.validationErrors)
        } else {
          setError([])
        }
        if (data.buyAmount) {
          setBuyAmount(formatUnits(data.buyAmount, buyTokenDecimals))
          setPrice(data)
        }
        if (data?.tokenMetadata) {
          setBuyTokenTax(data.tokenMetadata.buyToken)
          setSellTokenTax(data.tokenMetadata.sellToken)
        }
      } catch (err) {
        console.error("Error fetching price:", err)
      } finally {
        setIsLoadingPrice(false)
      }
    }

    if (sellAmount !== "") {
      main()
    }
  }, [sellTokenAddress, buyTokenObject, parsedSellAmount, parsedBuyAmount, chainId, sellAmount, setPrice])

  // Hook for fetching balance information for specified token for a specific taker address
  const { data: balanceData } = useBalance({
    address: taker,
    token: sellTokenAddress as Address,
  })

  const inSufficientBalance =
    balanceData && sellAmount ? parseUnits(sellAmount, sellTokenDecimals) > balanceData.value : true

  // Helper function to format tax basis points to percentage
  const formatTax = (taxBps: string) => (Number.parseFloat(taxBps) / 100).toFixed(2)

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.body.style.backgroundColor = "#0f172a"
    } else {
      document.documentElement.classList.remove("dark")
      document.body.style.backgroundColor = "#f8fafc"
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const handleSwapTokens = () => {
    setIsSwapping(true)
    setTimeout(() => {
      const tempToken = sellToken
      const tempAmount = sellAmount
      setSellToken(buyToken)
      setBuyToken(tempToken)
      setSellAmount(buyAmount)
      setBuyAmount(tempAmount)
      setIsSwapping(false)
    }, 300)
  }

  // Hooks for ERC20 allowance
  const spender = price?.issues.allowance?.spender
  const shouldFetchAllowance = Boolean(taker && spender && sellTokenAddress)
  const { data: allowance, refetch } = useReadContract({
    address: shouldFetchAllowance ? (sellTokenAddress as Address) : undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: shouldFetchAllowance ? [taker as Address, spender as Address] : undefined,
  })

  const { data: simulateApproveData } = useSimulateContract({
    address: sellTokenAddress as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, MAX_ALLOWANCE],
  })

  const { data: writeContractResult, writeContractAsync: writeContract } = useWriteContract()

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: writeContractResult,
  })

  useEffect(() => {
    if (simulateApproveData) {
      refetch()
    }
  }, [simulateApproveData, refetch])

  if (tokensLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading tokens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Custom Connect Modal */}
      <CustomConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CryptoSwap</h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">by Pratik</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Custom Connect Button */}
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowConnectModal(true)
                              }}
                              type="button"
                              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              <Wallet className="w-4 h-4" />
                              <span>Connect Wallet</span>
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openChainModal()
                              }}
                              type="button"
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Wrong network
                            </button>
                          )
                        }

                        return (
                          <div className="flex items-center space-x-2">
                            {/* Chain Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (openChainModal) {
                                  openChainModal()
                                }
                              }}
                              type="button"
                              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? "Chain icon"}
                                      src={chain.iconUrl || "/placeholder.svg"}
                                      style={{ width: 16, height: 16 }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="text-sm font-medium">{chain.name}</span>
                            </button>

                            {/* Account Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (openAccountModal) {
                                  openAccountModal()
                                }
                              }}
                              type="button"
                              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {account.displayName?.[0]?.toUpperCase() || "?"}
                                </span>
                              </div>
                              <span className="text-sm font-medium max-w-[100px] truncate">
                                {account.displayName || "Unknown"}
                              </span>
                              <ChevronDown className="w-4 h-4 opacity-60" />
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Swap Interface Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Swap</h2>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Swap Form */}
          <div className="p-6 space-y-4">
            {/* Sell Token Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">You pay</label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                <TokenSelector tokens={tokens} selectedToken={sellToken} onTokenSelect={setSellToken} label="" />
                <input
                  value={sellAmount}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  type="number"
                  onChange={(e) => {
                    setTradeDirection("sell")
                    setSellAmount(e.target.value)
                  }}
                />
                {balanceData && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {Number(formatUnits(balanceData.value, sellTokenDecimals)).toFixed(4)}{" "}
                    {sellTokenObject?.symbol}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Animation */}
            <div className="flex justify-center">
              <SwapAnimation isSwapping={isSwapping} onSwap={handleSwapTokens} />
            </div>

            {/* Buy Token Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">You receive</label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                <TokenSelector tokens={tokens} selectedToken={buyToken} onTokenSelect={setBuyToken} label="" />
                <div className="relative">
                  <input
                    value={buyAmount}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                    type="number"
                    disabled
                  />
                  {isLoadingPrice && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fee Information */}
            {(price?.fees?.integratorFee?.amount ||
              buyTokenTax.buyTaxBps !== "0" ||
              sellTokenTax.sellTaxBps !== "0") && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-1">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Transaction Details</div>
                {price?.fees?.integratorFee?.amount && (
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Affiliate Fee:{" "}
                    {Number(formatUnits(BigInt(price.fees.integratorFee.amount), buyTokenDecimals)).toFixed(6)}{" "}
                    {buyTokenObject?.symbol}
                  </div>
                )}
                {buyTokenTax.buyTaxBps !== "0" && (
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {buyTokenObject?.symbol} Buy Tax: {formatTax(buyTokenTax.buyTaxBps)}%
                  </div>
                )}
                {sellTokenTax.sellTaxBps !== "0" && (
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {sellTokenObject?.symbol} Sell Tax: {formatTax(sellTokenTax.sellTaxBps)}%
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            {taker ? (
              <ApproveOrReviewButton
                sellTokenAddress={sellTokenAddress as Address}
                taker={taker}
                onClick={() => setFinalize(true)}
                disabled={inSufficientBalance}
                price={price}
                allowance={allowance}
                writeContract={writeContract}
                isApproving={isApproving}
              />
            ) : (
              <div className="pt-4">
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  onClick={() => setShowConnectModal(true)}
                  type="button"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Connect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ApproveOrReviewButton({
  taker,
  onClick,
  sellTokenAddress,
  disabled,
  price,
  allowance,
  writeContract,
  isApproving,
}: {
  taker: Address
  onClick: () => void
  sellTokenAddress: Address
  disabled?: boolean
  price: any
  allowance: any
  writeContract: any
  isApproving: boolean
}) {
  if (price?.issues.allowance === null) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
      >
        {disabled ? "Insufficient Balance" : "Review Trade"}
      </button>
    )
  }

  if (allowance === BigInt(0)) {
    return (
      <button
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center"
        onClick={async () => {
          try {
            await writeContract({
              abi: erc20Abi,
              address: sellTokenAddress,
              functionName: "approve",
              args: [price?.issues.allowance?.spender, MAX_ALLOWANCE],
            })
          } catch (err: any) {
            if (err?.message?.includes("User denied transaction signature")) {
              window.alert("Transaction rejected in wallet. Please approve the transaction to continue.")
            } else {
              window.alert("Error: " + (err?.message || "Unknown error"))
            }
          }
        }}
      >
        {isApproving ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Approving...</span>
          </>
        ) : (
          "Approve Token"
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
    >
      {disabled ? "Insufficient Balance" : "Review Trade"}
    </button>
  )
}
