export const THEMES = [
  { id: "claro", nome: "Claro editorial" },
  { id: "escuro", nome: "Escuro" },
  { id: "rustico", nome: "Rústico" },
  { id: "vibrante", nome: "Vibrante" },
]

export const DEFAULT_THEME = "claro"

export function resolveTheme(themeId) {
  const id = String(themeId || "")
  return THEMES.some(theme => theme.id === id) ? id : DEFAULT_THEME
}
