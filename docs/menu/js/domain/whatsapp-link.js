const MESSAGE = "Olá, vim pelo cardápio."

export function whatsappLink(phone, userAgent) {
  const digits = String(phone || "").replace(/\D/g, "")
  if (!digits) return ""

  const text = encodeURIComponent(MESSAGE)
  if (isMobileUserAgent(userAgent)) return `https://wa.me/${digits}?text=${text}`
  return `https://web.whatsapp.com/send?phone=${digits}&text=${text}`
}

export function isMobileUserAgent(userAgent) {
  return /Android|iPhone|iPad/i.test(userAgent || "")
}
