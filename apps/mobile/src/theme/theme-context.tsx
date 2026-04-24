import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'
import { darkTheme, lightTheme, type AppTheme, type ThemeMode, type ThemePreference } from './themes'

type ThemeContextValue = {
  preference: ThemePreference
  resolvedMode: ThemeMode
  theme: AppTheme
  setPreference: (next: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: React.ReactNode
}

export const AppThemeProvider = ({ children }: ThemeProviderProps) => {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme()
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    if (preference === 'system') {
      return
    }
    setColorScheme(preference)
  }, [preference, setColorScheme])

  const resolvedMode: ThemeMode =
    preference === 'system' ? (colorScheme === 'light' ? 'light' : 'dark') : preference

  const theme = resolvedMode === 'light' ? lightTheme : darkTheme

  const value = useMemo(
    () => ({
      preference,
      resolvedMode,
      setPreference,
      theme,
    }),
    [preference, resolvedMode, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useAppTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useAppTheme must be used inside AppThemeProvider')
  }
  return value
}
