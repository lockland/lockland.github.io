import { WEEK_DAYS } from "./week-days.js"

export function formatSchedule(store) {
  if (!store) return ""

  const selected = new Set(store.dias || [])
  const days = WEEK_DAYS.filter(day => selected.has(day.id)).map(day => day.label)
  const hours = store.abertura && store.fechamento
    ? `${store.abertura}–${store.fechamento}`
    : ""

  return [days.join(", "), hours].filter(Boolean).join(" · ")
}
