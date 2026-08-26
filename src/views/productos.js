// ============================================================
// PRODUCTOS — la portada del dashboard: los dos productos con sus números.
// ============================================================
import { productos } from '../catalog.js'
import { esc, madurez } from '../render.js'
import { getEstado, getComponente } from '../store.js'

export async function renderProductos() {
  const estado = await getEstado()
  const datos = {}
  for (const p of productos) {
    for (const c of p.componentes) datos[c.id] = await getComponente(c.id)
  }

  const cuenta = (p) => ({
    comps: p.componentes.length,
    prod: p.componentes.filter((c) => c.despliegue === 'produccion').length,
    ia: p.componentes.reduce((n, c) => n + (datos[c.id]?.flujo?.pasos || []).filter((s) => s.ia).length, 0),
    bloq: p.componentes.reduce((n, c) => n + (estado[c.id] || []).filter((i) => i.tipo === 'bloqueante').length, 0),
  })

  const total = productos.reduce(
    (a, p) => {
      const k = cuenta(p)
      return { comps: a.comps + k.comps, prod: a.prod + k.prod, ia: a.ia + k.ia, bloq: a.bloq + k.bloq }
    },
    { comps: 0, prod: 0, ia: 0, bloq: 0 },
  )

  const cards = productos
    .map((p) => {
      const k = cuenta(p)
      return `
      <a class="producto-card" href="#/p/${p.id}">
        <div>
          <span class="eyebrow">Producto</span>
          <h3>${esc(p.nombre)}</h3>
          <p class="tagline">${esc(p.tagline)}</p>
        </div>
        <p class="desc">${esc(p.descripcion)}</p>
        <div class="mini-tiles">
          <div><span class="n">${k.comps}</span><span class="l">componentes</span></div>
          <div><span class="n">${k.prod}</span><span class="l">en producción</span></div>
          <div class="${k.ia ? 'is-ia' : 'is-cero'}"><span class="n">${k.ia}</span><span class="l">puntos de IA</span></div>
          <div class="${k.bloq ? 'is-stop' : 'is-cero'}"><span class="n">${k.bloq}</span><span class="l">bloqueantes</span></div>
        </div>
        ${madurez(p.componentes)}
        <span class="go">Ver el producto →</span>
      </a>`
    })
    .join('')

  return `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">Ecosistema Solvo</span>
        <h1>De una vacante publicada a una reunión agendada</h1>
        <p class="lead">
          Dos plataformas y ${total.comps} componentes que detectan oportunidades, investigan empresas,
          escriben el primer contacto y conectan al talento. De cada pieza: qué hace, qué datos mueve,
          dónde interviene un modelo de IA y en qué estado está.
        </p>
      </div>

      <div class="tiles">
        <div class="tile"><span class="n">${total.comps}</span><span class="l">componentes en total</span></div>
        <div class="tile"><span class="n">${total.prod}</span><span class="l">en producción</span></div>
        <div class="tile ${total.ia ? 'is-ia' : 'is-cero'}"><span class="n">${total.ia}</span><span class="l">puntos donde actúa la IA</span></div>
        <div class="tile ${total.bloq ? 'is-stop' : 'is-cero'}"><span class="n">${total.bloq}</span><span class="l">bloqueantes abiertos</span></div>
      </div>

      <div class="bloque">
        <div class="bloque-head"><h2>Los productos</h2></div>
        <div class="grid-2">${cards}</div>
      </div>
    </div>`
}
