export async function readPublishedMenu(fetchImpl, path) {
  try {
    const response = await fetchImpl(path)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
