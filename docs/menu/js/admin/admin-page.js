import { openCardapioDatabase } from "../storage/cardapio-database.js"
import { readLocalCatalog, saveProducts, saveStores, saveTheme } from "../catalog.js"
import {
  addStore,
  createStore,
  markStoreInUse,
  removeStore,
  replaceStore,
  storeInUse,
} from "../domain/store.js"
import {
  addProduct,
  createProduct,
  removeProduct,
  replaceProduct,
} from "../domain/product.js"
import { createIdentifier } from "../domain/identifier.js"
import { importProductsFromCsv } from "../domain/csv-products.js"
import { buildPublishedMenu } from "../domain/published-menu.js"
import { resolveTheme } from "../domain/themes.js"
import { imageSource } from "../domain/image-source.js"
import { downloadJsonFile } from "../publish/download-json.js"
import { readImageFile } from "./read-image-file.js"
import { renderCsvErrors, renderProductList, renderStoreList } from "./render-lists.js"

try {
  await startAdminPage(document)
} catch {
  const status = document.querySelector("#status")
  if (status) status.textContent = "Não foi possível abrir o armazenamento deste navegador."
}

async function startAdminPage(document) {
  const state = {
    document,
    database: await openCardapioDatabase(),
    catalog: { stores: [], products: [], theme: "claro" },
    storeLogo: "",
  }
  bindAdminPage(state)
  await refreshLists(state)
  applyThemeSelection(state, state.catalog.theme)
}

function bindAdminPage(state) {
  const { document } = state
  document.querySelector("#formulario-loja").addEventListener("submit", event => submitStore(state, event))
  document.querySelector("#limpar-loja").addEventListener("click", () => clearStoreForm(state))
  document.querySelector("#adicionar-produto").addEventListener("click", () => openProductModal(state))
  document.querySelector("#formulario-produto").addEventListener("submit", event => submitProduct(state, event))
  document.querySelector("#cancelar-produto").addEventListener("click", () => closeProductModal(state))
  document.querySelector("#modal-produto").addEventListener("click", event => {
    if (event.target.id === "modal-produto") closeProductModal(state)
  })
  document.querySelector("#modal-produto").addEventListener("close", () => clearProductForm(state))
  document.querySelector("#formulario-csv").addEventListener("submit", event => submitCsv(state, event))
  document.querySelector("#formulario-tema").addEventListener("change", () => changeTheme(state))
  document.querySelector("#publicar").addEventListener("click", () => publishMenu(state))
}

async function refreshLists(state) {
  state.catalog = await readLocalCatalog(state.database)
  renderStoreList(state.document.querySelector("#lista-lojas"), state.catalog.stores, {
    edit: store => fillStoreForm(state, store),
    use: store => useStore(state, store),
    remove: store => deleteStore(state, store),
  })
  renderProductList(state.document.querySelector("#lista-produtos"), state.catalog.products, {
    edit: product => openProductModal(state, product),
    remove: product => deleteProduct(state, product),
  })
}

async function submitStore(state, event) {
  event.preventDefault()
  clearMessage(state, "erro-loja")
  const form = event.currentTarget

  try {
    const input = await storeInputFromForm(state, form)
    const stores = input.id
      ? replaceStore(state.catalog.stores, storeKeepingUseFlag(state.catalog.stores, input))
      : addStore(state.catalog.stores, createStore(input, createIdentifier()))
    await saveStores(state.database, stores)
    clearStoreForm(state)
    await refreshLists(state)
    showStatus(state, "Loja salva.")
  } catch (error) {
    showError(state, "erro-loja", error.message)
  }
}

async function storeInputFromForm(state, form) {
  const data = new FormData(form)
  const file = form.querySelector("input[name=logomarca]").files[0]
  const logomarca = file ? await readImageFile(file) : state.storeLogo
  return {
    id: String(data.get("id") || ""),
    nome: data.get("nome"),
    logomarca,
    abertura: data.get("abertura"),
    fechamento: data.get("fechamento"),
    dias: data.getAll("dias"),
    telefone: data.get("telefone"),
    endereco: data.get("endereco"),
    maps: data.get("maps"),
  }
}

function storeKeepingUseFlag(stores, input) {
  const draft = createStore(input, input.id)
  const current = stores.find(store => store.id === input.id)
  return { ...draft, emUso: Boolean(current?.emUso) }
}

function fillStoreForm(state, store) {
  const form = state.document.querySelector("#formulario-loja")
  form.elements.id.value = store.id
  form.elements.nome.value = store.nome
  form.elements.abertura.value = store.abertura
  form.elements.fechamento.value = store.fechamento
  form.elements.telefone.value = store.telefone
  form.elements.endereco.value = store.endereco
  form.elements.maps.value = store.maps
  const selectedDays = new Set(store.dias)
  form.querySelectorAll("input[name=dias]").forEach(input => {
    input.checked = selectedDays.has(input.value)
  })
  form.querySelector("input[name=logomarca]").value = ""
  state.storeLogo = store.logomarca || ""
  showLogoPreview(state, state.storeLogo)
  form.querySelector("button[type=submit]").textContent = "Atualizar loja"
  form.scrollIntoView({ behavior: "smooth", block: "start" })
}

function clearStoreForm(state) {
  const form = state.document.querySelector("#formulario-loja")
  form.reset()
  form.elements.id.value = ""
  state.storeLogo = ""
  showLogoPreview(state, "")
  form.querySelector("button[type=submit]").textContent = "Salvar loja"
}

async function useStore(state, store) {
  try {
    await saveStores(state.database, markStoreInUse(state.catalog.stores, store.id))
    await refreshLists(state)
    showStatus(state, `${store.nome} está em uso.`)
  } catch (error) {
    showError(state, "erro-loja", error.message)
  }
}

async function deleteStore(state, store) {
  const confirmed = state.document.defaultView.confirm(`Excluir a loja ${store.nome}?`)
  if (!confirmed) return

  try {
    await saveStores(state.database, removeStore(state.catalog.stores, store.id))
    const form = state.document.querySelector("#formulario-loja")
    if (form.elements.id.value === store.id) clearStoreForm(state)
    await refreshLists(state)
    showStatus(state, "Loja excluída.")
  } catch (error) {
    showError(state, "erro-loja", error.message)
  }
}

function showLogoPreview(state, source) {
  const preview = state.document.querySelector("#previa-logomarca")
  const safeSource = imageSource(source)
  preview.hidden = !safeSource
  if (safeSource) {
    preview.src = safeSource
    return
  }
  preview.removeAttribute("src")
}

async function submitProduct(state, event) {
  event.preventDefault()
  clearMessage(state, "erro-produto")
  const form = event.currentTarget
  const data = new FormData(form)
  const input = {
    nome: data.get("nome"),
    descricao: data.get("descricao"),
    preco: data.get("preco"),
    visivel: form.elements.visivel.checked,
    categoria: data.get("categoria"),
  }
  const id = String(data.get("id") || "")

  try {
    const products = id
      ? replaceProduct(state.catalog.products, createProduct(input, id))
      : addProduct(state.catalog.products, createProduct(input, createIdentifier()))
    await saveProducts(state.database, products)
    closeProductModal(state)
    await refreshLists(state)
    showStatus(state, "Produto salvo.")
  } catch (error) {
    showError(state, "erro-produto", error.message)
  }
}

function openProductModal(state, product) {
  clearMessage(state, "erro-produto")
  if (product) fillProductForm(state, product)
  else clearProductForm(state)

  const dialog = state.document.querySelector("#modal-produto")
  if (!dialog.open) dialog.showModal()
  state.document.querySelector("#formulario-produto").elements.nome.focus()
}

function closeProductModal(state) {
  const dialog = state.document.querySelector("#modal-produto")
  if (dialog.open) dialog.close()
}

function fillProductForm(state, product) {
  const form = state.document.querySelector("#formulario-produto")
  form.elements.id.value = product.id
  form.elements.nome.value = product.nome
  form.elements.descricao.value = product.descricao
  form.elements.preco.value = String(product.preco).replace(".", ",")
  form.elements.visivel.checked = product.visivel
  form.elements.categoria.value = product.categoria
  setProductModalLabels(state, true)
}

function clearProductForm(state) {
  const form = state.document.querySelector("#formulario-produto")
  form.reset()
  form.elements.id.value = ""
  setProductModalLabels(state, false)
}

function setProductModalLabels(state, editing) {
  state.document.querySelector("#titulo-modal-produto").textContent = editing ? "Editar produto" : "Adicionar produto"
  state.document.querySelector("#formulario-produto button[type=submit]").textContent = editing ? "Atualizar produto" : "Salvar produto"
}

async function deleteProduct(state, product) {
  const confirmed = state.document.defaultView.confirm(`Excluir o produto ${product.nome}?`)
  if (!confirmed) return

  try {
    await saveProducts(state.database, removeProduct(state.catalog.products, product.id))
    const form = state.document.querySelector("#formulario-produto")
    if (form.elements.id.value === product.id) closeProductModal(state)
    await refreshLists(state)
    showStatus(state, "Produto excluído.")
  } catch (error) {
    showError(state, "erro-produto", error.message)
  }
}

async function submitCsv(state, event) {
  event.preventDefault()
  clearMessage(state, "erro-csv")
  const form = event.currentTarget
  const file = form.querySelector("input[name=arquivo]").files[0]
  if (!file) {
    showError(state, "erro-csv", "Escolha um arquivo CSV.")
    return
  }

  try {
    const result = importProductsFromCsv(await file.text(), state.catalog.products, createIdentifier)
    if (result.importedCount > 0) await saveProducts(state.database, result.products)
    form.reset()
    renderCsvErrors(state.document.querySelector("#erros-csv"), result.errors)
    await refreshLists(state)
    showStatus(state, `${countText(result.importedCount, "produto gravado", "produtos gravados")}. ${countText(result.errors.length, "linha rejeitada", "linhas rejeitadas")}.`)
  } catch (error) {
    showError(state, "erro-csv", error.message)
  }
}

async function changeTheme(state) {
  const selected = state.document.querySelector("input[name=tema]:checked")?.value
  const theme = resolveTheme(selected)
  applyThemeSelection(state, theme)
  clearMessage(state, "erro-tema")

  try {
    await saveTheme(state.database, theme)
    state.catalog.theme = theme
    showStatus(state, "Tema salvo.")
  } catch (error) {
    showError(state, "erro-tema", error.message)
  }
}

function applyThemeSelection(state, theme) {
  const radio = state.document.querySelector(`input[name="tema"][value="${theme}"]`)
  if (radio) radio.checked = true
  state.document.querySelector("#tema-selecionado").textContent = theme
}

async function publishMenu(state) {
  clearMessage(state, "erro-publicacao")
  try {
    const catalog = await readLocalCatalog(state.database)
    const menu = buildPublishedMenu({
      store: storeInUse(catalog.stores),
      theme: catalog.theme,
      products: catalog.products,
    })
    downloadJsonFile(state.document, "database.json", menu)
    showStatus(state, "database.json baixado. Substitua docs/menu/data/database.json no repositório.")
  } catch (error) {
    showError(state, "erro-publicacao", error.message)
  }
}

function countText(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

function showStatus(state, message) {
  state.document.querySelector("#status").textContent = message
}

function showError(state, id, message) {
  state.document.querySelector(`#${id}`).textContent = message
  state.document.querySelector("#status").textContent = ""
}

function clearMessage(state, id) {
  state.document.querySelector(`#${id}`).textContent = ""
}
