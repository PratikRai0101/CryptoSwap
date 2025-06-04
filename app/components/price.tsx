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

  const tokensByAddress = tokens.reduce(
    (acc, token) => {
      acc[token.address.toLowerCase()] = token
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
  }, [sellTokenAddress, buyTokenObject?.address, parsedSellAmount, parsedBuyAmount, chainId, sellAmount, setPrice])

  // Hook for fetching balance information for specified token for a specific taker address
  const { data, isError, isLoading } = useBalance({
    address: taker,
    token: sellTokenAddress as Address,
  })

  const inSufficientBalance = data && sellAmount ? parseUnits(sellAmount, sellTokenDecimals) > data.value : true

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
  const { data: allowance, refetch } = useReadContract({
    address: sellTokenAddress as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [taker, spender],
  })

  const { data: simulateApproveData } = useSimulateContract({
    address: sellTokenAddress as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, MAX_ALLOWANCE],
  })

  const { data: writeContractResult, writeContractAsync: writeContract } = useWriteContract()

  const { data: approvalReceiptData, isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: writeContractResult,
  })

  useEffect(() => {
    if (simulateApproveData) {
      refetch()
    }
  }, [simulateApproveData, refetch])

  if (tokensLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg">Loading tokens...</span>
      </div>
    )
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: 0, top: 0, padding: 8 }}>
          <button
            onClick={toggleTheme}
            className="rounded px-3 py-1 border border-gray-400 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <ConnectButton />
      </header>

      <div className="container mx-auto p-10 max-w-md">
        <header className="text-center py-4">
          <h1 className="text-3xl font-bold">CryptoSwap by Pratik</h1>
        </header>

        <div className="bg-slate-200 dark:bg-slate-800 p-6 rounded-lg mb-3 space-y-4">
          {/* Sell Token Section */}
          <div>
            <TokenSelector tokens={tokens} selectedToken={sellToken} onTokenSelect={setSellToken} label="Sell" />
            <div className="mt-2">
              <input
                id="sell-amount"
                value={sellAmount}
                placeholder="0.0"
                className="w-full h-12 px-4 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                onChange={(e) => {
                  setTradeDirection("sell")
                  setSellAmount(e.target.value)
                }}
              />
            </div>
          </div>

          {/* Swap Animation */}
          <SwapAnimation isSwapping={isSwapping} onSwap={handleSwapTokens} />

          {/* Buy Token Section */}
          <div>
            <TokenSelector tokens={tokens} selectedToken={buyToken} onTokenSelect={setBuyToken} label="Buy" />
            <div className="mt-2 relative">
              <input
                id="buy-amount"
                value={buyAmount}
                placeholder="0.0"
                className="w-full h-12 px-4 text-lg rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed"
                type="number"
                disabled
                onChange={(e) => {
                  setTradeDirection("buy")
                  setBuyAmount(e.target.value)
                }}
              />
              {isLoadingPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Fee and Tax Information */}
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {price && price.fees?.integratorFee?.amount && (
              <div>
                Affiliate Fee:{" "}
                {Number(formatUnits(BigInt(price.fees.integratorFee.amount), buyTokenDecimals)).toFixed(6)}{" "}
                {buyTokenObject?.symbol}
              </div>
            )}
            {buyTokenTax.buyTaxBps !== "0" && (
              <div>
                {buyTokenObject?.symbol} Buy Tax: {formatTax(buyTokenTax.buyTaxBps)}%
              </div>
            )}
            {sellTokenTax.sellTaxBps !== "0" && (
              <div>
                {sellTokenObject?.symbol} Sell Tax: {formatTax(sellTokenTax.sellTaxBps)}%
              </div>
            )}
          </div>
        </div>

        {taker ? (
          <ApproveOrReviewButton
            sellTokenAddress={sellTokenAddress as Address}
            taker={taker}
            onClick={() => {
              setFinalize(true)
            }}
            disabled={inSufficientBalance}
            price={price}
            allowance={allowance}
            writeContract={writeContract}
            isApproving={isApproving}
          />
        ) : (
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
                          className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={openConnectModal}
                          type="button"
                        >
                          Connect Wallet
                        </button>
                      )
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="w-full bg-red-600 text-white font-semibold p-3 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Wrong network
                        </button>
                      )
                    }

                    return (
                      <div className="flex gap-2">
                        <button
                          onClick={openChainModal}
                          className="flex items-center justify-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          type="button"
                        >
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
                        >
                          {account.displayName}
                          {account.displayBalance ? ` (${account.displayBalance})` : ""}
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        )}
      </div>
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
        className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {disabled ? "Insufficient Balance" : "Review Trade"}
      </button>
    )
  }

  if (allowance === 0n) {
    return (
      <button
        type="button"
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        onClick={async () => {
          await writeContract({
            abi: erc20Abi,
            address: sellTokenAddress,
            functionName: "approve",
            args: [price?.issues.allowance?.spender, MAX_ALLOWANCE],
          })
        }}
      >
        {isApproving ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Approving…</span>
          </>
        ) : (
          "Approve"
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {disabled ? "Insufficient Balance" : "Review Trade"}
    </button>
  )
}
