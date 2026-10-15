import { WEEK_DAYS } from "./week-days.js"
import { requiredText } from "./required-text.js"
import { httpUrl } from "./http-url.js"

export function createStore(input, identifier) {
  return {
    id: identifier,
    nome: requiredText(input.nome, "Informe o nome da loja."),
    logomarca: String(input.logomarca || ""),
    abertura: String(input.abertura || "").trim(),
    fechamento: String(input.fechamento || "").trim(),
    dias: normalizeDays(input.dias),
    telefone: digitsOnly(input.telefone),
    endereco: String(input.endereco || "").trim(),
    maps: httpUrl(input.maps),
    emUso: false,
  }
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "")
}

export function normalizeDays(days) {
  const selected = new Set(days || [])
  return WEEK_DAYS.map(day => day.id).filter(dayId => selected.has(dayId))
}

export function storesInListOrder(stores) {
  return [...stores].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"))
}

export function normalizeStoresInUse(stores) {
  const ordered = storesInListOrder(stores)
  if (ordered.length === 0) return []

  const active = ordered.find(store => store.emUso) || ordered[0]
  return ordered.map(store => ({ ...store, emUso: store.id === active.id }))
}

export function storeInUse(stores) {
  return stores.find(store => store.emUso) || null
}

export function addStore(stores, store) {
  const isFirstStore = stores.length === 0
  return [...stores, { ...store, emUso: isFirstStore }]
}

export function replaceStore(stores, store) {
  if (!stores.some(current => current.id === store.id)) {
    throw new Error("Loja não encontrada.")
  }

  return stores.map(current => (
    current.id === store.id ? { ...store, emUso: current.emUso } : current
  ))
}

export function markStoreInUse(stores, storeId) {
  if (!stores.some(store => store.id === storeId)) {
    throw new Error("Loja não encontrada.")
  }

  return stores.map(store => ({ ...store, emUso: store.id === storeId }))
}

// A próxima loja da lista assume a marca. Se a excluída era a última,
// a lista recomeça na primeira que restou.
export function removeStore(stores, storeId) {
  const ordered = storesInListOrder(stores)
  const removedIndex = ordered.findIndex(store => store.id === storeId)
  if (removedIndex === -1) throw new Error("Loja não encontrada.")

  const removed = ordered[removedIndex]
  const remaining = ordered.filter(store => store.id !== storeId)
  if (!removed.emUso || remaining.length === 0) return remaining

  const nextIndex = removedIndex % remaining.length
  return remaining.map((store, index) => ({ ...store, emUso: index === nextIndex }))
}

export function storeForPublication(store) {
  return {
    id: store.id,
    nome: store.nome,
    logomarca: store.logomarca,
    abertura: store.abertura,
    fechamento: store.fechamento,
    dias: store.dias,
    telefone: store.telefone,
    endereco: store.endereco,
    maps: store.maps,
  }
}
