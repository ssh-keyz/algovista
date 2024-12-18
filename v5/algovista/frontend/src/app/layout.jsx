import '@/styles/globals.css'
import '@/styles/theme.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'AlgoVista - Mathematical Visualization',
  description: 'Interactive mathematical visualization and analysis tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="algovista-theme">
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}