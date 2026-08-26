// ============================================================
// PRODUCTO — el dashboard del producto: sus números, la cadena de valor,
// lo que hoy está bloqueado y sobre qué corre. El listado completo de
// componentes vive en su propia vista, para que esta se lea de un vistazo.
// ============================================================
import { findProducto } from '../catalog.js'
import { esc, madurez, despliegueBadge, CAPA, ORDEN_CAPAS } from '../render.js'
import { getCadena, getInfra, getEstado, getComponente } from '../store.js'

export async function renderProducto(pid) {
  const p = findProducto(pid)
  if (!p) return null

  const [cadena, infra, estado, datos] = await Promise.all([
    getCadena(pid),
    getInfra(pid),
    getEstado(),
    Promise.all(p.componentes.map((c) => getComponente(c.id))),
  ])

  const nIa = p.componentes.reduce((n, c, i) => n + (datos[i]?.flujo?.pasos || []).filter((s) => s.ia).length, 0)
  const abiertos = p.componentes.flatMap((c) =>
    (estado[c.id] || []).filter((i) => i.tipo === 'bloqueante').map((i) => ({ ...i, comp: c })),
  )

  const estaciones = (cadena?.estaciones || [])
    .map((e, i) => {
      const href = e.componente ? `#/p/${pid}/c/${e.componente}` : null
      const inner = `
        <span class="paso">Etapa ${i + 1}</span>
        <h4>${esc(e.titulo)}</h4>
        <p>${esc(e.detalle)}</p>
        <span class="entrega-chip">Entrega: <b>${esc(e.entrega)}</b></span>`
      return href ? `<a class="estacion" href="${href}">${inner}</a>` : `<div class="estacion">${inner}</div>`
    })
    .join('')

  const capas = ORDEN_CAPAS.map((capa) => {
    const nodos = (infra?.nodes || []).filter((n) => n.capa === capa)
    if (!nodos.length) return ''
    return `
      <div class="capa capa-${esc(capa)}">
        <div class="capa-nombre"><h4>${esc(CAPA[capa].label)}</h4><p>${esc(CAPA[capa].desc)}</p></div>
        <div class="capa-nodos">
          ${nodos
            .map(
              (n) => `<span class="nodo">
                <b>${esc(n.nombre)}</b>
                <em>${esc(n.tecnologia)}</em>
              </span>`,
            )
            .join('')}
        </div>
      </div>`
  }).join('')

  return `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">Producto</span>
        <h1>${esc(p.nombre)}</h1>
        <p class="lead">${esc(p.descripcion)}</p>
      </div>

      <div class="tiles">
        <div class="tile"><span class="n">${p.componentes.length}</span><span class="l">componentes</span></div>
        <div class="tile"><span class="n">${p.componentes.filter((c) => c.despliegue === 'produccion').length}</span><span class="l">en producción</span></div>
        <div class="tile ${nIa ? 'is-ia' : 'is-cero'}"><span class="n">${nIa}</span><span class="l">puntos de IA</span></div>
        <div class="tile ${abiertos.length ? 'is-stop' : 'is-cero'}"><span class="n">${abiertos.length}</span><span class="l">bloqueantes abiertos</span></div>
      </div>

      <div class="bloque">
        <div class="bloque-head"><h2>Madurez del producto</h2></div>
        <div class="panel">
          ${madurez(p.componentes)}
          <div style="margin-top:var(--space-5);display:flex;gap:var(--space-5);flex-wrap:wrap;font-size:var(--text-sm);color:var(--ink-2)">
            ${Object.entries(p.info).map(([k, v]) => `<span><strong>${esc(k)}:</strong> ${esc(v)}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="bloque">
        <div class="bloque-head">
          <h2>La cadena de valor</h2>
          <span class="hint">qué entrega cada etapa a la siguiente</span>
          <a class="mas" href="#/p/${pid}/componentes">Ver los ${p.componentes.length} componentes →</a>
        </div>
        <p class="lead" style="margin-bottom:var(--space-4)">${esc(cadena?.resumen || '')}</p>
        <div class="cadena">${estaciones}</div>
      </div>

      ${
        abiertos.length
          ? `<div class="bloque">
              <div class="bloque-head"><h2>Bloqueantes abiertos</h2><a class="mas" href="#/estado">Ver el estado completo →</a></div>
              <div class="issues">
                ${abiertos
                  .map(
                    (i) => `<div class="issue is-stop">
                      <span class="badge is-stop"><span class="dot"></span>Bloqueante</span>
                      <div>
                        <h4>${esc(i.titulo)}</h4>
                        <p>${esc(i.detalle)} <a href="#/p/${pid}/c/${i.comp.id}" style="color:var(--work-ink);font-weight:600">${esc(i.comp.nombre)}</a></p>
                      </div>
                    </div>`,
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }

      <div class="bloque">
        <div class="bloque-head"><h2>Sobre qué corre</h2><span class="hint">por capa · pieza y tecnología</span></div>
        <div class="capas">${capas}</div>
      </div>
    </div>`
}

// ---- Componentes del producto (vista propia) ----------------
export async function renderComponentes(pid) {
  const p = findProducto(pid)
  if (!p) return null
  const [estado, datos] = await Promise.all([getEstado(), Promise.all(p.componentes.map((c) => getComponente(c.id)))])

  const cards = p.componentes
    .map((c, i) => {
      const bloq = (estado[c.id] || []).filter((x) => x.tipo === 'bloqueante').length
      const nIa = (datos[i]?.flujo?.pasos || []).filter((s) => s.ia).length
      const pasos = datos[i]?.flujo?.pasos?.length || 0
      const pags = datos[i]?.paginas?.length || 0
      const piezas = [pasos ? `${pasos} pasos` : '', pags ? `${pags} pantallas` : ''].filter(Boolean).join(' · ')
      return `
      <a class="comp-card" href="#/p/${pid}/c/${c.id}">
        <div class="cc-top"><h3>${esc(c.nombre)}</h3>${despliegueBadge(c.despliegue)}</div>
        <p class="cc-res">${esc(c.resumen)}</p>
        <div class="cc-foot">
          <span class="cc-tipo">${esc(c.sigla)}${piezas ? ` · ${esc(piezas)}` : ''}</span>
          ${nIa ? `<span class="cc-ia">✦ ${nIa} IA</span>` : ''}
          ${bloq ? `<span class="badge is-stop"><span class="dot"></span>${bloq} bloqueante${bloq > 1 ? 's' : ''}</span>` : ''}
        </div>
      </a>`
    })
    .join('')

  return `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">${esc(p.nombre)}</span>
        <h1>Componentes</h1>
        <p class="lead">Las ${p.componentes.length} piezas del producto, con su estado, su tamaño y sus puntos de IA.</p>
      </div>
      <div class="grid-3">${cards}</div>
    </div>`
}
