import { CATEGORIES, isCategory } from "./categories.js"
import { requiredText } from "./required-text.js"
import { parsePrice } from "./price.js"

export function createProduct(input, identifier) {
  const categoria = String(input.categoria || "").trim().toLowerCase()
  if (!isCategory(categoria)) throw new Error("Categoria inválida.")
  if (typeof input.visivel !== "boolean") throw new Error("Visibilidade inválida.")

  return {
    id: identifier,
    nome: requiredText(input.nome, "Informe o nome do produto."),
    descricao: String(input.descricao || "").trim(),
    preco: parsePrice(input.preco),
    visivel: input.visivel,
    categoria,
  }
}

export function isVisibleOnMenu(product) {
  return product.visivel !== false
}

export function productsInListOrder(products) {
  const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.id, index]))
  return [...products].sort((left, right) => {
    const byCategory = (categoryOrder.get(left.categoria) ?? 99) - (categoryOrder.get(right.categoria) ?? 99)
    if (byCategory !== 0) return byCategory
    return left.nome.localeCompare(right.nome, "pt-BR")
  })
}

export function productsByCategory(products) {
  const ordered = productsInListOrder(products)
  return CATEGORIES.map(category => ({
    id: category.id,
    label: category.label,
    produtos: ordered.filter(product => product.categoria === category.id && isVisibleOnMenu(product)),
  })).filter(group => group.produtos.length > 0)
}

export function productForPublication(product) {
  return {
    id: product.id,
    nome: product.nome,
    descricao: product.descricao,
    preco: product.preco,
    categoria: product.categoria,
  }
}

export function productsForPublication(products) {
  return productsByCategory(products).flatMap(group => group.produtos.map(productForPublication))
}

export function addProduct(products, product) {
  return [...products, product]
}

export function replaceProduct(products, product) {
  if (!products.some(current => current.id === product.id)) {
    throw new Error("Produto não encontrado.")
  }

  return products.map(current => current.id === product.id ? product : current)
}

export function removeProduct(products, productId) {
  return products.filter(product => product.id !== productId)
}

export function upsertProductByName(products, input, createIdentifier) {
  const nome = String(input.nome || "").trim().toLowerCase()
  const index = products.findIndex(product => product.nome.trim().toLowerCase() === nome)
  if (index === -1) return addProduct(products, createProduct(input, createIdentifier()))

  const updated = createProduct(input, products[index].id)
  return products.map((product, position) => position === index ? updated : product)
}
