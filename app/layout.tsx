import type React from "react"
import "../app/globals.css"
// RainbowKit styles are now included in our global CSS
import { Providers } from "./providers"

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout

export const metadata = {
      generator: 'v0.dev'
    };
