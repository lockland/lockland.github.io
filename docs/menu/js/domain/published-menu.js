import { storeForPublication } from "./store.js"
import { productsForPublication } from "./product.js"
import { resolveTheme } from "./themes.js"

export function buildPublishedMenu({ store, theme, products }) {
  return {
    loja: store ? storeForPublication(store) : null,
    tema: resolveTheme(theme),
    produtos: productsForPublication(products),
  }
}
