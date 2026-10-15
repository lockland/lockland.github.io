import { normalizeStoresInUse, storeInUse } from "./store.js"
import { resolveTheme } from "./themes.js"

const publishedMissingMessage = "O cardápio ainda não foi publicado."
const localMissingMessage = "Não há cardápio salvo neste navegador."

// preview=1 lê o IndexedDB deste navegador. Sem o parâmetro, a tela
// pública lê só o JSON publicado e ignora a base local.
export function requestsLocalPreview(search) {
  return new URLSearchParams(search).get("preview") === "1"
}

export async function loadMenuForView({ readLocalCatalog, readPublishedFile, preview = false }) {
  if (preview) return menuFromLocalCatalog(await readLocalCatalog())

  const published = await readPublishedFile()
  if (!published) return emptyMenu(publishedMissingMessage)

  return {
    origem: "publicado",
    loja: published.loja ?? null,
    tema: resolveTheme(published.tema),
    produtos: Array.isArray(published.produtos) ? published.produtos : [],
  }
}

function menuFromLocalCatalog(local) {
  const stores = normalizeStoresInUse(local.stores || [])
  const loja = storeInUse(stores)
  const produtos = Array.isArray(local.products) ? local.products : []
  if (!loja && produtos.length === 0) return emptyMenu(localMissingMessage)

  return {
    origem: "local",
    loja,
    tema: resolveTheme(local.theme),
    produtos,
  }
}

function emptyMenu(aviso) {
  return { origem: "vazio", loja: null, tema: "claro", produtos: [], aviso }
}
