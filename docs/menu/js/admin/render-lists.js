import { categoryLabel } from "../domain/categories.js"
import { formatPrice } from "../domain/price.js"
import { productsInListOrder } from "../domain/product.js"

export function renderStoreList(list, stores, handlers) {
  list.replaceChildren()
  if (stores.length === 0) {
    list.append(emptyItem("Nenhuma loja cadastrada."))
    return
  }

  stores.forEach(store => {
    const item = document.createElement("li")
    const name = document.createElement("span")
    name.className = "nome"
    name.textContent = store.nome
    item.append(name)

    if (store.emUso) item.append(badge("Em uso"))

    item.append(
      actionButton("Editar", () => handlers.edit(store)),
      actionButton("Colocar em uso", () => handlers.use(store), store.emUso),
      actionButton("Excluir", () => handlers.remove(store)),
    )
    list.append(item)
  })
}

export function renderProductList(list, products, handlers) {
  list.replaceChildren()
  if (products.length === 0) {
    list.append(emptyItem("Nenhum produto cadastrado."))
    return
  }

  productsInListOrder(products).forEach(product => {
    const item = document.createElement("li")
    const name = document.createElement("span")
    name.className = "nome"
    name.textContent = `${product.nome} · ${categoryLabel(product.categoria)} · ${formatPrice(product.preco)}`
    item.append(name)

    if (!product.visivel) item.append(badge("Oculto"))

    item.append(
      actionButton("Editar", () => handlers.edit(product)),
      actionButton("Excluir", () => handlers.remove(product)),
    )
    list.append(item)
  })
}

export function renderCsvErrors(list, errors) {
  list.replaceChildren()
  errors.forEach(error => {
    const item = document.createElement("li")
    item.textContent = `Linha ${error.linha}: ${error.motivo}`
    list.append(item)
  })
}

function emptyItem(message) {
  const item = document.createElement("li")
  item.className = "vazio"
  item.textContent = message
  return item
}

function badge(text) {
  const element = document.createElement("span")
  element.className = "selo"
  element.textContent = text
  return element
}

function actionButton(label, onClick, disabled = false) {
  const button = document.createElement("button")
  button.type = "button"
  button.textContent = label
  button.disabled = disabled
  button.addEventListener("click", onClick)
  return button
}
