export interface Token {
  name: string
  address: string
  symbol: string
  decimals: number
  chainId: number
  logoURI: string
}

export interface TokenList {
  name: string
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: Token[]
}
