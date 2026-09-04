import { useEffect } from "react"
import { useTheme } from "./useTheme"

/**
 * Applies the `.dark` class to <html> only while the calling layout is
 * mounted (i.e. only inside the authenticated app shell), and removes it on
 * unmount. This keeps dark mode out of the public marketing/login pages
 * (which mix hardcoded and token colors, never audited for dark mode) while
 * still letting portal-based UI (Dialog, Select, DropdownMenu — which mount
 * into document.body, outside any scoped wrapper element) correctly inherit
 * the dark tokens, since document.body is a descendant of <html>.
 */
export function useScopedDarkMode() {
  const { theme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    return () => {
      root.classList.remove("dark")
    }
  }, [theme])
}
