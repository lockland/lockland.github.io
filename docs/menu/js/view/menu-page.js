import { openCardapioDatabase } from "../storage/cardapio-database.js"
import { readPublishedMenu } from "../storage/published-menu-file.js"
import { readLocalCatalog } from "../catalog.js"
import { loadMenuForView, requestsLocalPreview } from "../domain/menu-source.js"
import { renderMenu } from "./render-menu.js"

const preview = requestsLocalPreview(window.location.search)
const menu = await loadMenuForView({
  preview,
  readLocalCatalog: readLocalOrEmpty,
  readPublishedFile: () => readPublishedMenu(fetch, "data/database.json"),
})

document.querySelector("#imprimir").addEventListener("click", () => window.print())
renderMenu(document, menu, navigator.userAgent)

async function readLocalOrEmpty() {
  try {
    const database = await openCardapioDatabase()
    return readLocalCatalog(database)
  } catch {
    return { stores: [], products: [], theme: "claro" }
  }
}
