import assert from "node:assert/strict"
import test from "node:test"
import { importProductsFromCsv } from "../js/domain/csv-products.js"
import { createProduct } from "../js/domain/product.js"

test("importa linhas válidas e lista a linha inválida", () => {
  const existing = [createProduct({
    nome: "Coxinha",
    descricao: "Antiga",
    preco: 1,
    visivel: true,
    categoria: "salgados",
  }, "id-coxinha")]

  const csv = [
    "nome;descricao;preco;visivel;categoria",
    "coxinha;Frango;7,50;não;salgados",
    "\"Risole; queijo\";Queijo;8,00;nao;salgados",
    "Ruim;x;abc;sim;salgados",
    "Suco;Laranja;5;1;bebidas",
    "Pizza;Mussarela;20;sim;pizzas",
  ].join("\n")

  let sequence = 0
  const result = importProductsFromCsv(csv, existing, () => `novo-${sequence += 1}`)

  assert.equal(result.importedCount, 3)
  assert.equal(result.products.find(product => product.nome === "coxinha").id, "id-coxinha")
  assert.equal(result.products.find(product => product.nome === "coxinha").visivel, false)
  assert.equal(result.products.find(product => product.nome === "Risole; queijo").preco, 8)
  assert.equal(result.products.find(product => product.nome === "Suco").categoria, "bebidas")
  assert.deepEqual(result.errors.map(error => error.linha), [4, 6])
})

test("vírgula no arquivo inteiro também vale e cabeçalho ausente não grava", () => {
  const commaFile = "nome,descricao,preco,visivel,categoria\nBolo,Chocolate,12.50,sim,doces\n"
  const imported = importProductsFromCsv(commaFile, [], () => "bolo")
  assert.equal(imported.products[0].preco, 12.5)
  assert.equal(imported.errors.length, 0)

  const invalidHeader = importProductsFromCsv("nome;preco\nCoxinha;1", [], () => "x")
  assert.equal(invalidHeader.importedCount, 0)
  assert.equal(invalidHeader.products.length, 0)
  assert.equal(invalidHeader.errors[0].linha, 1)
})
