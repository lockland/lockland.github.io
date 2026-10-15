import assert from "node:assert/strict"
import test from "node:test"
import {
  createProduct,
  productsByCategory,
  productsForPublication,
  upsertProductByName,
} from "../js/domain/product.js"
import { buildPublishedMenu } from "../js/domain/published-menu.js"
import { parsePrice, formatPrice } from "../js/domain/price.js"
import { createStore } from "../js/domain/store.js"

test("produto invisível fica de fora da publicação e da categoria vazia", () => {
  const visible = createProduct({
    nome: "Coxinha",
    descricao: "Frango",
    preco: "7,50",
    visivel: true,
    categoria: "Salgados",
  }, "p1")
  const hidden = createProduct({
    nome: "Risole",
    descricao: "",
    preco: 8,
    visivel: false,
    categoria: "salgados",
  }, "p2")
  const drink = createProduct({
    nome: "Suco",
    descricao: "Laranja",
    preco: "5.00",
    visivel: true,
    categoria: "bebidas",
  }, "p3")

  const groups = productsByCategory([visible, hidden, drink])
  assert.deepEqual(groups.map(group => group.id), ["salgados", "bebidas"])
  assert.deepEqual(groups[0].produtos.map(product => product.id), ["p1"])

  const published = productsForPublication([visible, hidden, drink])
  assert.equal(published.some(product => "visivel" in product), false)
  assert.deepEqual(published.map(product => product.nome), ["Coxinha", "Suco"])
})

test("preço aceita vírgula, ponto e milhar", () => {
  assert.equal(parsePrice("12,50"), 12.5)
  assert.equal(parsePrice("12.50"), 12.5)
  assert.equal(parsePrice("1.250,50"), 1250.5)
  assert.match(formatPrice(7.5), /R\$\s*7,50/)
  assert.throws(() => parsePrice("abc"))
})

test("publicação usa a loja em uso, o tema e omite produto oculto", () => {
  const store = { ...createStore({ nome: "Padaria", telefone: "5511" }, "loja-1"), emUso: true }
  const menu = buildPublishedMenu({
    store,
    theme: "desconhecido",
    products: [
      createProduct({ nome: "Bolo", preco: 10, visivel: false, categoria: "doces", descricao: "" }, "p1"),
      createProduct({ nome: "Café", preco: 4, visivel: true, categoria: "bebidas", descricao: "" }, "p2"),
    ],
  })

  assert.equal(menu.loja.nome, "Padaria")
  assert.equal("emUso" in menu.loja, false)
  assert.equal(menu.tema, "claro")
  assert.deepEqual(menu.produtos.map(product => product.nome), ["Café"])
})

test("csv atualiza produto pelo nome e mantém o identificador", () => {
  const existing = [createProduct({
    nome: "Coxinha",
    descricao: "Antiga",
    preco: 1,
    visivel: false,
    categoria: "salgados",
  }, "id-antigo")]

  const next = upsertProductByName(existing, {
    nome: "coxinha",
    descricao: "Nova",
    preco: "9,00",
    visivel: true,
    categoria: "salgados",
  }, () => "id-novo")

  assert.equal(next.length, 1)
  assert.equal(next[0].id, "id-antigo")
  assert.equal(next[0].preco, 9)
  assert.equal(next[0].visivel, true)
})
