export function readImageFile(file) {
  if (!file) return Promise.resolve("")
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("A logomarca precisa ser uma imagem."))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Não foi possível ler a logomarca."))
    reader.readAsDataURL(file)
  })
}
