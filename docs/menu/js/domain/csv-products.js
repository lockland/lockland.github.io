import { upsertProductByName } from "./product.js"

const COLUMNS = ["nome", "descricao", "preco", "visivel", "categoria"]
const HEADER_ERROR = "Cabeçalho precisa das colunas nome, descricao, preco, visivel e categoria."

export function importProductsFromCsv(csvText, existingProducts, createIdentifier) {
  const lines = String(csvText || "").replace(/^\uFEFF/, "").split(/\r?\n/)
  let products = existingProducts
  let separator = ";"
  let header = null
  let importedCount = 0
  const errors = []

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const line = lines[index]
    if (!line.trim()) continue

    if (!header) {
      separator = detectSeparator(line)
      header = parseCsvLine(line, separator).map(cell => cell.trim().toLowerCase())
      if (COLUMNS.some(column => !header.includes(column))) {
        return { products: existingProducts, errors: [{ linha: lineNumber, motivo: HEADER_ERROR }], importedCount: 0 }
      }
      continue
    }

    // Linha inválida entra no relatório. As linhas válidas do mesmo arquivo continuam.
    try {
      const row = rowObject(header, parseCsvLine(line, separator))
      products = upsertProductByName(products, {
        nome: row.nome,
        descricao: row.descricao,
        preco: row.preco,
        visivel: parseVisibility(row.visivel),
        categoria: row.categoria,
      }, createIdentifier)
      importedCount += 1
    } catch (error) {
      errors.push({ linha: lineNumber, motivo: error.message })
    }
  }

  if (!header) {
    return { products: existingProducts, errors: [{ linha: 1, motivo: HEADER_ERROR }], importedCount: 0 }
  }

  return { products, errors, importedCount }
}

export function parseVisibility(value) {
  const normalized = String(value || "").trim().toLowerCase()
  if (["sim", "true", "1"].includes(normalized)) return true
  if (["nao", "não", "false", "0"].includes(normalized)) return false
  throw new Error("Visibilidade inválida.")
}

function detectSeparator(line) {
  const semicolons = countOutsideQuotes(line, ";")
  const commas = countOutsideQuotes(line, ",")
  return semicolons >= commas ? ";" : ","
}

function countOutsideQuotes(line, separator) {
  let count = 0
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        index += 1
        continue
      }
      insideQuotes = !insideQuotes
      continue
    }
    if (char === separator && !insideQuotes) count += 1
  }

  return count
}

function parseCsvLine(line, separator) {
  const cells = []
  let current = ""
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
        continue
      }
      insideQuotes = !insideQuotes
      continue
    }

    if (char === separator && !insideQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function rowObject(header, cells) {
  const row = {}
  header.forEach((column, index) => {
    row[column] = (cells[index] || "").trim()
  })
  return row
}
