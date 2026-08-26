// ============================================================
// MAIN — shell de dashboard (sidebar + migas) y router por hash.
//
//   #/                             Productos
//   #/p/<producto>                 Detalle del producto
//   #/p/<producto>/componentes     Componentes del producto
//   #/p/<producto>/c/<comp>[/tab]  Detalle del componente
//   #/estado                       Cómo vamos
//   #/que-sigue                    Qué sigue
// ============================================================
import './chrome.css'
import { site, productos, findProducto, findComponente } from './catalog.js'
import { esc } from './render.js'
import { renderProductos } from './views/productos.js'
import { renderProducto, renderComponentes } from './views/producto.js'
import { renderComponente } from './views/componente.js'
import { renderEstado } from './views/estado.js'
import { renderProximo } from './views/proximo.js'

const app = document.getElementById('app')

// ---- Tema ---------------------------------------------------
const tema = () => document.documentElement.dataset.theme || 'light'
const temaLabel = () => (tema() === 'dark' ? '☀ Claro' : '☾ Oscuro')

function alternarTema() {
  const t = tema() === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = t
  try { localStorage.setItem('theme', t) } catch (e) {}
  const b = document.getElementById('temaBtn')
  if (b) b.textContent = temaLabel()
}

// ---- Sidebar ------------------------------------------------
// El producto abierto despliega sus componentes: la navegación de cuatro
// niveles queda visible sin tener que volver atrás.
function sidebar(ctx) {
  const productosHtml = productos
    .map((p) => {
      const abierto = ctx.pid === p.id
      const sub = abierto
        ? `<div class="side-sub">
            <a class="side-link ${ctx.vista === 'componentes' ? 'active' : ''}" href="#/p/${p.id}/componentes">Todos los componentes</a>
            ${p.componentes
              .map(
                (c) => `<a class="side-link ${ctx.cid === c.id ? 'active' : ''}" href="#/p/${p.id}/c/${c.id}" title="${esc(c.nombre)}">
                  <span class="pip" style="background:var(--mad-${esc(c.despliegue)})"></span>${esc(c.nombre)}
                </a>`,
              )
              .join('')}
          </div>`
        : ''
      return `
        <a class="side-link ${abierto && ctx.vista === 'producto' ? 'active' : ''}" href="#/p/${p.id}">
          <span class="ico" aria-hidden="true">◧</span>${esc(p.nombre)}
        </a>${sub}`
    })
    .join('')

  return `
    <aside class="side">
      <a class="side-brand" href="#/">
        <img class="logo-claro" src="/design-system/solvo-genai/logos/SolvoGenAI_Icon_Color.png" alt="Solvo GenAI" />
        <img class="logo-oscuro" src="/design-system/solvo-genai/logos/SolvoGenAI_Icon_White.png" alt="Solvo GenAI" />
        <span><b>Seguimiento de Productos</b><small>Solvo GenAI</small></span>
      </a>

      <div class="side-group">
        <span class="tag">Productos</span>
        <a class="side-link ${ctx.vista === 'productos' ? 'active' : ''}" href="#/">
          <span class="ico" aria-hidden="true">▤</span>Todos los productos
        </a>
        ${productosHtml}
      </div>

      <div class="side-group">
        <span class="tag">Transversal</span>
        <a class="side-link ${ctx.vista === 'estado' ? 'active' : ''}" href="#/estado">
          <span class="ico" aria-hidden="true">◑</span>Cómo vamos
        </a>
        <a class="side-link ${ctx.vista === 'proximo' ? 'active' : ''}" href="#/que-sigue">
          <span class="ico" aria-hidden="true">→</span>Qué sigue
        </a>
      </div>

      <div class="side-foot">
        <span class="tag">Estado con corte al</span>
        <span style="font-size:var(--text-xs);color:var(--ink-2)">${esc(site.corteEstado)}</span>
      </div>
    </aside>`
}

// ---- Migas --------------------------------------------------
function migas(ctx) {
  const partes = [{ label: 'Productos', href: '#/' }]
  const p = ctx.pid ? findProducto(ctx.pid) : null
  if (p) partes.push({ label: p.nombre, href: `#/p/${p.id}` })
  if (ctx.vista === 'componentes') partes.push({ label: 'Componentes' })
  if (ctx.cid) {
    partes.push({ label: 'Componentes', href: `#/p/${ctx.pid}/componentes` })
    partes.push({ label: findComponente(ctx.pid, ctx.cid)?.nombre || ctx.cid })
  }
  if (ctx.vista === 'estado') partes.push({ label: 'Cómo vamos' })
  if (ctx.vista === 'proximo') partes.push({ label: 'Qué sigue' })

  return `<nav class="crumbs">${partes
    .map((x, i) =>
      i < partes.length - 1
        ? `<a href="${x.href}">${esc(x.label)}</a><span>/</span>`
        : `<span style="color:var(--ink)">${esc(x.label)}</span>`,
    )
    .join('')}</nav>`
}

// ---- Montaje ------------------------------------------------
function montar(contenido, ctx, mount) {
  app.innerHTML = `
    <div class="shell">
      ${sidebar(ctx)}
      <div class="main">
        <header class="topbar">
          ${migas(ctx)}
          <div class="acciones"><button class="btn-ghost" id="temaBtn">${temaLabel()}</button></div>
        </header>
        ${contenido}
      </div>
    </div>`
  const b = document.getElementById('temaBtn')
  if (b) b.onclick = alternarTema
  if (mount) mount()
  document.querySelector('.main')?.scrollTo(0, 0)
  window.scrollTo(0, 0)
}

const noEncontrado = `
  <div class="view">
    <div class="view-head">
      <h1>Esa página no existe</h1>
      <p class="lead">Volvé a <a href="#/" style="color:var(--work-ink);font-weight:600">los productos</a>.</p>
    </div>
  </div>`

// ---- Router -------------------------------------------------
async function route() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)

  if (partes[0] === 'estado') return montar(await renderEstado(), { vista: 'estado' })
  if (partes[0] === 'que-sigue') return montar(await renderProximo(), { vista: 'proximo' })

  if (partes[0] === 'p' && partes[1]) {
    const pid = partes[1]

    if (partes[2] === 'componentes') {
      const html = await renderComponentes(pid)
      return montar(html || noEncontrado, { vista: 'componentes', pid })
    }

    if (partes[2] === 'c' && partes[3]) {
      const res = await renderComponente(pid, partes[3], partes[4])
      if (!res) return montar(noEncontrado, { vista: 'componente', pid })
      return montar(res.html, { vista: 'componente', pid, cid: partes[3] }, res.mount)
    }

    const html = await renderProducto(pid)
    return montar(html || noEncontrado, { vista: 'producto', pid })
  }

  montar(await renderProductos(), { vista: 'productos' })
}

window.addEventListener('hashchange', route)
route()
