export function httpUrl(value) {
  const text = String(value || "").trim()
  if (!text) return ""

  let url
  try {
    url = new URL(text)
  } catch {
    throw new Error("O link do Maps precisa começar com http:// ou https://.")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("O link do Maps precisa começar com http:// ou https://.")
  }

  return url.href
}

export function safeHttpUrl(value) {
  try {
    return httpUrl(value)
  } catch {
    return ""
  }
}
