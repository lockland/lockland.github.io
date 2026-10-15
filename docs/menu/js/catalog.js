import { normalizeStoresInUse } from "./domain/store.js"
import { resolveTheme } from "./domain/themes.js"
import { listProducts, listStores, readTheme, writeProducts, writeStores, writeTheme } from "./storage/cardapio-database.js"

export async function readLocalCatalog(database) {
  const [stores, products, theme] = await Promise.all([
    listStores(database),
    listProducts(database),
    readTheme(database),
  ])

  return {
    stores: normalizeStoresInUse(stores),
    products,
    theme: resolveTheme(theme),
  }
}

export function saveStores(database, stores) {
  return writeStores(database, normalizeStoresInUse(stores))
}

export function saveProducts(database, products) {
  return writeProducts(database, products)
}

export function saveTheme(database, theme) {
  return writeTheme(database, resolveTheme(theme))
}
