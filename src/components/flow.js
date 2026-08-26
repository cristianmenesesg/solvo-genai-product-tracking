// ============================================================
// FLOW — el rail interactivo del sitio, con el mismo modelo de interacción
// que el motor de los review decks: se elige un nodo y su contenido sube al
// panel, con la barra de avance siguiendo la posición.
//
// Un solo rail sirve para dos cosas, porque la interacción debe ser una sola:
//   · los PASOS de una automatización → carriles de datos + bloque de IA
//   · las PANTALLAS de una web app    → contenido, funciones, roles y origen
// ============================================================
import { esc, lista } from '../render.js'
import { productos } from '../catalog.js'

// ---- Enlaces a otros componentes ----------------------------
const rutaComponente = (cid) => {
  for (const p of productos) if (p.componentes.some((c) => c.id === cid)) return `#/p/${p.id}/c/${cid}`
  return null
}
const nombreComponente = (cid) => {
  for (const p of productos) {
    const c = p.componentes.find((x) => x.id === cid)
    if (c) return c.nombre
  }
  return cid
}

// ---- Bloque de IA -------------------------------------------
// Estructura idéntica en todo el sitio: rol · qué se le entrega ·
// qué se le instruye · qué devuelve · qué NO decide.
export const iaBlockHtml = (ia) => `
  <div class="ia-block">
    <div class="ia-head">
      <span class="ia-glyph" aria-hidden="true">✦</span>
      <span class="badge is-ia">IA</span>
      <span class="rol">${esc(ia.rol)}</span>
    </div>
    <p class="ia-instruccion">${esc(ia.instruccion)}</p>
    <div class="ia-grid">
      <div><h5>Se le entrega</h5>${lista(ia.recibe)}</div>
      <div>
        <h5>Devuelve</h5>
        <div class="ia-produce">${(ia.produce || []).map((x) => `<code>${esc(x)}</code>`).join('')}</div>
      </div>
    </div>
    <div class="ia-nodecide">
      <strong>No decide:</strong> ${(ia.noDecide || []).map(esc).join(' · ')}
    </div>
  </div>`

// ---- Contenido del panel, por tipo de nodo -------------------
function panelDePaso(paso, i, ramas) {
  const mias = (ramas || []).filter((r) => r.from === paso.id)
  return `
    <div class="fp-in">
      <div class="fp-step">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span>${esc(paso.titulo)}</span>
        ${paso.ia ? '<span class="badge is-ia">✦ IA</span>' : ''}
        ${paso.nota ? `<span class="fp-tempo">${esc(paso.nota)}</span>` : ''}
      </div>
      <h3 class="fp-title">${esc(paso.titulo)}</h3>

      <section class="fp-sec fp-llano">
        <h4>Qué pasa</h4>
        <p>${esc(paso.quePasa)}</p>
      </section>

      <div class="fp-io">
        <div class="io-lado io-entra">
          <h4>Entra</h4>
          ${lista(paso.entra)}
        </div>
        <span class="io-flecha" aria-hidden="true">→</span>
        <div class="io-lado io-sale">
          <h4>Sale</h4>
          ${lista(paso.sale)}
        </div>
      </div>

      <div class="fp-mecanica">
        <section class="fp-sec">
          <h4>Cómo lo hace</h4>
          <ol class="fp-acciones">${(paso.acciones || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
        </section>
        ${
          paso.reglas?.length
            ? `<section class="fp-sec">
                <h4>Reglas y excepciones</h4>
                <ul class="fp-reglas">${paso.reglas.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
              </section>`
            : ''
        }
      </div>

      ${
        paso.trabajaCon?.length
          ? `<div class="fp-chips">
              <span class="tag">Trabaja con</span>
              ${paso.trabajaCon.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
            </div>`
          : ''
      }

      ${paso.ia ? iaBlockHtml(paso.ia) : ''}
      ${mias
        .map((r) => {
          const href = r.componente ? rutaComponente(r.componente) : null
          const destino = r.componente ? nombreComponente(r.componente) : r.to
          return `<p class="fp-rama">↳ ${esc(r.label)} → ${href ? `<a href="${href}">${esc(destino)}</a>` : esc(destino)}</p>`
        })
        .join('')}
    </div>`
}

function panelDePagina(pg) {
  return `
    <div class="fp-in">
      <div class="fp-step">
        <span>Pantalla</span>
        ${pg.ruta ? `<span class="fp-tempo">${esc(pg.ruta)}</span>` : ''}
      </div>
      <h3 class="fp-title">${esc(pg.nombre)}</h3>

      <section class="fp-sec fp-llano">
        <h4>Para qué sirve</h4>
        <p>${esc(pg.proposito)}</p>
      </section>

      <div class="fp-mecanica">
        <section class="fp-sec"><h4>Qué se ve</h4>${lista(pg.contenido, 'fp-items')}</section>
        <section class="fp-sec"><h4>Qué se puede hacer</h4>${lista(pg.funciones, 'fp-items')}</section>
      </div>

      <div class="fp-io">
        <div class="io-lado"><h4>Quién la ve</h4><p>${esc(pg.roles)}</p></div>
        <span class="io-flecha" aria-hidden="true">·</span>
        <div class="io-lado"><h4>De dónde salen los datos</h4>${lista(pg.origenDatos)}</div>
      </div>
    </div>`
}

// ---- Glifo esquemático de una pantalla ----------------------
const GLIFO = { auth: 2, tiles: 4, list: 4, detail: 5, table: 4, search: 3, form: 3 }
const glifo = (arq) => `<span class="glyph g-${esc(arq)}" aria-hidden="true">${'<span></span>'.repeat(GLIFO[arq] ?? 4)}</span>`

// ---- Render del rail ----------------------------------------
// `id` distingue varios rails en una misma vista (un componente híbrido).
export function flowHtml(items, { id, tipo }) {
  const n = items.length
  const nodos = items
    .map((it, i) => {
      const etiqueta = tipo === 'pagina' ? it.nombre : it.titulo
      const dot = tipo === 'pagina' ? glifo(it.arquetipo || 'list') : String(i + 1)
      return `
      <button class="flow-node" type="button" data-i="${i}" role="tab" aria-selected="${i === 0}"
              title="${esc(etiqueta)}">
        <span class="fn-dot">${dot}</span>
        ${it.ia ? '<span class="fn-ia" aria-label="tiene IA">✦</span>' : ''}
        <span class="fn-label">${esc(etiqueta)}</span>
      </button>`
    })
    .join('')

  return `
    <div class="flow" data-flow="${esc(id)}" data-tipo="${esc(tipo)}">
      <div class="flow-rail">
        <div class="flow-track"><span class="fill"></span><span class="pulse"></span></div>
        <div class="flow-nodes" style="--n:${n}" role="tablist">${nodos}</div>
      </div>
      <div class="flow-panel"></div>
    </div>`
}

// ---- Interactividad ------------------------------------------
// Se llama después de inyectar el HTML. Cada `.flow` de la página se activa
// con los datos que le corresponden, provistos por `datosPorFlujo`.
export function montarFlows(datosPorFlujo) {
  document.querySelectorAll('.flow').forEach((flow) => {
    const conf = datosPorFlujo[flow.dataset.flow]
    if (!conf) return
    const { items, ramas, tipo } = conf
    const nodos = [...flow.querySelectorAll('.flow-node')]
    const panel = flow.querySelector('.flow-panel')
    const fill = flow.querySelector('.flow-track .fill')
    let activo = -1

    const activar = (i) => {
      i = Math.max(0, Math.min(nodos.length - 1, i))
      if (i === activo) return
      activo = i
      nodos.forEach((nd, k) => {
        nd.classList.toggle('is-active', k === i)
        nd.classList.toggle('done', k < i)
        nd.setAttribute('aria-selected', k === i ? 'true' : 'false')
      })
      panel.innerHTML = tipo === 'pagina' ? panelDePagina(items[i]) : panelDePaso(items[i], i, ramas)
      if (fill) fill.style.width = (nodos.length > 1 ? (i / (nodos.length - 1)) * 100 : 0) + '%'
      panel.classList.remove('swap')
      void panel.offsetWidth
      panel.classList.add('swap')
    }

    nodos.forEach((nd, i) => {
      nd.addEventListener('click', () => activar(i))
      nd.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); activar(i + 1); nodos[Math.min(i + 1, nodos.length - 1)].focus() }
        if (e.key === 'ArrowLeft') { e.preventDefault(); activar(i - 1); nodos[Math.max(i - 1, 0)].focus() }
      })
    })
    activar(0)
  })
}

