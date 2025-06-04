"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"

interface SwapAnimationProps {
  isSwapping: boolean
  onSwap: () => void
}

export function SwapAnimation({ isSwapping, onSwap }: SwapAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isSwapping) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isSwapping])

  return (
    <div className="flex justify-center my-4">
      <button
        onClick={onSwap}
        disabled={isSwapping}
        className={`
          p-2 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 
          transition-all duration-300 disabled:opacity-50
          ${isAnimating ? "animate-pulse scale-110" : "hover:scale-105"}
        `}
      >
        {isSwapping ? (
          <div className="animate-spin">
            <ArrowUpDown className="w-5 h-5 text-blue-600" />
          </div>
        ) : (
          <ArrowUpDown className="w-5 h-5 text-gray-600" />
        )}
      </button>
    </div>
  )
}
