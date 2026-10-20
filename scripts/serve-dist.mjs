// Sirve `dist/` (salida de `npm run build`) para el taller de la VPS 89.
// [por qué] La 89 no arranca Vite ni dev servers: basta un estático mínimo, sin dependencias.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const puerto = Number(process.env.PORT ?? 5179)
// [por qué] Por defecto solo loopback: la VPS 89 es pública y el acceso externo va por el túnel.
const host = process.env.HOST ?? '127.0.0.1'
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

// Resuelve la ruta dentro de `dist/`; devuelve null si intenta salir de ella.
function archivoDe(urlPath) {
  const relativa = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '')
  const archivo = resolve(join(raiz, relativa))
  return archivo.startsWith(raiz) ? archivo : null
}

createServer(async (req, res) => {
  let archivo
  try {
    archivo = archivoDe(new URL(req.url ?? '/', 'http://local').pathname)
  } catch {
    return res.writeHead(400).end()
  }
  if (archivo === null) return res.writeHead(403).end()
  try {
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html')
  } catch {
    // [por qué] Rutas de SPA sin archivo físico: se devuelve index.html y el router decide.
    archivo = join(raiz, 'index.html')
  }
  try {
    const cuerpo = await readFile(archivo)
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] ?? 'application/octet-stream' }).end(cuerpo)
  } catch {
    res.writeHead(404).end('sin build: ejecuta npm run build')
  }
}).listen(puerto, host, () => console.log(`dist en http://${host}:${puerto}`))
