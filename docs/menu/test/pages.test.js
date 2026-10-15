import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

test("as páginas ligam os scripts, os temas e os formulários", async () => {
  const view = await readFile(new URL("../index.html", import.meta.url), "utf8")
  const admin = await readFile(new URL("../admin.html", import.meta.url), "utf8")

  for (const id of ["cabecalho", "categorias", "cardapio", "rodape", "whatsapp", "tema-css", "imprimir"]) {
    assert.equal(view.includes(`id="${id}"`), true, id)
  }
  assert.equal(view.includes("admin.html"), false)
  assert.equal(view.includes("js/view/menu-page.js"), true)
  assert.equal(view.includes("Sabores artesanais e momentos de aconchego para o seu dia."), true)
  const viewScript = await readFile(new URL("../js/view/render-menu.js", import.meta.url), "utf8")
  assert.equal(viewScript.includes("formatSchedule"), false)
  const baseCss = await readFile(new URL("../css/base.css", import.meta.url), "utf8")
  const printCss = baseCss.slice(baseCss.indexOf("@media print"))
  for (const selector of [".barra", ".categorias", "#rodape", ".whatsapp"]) {
    assert.equal(printCss.includes(selector), true, selector)
  }
  assert.equal(printCss.includes("display: none"), true)
  assert.equal(printCss.includes("print-color-adjust: exact"), true)
  assert.equal(printCss.includes("padding-top: 2cm"), true)
  assert.equal(printCss.includes("#111"), false)
  assert.equal(printCss.includes("transparent"), false)
  for (const theme of ["claro", "escuro", "rustico", "vibrante"]) {
    assert.equal(admin.includes(`value="${theme}"`), true, theme)
  }
  for (const id of [
    "formulario-loja",
    "modal-loja",
    "adicionar-loja",
    "lista-lojas",
    "formulario-produto",
    "modal-produto",
    "adicionar-produto",
    "lista-produtos",
    "formulario-csv",
    "erros-csv",
    "formulario-tema",
    "tema-selecionado",
    "publicar",
  ]) {
    assert.equal(admin.includes(`id="${id}"`), true, id)
  }
  assert.equal(admin.includes('name="abertura"'), false)
  assert.equal(admin.includes('name="fechamento"'), false)
  assert.equal(admin.includes('name="dias"'), false)
  assert.equal(admin.includes("js/admin/admin-page.js"), true)
  assert.equal(admin.includes('href="index.html?preview=1"'), true)
  assert.equal(admin.includes(">Ver publicado<"), true)
})
