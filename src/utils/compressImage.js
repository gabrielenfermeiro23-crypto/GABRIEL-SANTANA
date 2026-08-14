import imageCompression from 'browser-image-compression'

export async function compressImage(file) {
  if (!file) return null

  const options = {
    maxSizeMB: 0.5,           // Tamanho máximo em MB (~500KB)
    maxWidthOrHeight: 1200,   // Redimensiona mantendo a proporção
    useWebWorker: true
  }

  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error)
    return file // Se falhar, retorna o arquivo original como fallback
  }
}