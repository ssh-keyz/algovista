"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ theme: "dark", setTheme: () => null })

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "algovista-theme",
}) {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme)
      window.localStorage.setItem(storageKey, newTheme)
    },
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
} 