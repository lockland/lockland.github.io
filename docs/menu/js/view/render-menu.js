import { productsByCategory } from "../domain/product.js"
import { formatPrice } from "../domain/price.js"
import { formatSchedule } from "../domain/schedule.js"
import { imageSource } from "../domain/image-source.js"
import { safeHttpUrl } from "../domain/http-url.js"
import { resolveTheme } from "../domain/themes.js"
import { whatsappLink } from "../domain/whatsapp-link.js"

export function renderMenu(document, menu, userAgent) {
  applyTheme(document, menu.tema)

  if (menu.origem === "vazio") {
    setPrintAvailable(document, false)
    renderEmptyMenu(document, menu.aviso)
    return
  }

  setPrintAvailable(document, true)
  renderHeader(document.querySelector("#cabecalho"), menu.loja)
  renderCategories(document.querySelector("#categorias"), menu.produtos)
  renderProducts(document.querySelector("#cardapio"), menu.produtos)
  renderFooter(document.querySelector("#rodape"), menu.loja)
  renderWhatsapp(document.querySelector("#whatsapp"), menu.loja, userAgent)
  document.title = menu.loja?.nome ? `${menu.loja.nome} — Cardápio` : "Cardápio"
}

function applyTheme(document, theme) {
  document.querySelector("#tema-css").href = `css/themes/${resolveTheme(theme)}.css`
}

function setPrintAvailable(document, available) {
  document.querySelector("#imprimir").hidden = !available
}

function renderEmptyMenu(document, messageText) {
  document.querySelector("#cabecalho").replaceChildren()
  document.querySelector("#categorias").replaceChildren()
  document.querySelector("#categorias").hidden = true
  document.querySelector("#rodape").replaceChildren()
  hideWhatsapp(document.querySelector("#whatsapp"))

  const message = document.createElement("p")
  message.className = "vazio"
  message.textContent = messageText || "O cardápio ainda não foi publicado."
  document.querySelector("#cardapio").replaceChildren(message)
  document.title = "Cardápio"
}

function renderHeader(container, store) {
  container.replaceChildren()
  if (!store) return

  const source = imageSource(store.logomarca)
  if (source) {
    const image = document.createElement("img")
    image.src = source
    image.alt = store.nome ? `Logomarca de ${store.nome}` : "Logomarca"
    container.append(image)
  }

  if (store.nome) {
    const title = document.createElement("h1")
    title.textContent = store.nome
    container.append(title)
  }

  const schedule = formatSchedule(store)
  if (!schedule) return

  const paragraph = document.createElement("p")
  paragraph.className = "horario"
  paragraph.textContent = schedule
  container.append(paragraph)
}

function renderCategories(nav, products) {
  const groups = productsByCategory(products)
  nav.replaceChildren()
  nav.hidden = groups.length === 0

  groups.forEach(group => {
    const link = document.createElement("a")
    link.href = `#${group.id}`
    link.textContent = group.label
    nav.append(link)
  })
}

function renderProducts(main, products) {
  const groups = productsByCategory(products)
  main.replaceChildren()

  groups.forEach(group => {
    const section = document.createElement("section")
    section.id = group.id
    section.className = "grupo"

    const title = document.createElement("h2")
    title.textContent = group.label
    section.append(title)

    const list = document.createElement("div")
    list.className = "produtos"
    group.produtos.forEach(product => list.append(renderProduct(product)))
    section.append(list)
    main.append(section)
  })
}

function renderProduct(product) {
  const article = document.createElement("article")
  article.className = "produto"
  article.dataset.categoria = product.categoria

  const name = document.createElement("h3")
  name.className = "nome"
  name.textContent = product.nome

  const leader = document.createElement("span")
  leader.className = "traco"
  leader.setAttribute("aria-hidden", "true")

  const price = document.createElement("p")
  price.className = "preco"
  price.textContent = formatPrice(product.preco)

  article.append(name, leader, price)

  if (product.descricao) {
    const description = document.createElement("p")
    description.className = "descricao"
    description.textContent = product.descricao
    article.append(description)
  }

  return article
}

function renderFooter(container, store) {
  container.replaceChildren()
  if (!store?.endereco) return

  const paragraph = document.createElement("p")
  const url = safeHttpUrl(store.maps)
  if (!url) {
    paragraph.textContent = store.endereco
    container.append(paragraph)
    return
  }

  const link = document.createElement("a")
  link.href = url
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.textContent = store.endereco
  paragraph.append(link)
  container.append(paragraph)
}

function renderWhatsapp(link, store, userAgent) {
  const href = whatsappLink(store?.telefone, userAgent)
  if (!href) {
    hideWhatsapp(link)
    return
  }

  link.hidden = false
  link.href = href
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.textContent = "WhatsApp"
}

function hideWhatsapp(link) {
  link.hidden = true
  link.removeAttribute("href")
}
