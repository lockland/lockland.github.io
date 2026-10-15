const DATABASE_NAME = "cardapio"
const DATABASE_VERSION = 1
const THEME_RECORD_ID = "tema"

export function openCardapioDatabase(factory = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains("lojas")) {
        database.createObjectStore("lojas", { keyPath: "id" })
      }
      if (!database.objectStoreNames.contains("produtos")) {
        database.createObjectStore("produtos", { keyPath: "id" })
      }
      if (!database.objectStoreNames.contains("configuracao")) {
        database.createObjectStore("configuracao", { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function listStores(database) {
  return readAll(database, "lojas")
}

export function listProducts(database) {
  return readAll(database, "produtos")
}

export function readTheme(database) {
  return requestToPromise(
    database.transaction("configuracao").objectStore("configuracao").get(THEME_RECORD_ID),
  ).then(record => record?.tema || "")
}

export function writeStores(database, stores) {
  return replaceRecords(database, "lojas", stores)
}

export function writeProducts(database, products) {
  return replaceRecords(database, "produtos", products)
}

export function writeTheme(database, theme) {
  return requestToPromise(
    database.transaction("configuracao", "readwrite").objectStore("configuracao").put({
      id: THEME_RECORD_ID,
      tema: theme,
    }),
  )
}

function readAll(database, storeName) {
  return requestToPromise(database.transaction(storeName).objectStore(storeName).getAll())
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// A lista inteira entra numa transação para a marca "em uso" não ficar
// pela metade se a página fechar no meio da troca.
function replaceRecords(database, storeName, records) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite")
    const objectStore = transaction.objectStore(storeName)
    const clearRequest = objectStore.clear()
    clearRequest.onsuccess = () => {
      records.forEach(record => objectStore.put(record))
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
