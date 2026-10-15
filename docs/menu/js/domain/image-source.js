export function imageSource(value) {
  const text = String(value || "").trim()
  if (text.startsWith("data:image/")) return text
  return ""
}
