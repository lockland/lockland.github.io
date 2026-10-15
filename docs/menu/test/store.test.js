import assert from "node:assert/strict"
import test from "node:test"
import {
  addStore,
  createStore,
  markStoreInUse,
  removeStore,
  storeInUse,
} from "../js/domain/store.js"
import { formatSchedule } from "../js/domain/schedule.js"
import { safeHttpUrl } from "../js/domain/http-url.js"

test("a primeira loja fica em uso e a segunda não toma a marca", () => {
  const first = createStore({ nome: "Padaria" }, "loja-1")
  const second = createStore({ nome: "Lanchonete" }, "loja-2")
  const stores = addStore(addStore([], first), second)

  assert.equal(storeInUse(stores).id, "loja-1")
  assert.equal(stores[1].emUso, false)
})

test("marcar outra loja em uso substitui a anterior", () => {
  const stores = addStore(addStore([], createStore({ nome: "A" }, "a")), createStore({ nome: "B" }, "b"))
  const next = markStoreInUse(stores, "b")

  assert.equal(storeInUse(next).id, "b")
  assert.equal(next.filter(store => store.emUso).length, 1)
})

test("excluir a loja em uso passa a marca para a próxima", () => {
  const stores = addStore(
    addStore(addStore([], createStore({ nome: "Ana" }, "ana")), createStore({ nome: "Bia" }, "bia")),
    createStore({ nome: "Caio" }, "caio"),
  )

  const withoutAna = removeStore(stores, "ana")
  assert.equal(storeInUse(withoutAna).id, "bia")

  const biaInUse = markStoreInUse(stores, "bia")
  assert.equal(storeInUse(removeStore(biaInUse, "bia")).id, "caio")

  const caioInUse = markStoreInUse(stores, "caio")
  assert.equal(storeInUse(removeStore(caioInUse, "caio")).id, "ana")
})

test("sem lojas a visualização não recebe dados de loja", () => {
  const stores = addStore([], createStore({ nome: "Ana" }, "ana"))
  assert.equal(removeStore(stores, "ana").length, 0)
  assert.equal(storeInUse([]), null)
})

test("loja guarda telefone só com dígitos e rejeita link inseguro", () => {
  const store = createStore({
    nome: "Padaria",
    telefone: "+55 (11) 99999-9999",
    dias: ["sexta", "segunda", "invalido"],
    maps: "https://maps.google.com/?q=Rua+1",
  }, "loja-1")

  assert.equal(store.telefone, "5511999999999")
  assert.deepEqual(store.dias, ["segunda", "sexta"])
  assert.equal(safeHttpUrl("javascript:alert(1)"), "")
  assert.throws(() => createStore({ nome: "Padaria", maps: "javascript:alert(1)" }, "x"))
})

test("horário junta dias e abertura com fechamento", () => {
  const store = createStore({
    nome: "Padaria",
    abertura: "08:00",
    fechamento: "18:00",
    dias: ["segunda", "terca"],
  }, "loja-1")

  assert.equal(formatSchedule(store), "Segunda, Terça · 08:00–18:00")
})
