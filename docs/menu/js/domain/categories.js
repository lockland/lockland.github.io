export const CATEGORIES = [
  { id: "salgados", label: "Salgados" },
  { id: "doces", label: "Doces" },
  { id: "bebidas", label: "Bebidas" },
  { id: "almocos", label: "Almoços" },
]

export function isCategory(value) {
  return CATEGORIES.some(category => category.id === value)
}

export function categoryLabel(categoryId) {
  const category = CATEGORIES.find(item => item.id === categoryId)
  return category ? category.label : categoryId
}
