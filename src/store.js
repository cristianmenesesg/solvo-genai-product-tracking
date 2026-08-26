// ============================================================
// STORE — acceso a los JSON publicados en /data (cache por ruta).
// ============================================================
const cache = {}
const get = (p) => (cache[p] ??= fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null))

export const getComponente = (id) => get(`/data/componentes/${id}.json`)
export const getCadena = (pid) => get(`/data/cadena-valor/${pid}.json`)
export const getInfra = (pid) => get(`/data/infra/${pid}.json`)
export const getEstado = () => get('/data/estado/estado-actual.json').then((d) => d || {})
export const getQueSigue = () => get('/data/proximo/que-sigue.json')
export const getRecursos = () => get('/data/recursos.json').then((d) => d?.recursos || [])
