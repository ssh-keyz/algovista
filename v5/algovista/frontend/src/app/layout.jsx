import '@/styles/globals.css'
import '@/styles/theme.css'

export const metadata = {
  title: 'AlgoVista - Mathematical Visualization',
  description: 'Interactive mathematical visualization and analysis tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}