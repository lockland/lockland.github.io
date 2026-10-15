import assert from "node:assert/strict"
import test from "node:test"
import { whatsappLink } from "../js/domain/whatsapp-link.js"
import { loadMenuForView, requestsLocalPreview } from "../js/domain/menu-source.js"
import { readPublishedMenu } from "../js/storage/published-menu-file.js"

test("whatsapp abre a web no computador e o aplicativo no celular", () => {
  const desktop = whatsappLink("55 (11) 99999-9999", "Mozilla/5.0 (X11; Linux x86_64)")
  const mobile = whatsappLink("5511999999999", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")

  assert.equal(desktop.startsWith("https://web.whatsapp.com/send?phone=5511999999999&text="), true)
  assert.equal(mobile.startsWith("https://wa.me/5511999999999?text="), true)
  assert.equal(decodeURIComponent(desktop.split("text=")[1]), "Olá, vim pelo cardápio.")
  assert.equal(whatsappLink("", "Android"), "")
  assert.equal(whatsappLink("5511", "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)").includes("wa.me"), true)
})

test("preview=1 lê o IndexedDB e a visualização pública lê o json", async () => {
  assert.equal(requestsLocalPreview("?preview=1"), true)
  assert.equal(requestsLocalPreview("?preview=1&tema=claro"), true)
  assert.equal(requestsLocalPreview(""), false)
  assert.equal(requestsLocalPreview("?preview=true"), false)

  const local = {
    stores: [{ id: "local", nome: "Local", emUso: true, telefone: "5511", dias: [] }],
    products: [{ id: "p1", nome: "Coxinha", preco: 7, visivel: true, categoria: "salgados", descricao: "" }],
    theme: "escuro",
  }
  const published = {
    loja: { nome: "Publicada" },
    tema: "vibrante",
    produtos: [{ nome: "Bolo" }],
  }

  const preview = await loadMenuForView({
    preview: true,
    readLocalCatalog: async () => local,
    readPublishedFile: async () => { throw new Error("a prévia não lê o json") },
  })
  assert.equal(preview.origem, "local")
  assert.equal(preview.loja.nome, "Local")
  assert.equal(preview.tema, "escuro")
  assert.equal(preview.produtos[0].nome, "Coxinha")

  const publicMenu = await loadMenuForView({
    readLocalCatalog: async () => { throw new Error("a tela pública não lê o IndexedDB") },
    readPublishedFile: async () => published,
  })
  assert.equal(publicMenu.origem, "publicado")
  assert.equal(publicMenu.loja.nome, "Publicada")
  assert.equal(publicMenu.tema, "vibrante")
})

test("sem preview o json publicado entra mesmo com produtos locais e o arquivo ausente fica vazio", async () => {
  const published = await loadMenuForView({
    readLocalCatalog: async () => { throw new Error("a tela pública não lê o IndexedDB") },
    readPublishedFile: async () => ({
      loja: { nome: "Publicada" },
      tema: "rustico",
      produtos: [{ nome: "Bolo", categoria: "doces" }],
    }),
  })
  assert.equal(published.origem, "publicado")
  assert.equal(published.loja.nome, "Publicada")
  assert.equal(published.tema, "rustico")

  const empty = await loadMenuForView({
    readLocalCatalog: async () => { throw new Error("a tela pública não lê o IndexedDB") },
    readPublishedFile: async () => null,
  })
  assert.equal(empty.origem, "vazio")
  assert.equal(empty.aviso, "O cardápio ainda não foi publicado.")

  const emptyPreview = await loadMenuForView({
    preview: true,
    readLocalCatalog: async () => ({ stores: [], products: [], theme: "claro" }),
    readPublishedFile: async () => ({ loja: { nome: "Publicada" }, produtos: [] }),
  })
  assert.equal(emptyPreview.origem, "vazio")
  assert.equal(emptyPreview.aviso, "Não há cardápio salvo neste navegador.")
})

test("arquivo publicado ilegível vira cardápio vazio", async () => {
  const menu = await readPublishedMenu(async () => {
    throw new Error("rede")
  }, "data/database.json")
  assert.equal(menu, null)

  const invalidJson = await readPublishedMenu(async () => ({
    ok: true,
    json: async () => { throw new Error("html") },
  }), "data/database.json")
  assert.equal(invalidJson, null)
})
