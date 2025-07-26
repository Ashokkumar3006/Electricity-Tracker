import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" // Assuming you have a globals.css

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Energy Monitor", // Custom title
  description: "Professional Energy Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
