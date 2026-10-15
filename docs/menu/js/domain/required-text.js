export function requiredText(value, message) {
  const text = String(value ?? "").trim()
  if (!text) throw new Error(message)
  return text
}
