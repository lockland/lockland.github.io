export function parsePrice(value) {
  const text = String(value ?? "").trim()
  if (!text) throw new Error("Preço inválido.")

  const normalized = normalizePriceText(text)
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Preço inválido.")

  return Number(normalized)
}

export function formatPrice(price) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(price))
}

function normalizePriceText(text) {
  if (text.includes(",") && text.includes(".")) {
    const decimalIsComma = text.lastIndexOf(",") > text.lastIndexOf(".")
    if (decimalIsComma) return text.replaceAll(".", "").replace(",", ".")
    return text.replaceAll(",", "")
  }

  if (text.includes(",")) return text.replace(",", ".")
  return text
}
