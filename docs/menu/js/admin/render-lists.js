import { categoryLabel } from "../domain/categories.js"
import { safeHttpUrl } from "../domain/http-url.js"
import { imageSource } from "../domain/image-source.js"
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
    item.className = "item-loja"
    item.append(storePreview(store))

    const actions = document.createElement("div")
    actions.className = "acoes-item"
    if (store.emUso) actions.append(badge("Em uso"))
    actions.append(
      actionButton("Editar", () => handlers.edit(store)),
      actionButton("Colocar em uso", () => handlers.use(store), store.emUso),
      actionButton("Excluir", () => handlers.remove(store)),
    )
    item.append(actions)
    list.append(item)
  })
}

function storePreview(store) {
  const preview = document.createElement("div")
  preview.className = "previa-loja"

  const source = imageSource(store.logomarca)
  if (source) {
    const image = document.createElement("img")
    image.src = source
    image.alt = store.nome ? `Logomarca de ${store.nome}` : "Logomarca"
    preview.append(image)
  }

  const name = document.createElement("p")
  name.className = "nome"
  name.textContent = store.nome
  preview.append(name)

  if (store.telefone) {
    const phone = document.createElement("p")
    phone.className = "detalhe"
    phone.textContent = store.telefone
    preview.append(phone)
  }

  const maps = safeHttpUrl(store.maps)
  if (store.endereco || maps) {
    const address = document.createElement("p")
    address.className = "detalhe"
    if (maps) {
      const link = document.createElement("a")
      link.href = maps
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.textContent = store.endereco || maps
      address.append(link)
    } else {
      address.textContent = store.endereco
    }
    preview.append(address)
  }

  return preview
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
