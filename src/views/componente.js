// ============================================================
// COMPONENTE — el detalle, con el rail interactivo de los review decks.
//
// La vista se divide en pestañas para que cada pantalla se lea de un vistazo
// en vez de ser un muro. La pestaña por defecto es "Cómo funciona": el rail,
// donde un clic por paso despliega sus carriles de datos y su bloque de IA.
// ============================================================
import { findProducto, findComponente, TIPO } from '../catalog.js'
import { esc, lista, despliegueBadge, recursosHtml } from '../render.js'
import { getComponente, getEstado, getRecursos } from '../store.js'
import { flowHtml, montarFlows } from '../components/flow.js'

const ISSUE = {
  bloqueante: { cls: 'stop', label: 'Bloqueante' },
  pendiente: { cls: 'wait', label: 'Pendiente' },
  estado: { cls: 'ok', label: 'Estado' },
}

// Lo que devuelve la vista: html + los datos que necesitan los rails al montarse.
export async function renderComponente(pid, cid, tab) {
  const p = findProducto(pid)
  const c = findComponente(pid, cid)
  if (!p || !c) return null

  const [data, estadoAll, recursos] = await Promise.all([getComponente(cid), getEstado(), getRecursos()])
  const issues = estadoAll[cid] || []
  const mios = recursos.filter((r) => r.proyectos.includes(cid))
  const pasos = data?.flujo?.pasos || []
  const paginas = data?.paginas || []
  const nIa = pasos.filter((s) => s.ia).length

  const tabs = [
    { id: 'funciona', label: 'Cómo funciona', n: pasos.length + paginas.length },
    { id: 'estado', label: 'Estado', n: issues.length },
    { id: 'datos', label: 'Datos' },
    { id: 'entregas', label: 'Entregas', n: c.entregas.length },
    { id: 'recursos', label: 'Recursos', n: mios.length },
  ]
  const activa = tabs.some((t) => t.id === tab) ? tab : 'funciona'

  const flujos = {}
  let cuerpo = ''

  if (activa === 'funciona') {
    if (pasos.length) {
      flujos.pasos = { items: pasos, ramas: data.flujo.ramas || [], tipo: 'paso' }
      cuerpo += `
        <div class="bloque" style="margin-top:0">
          <div class="bloque-head">
            <h2>${esc(data.flujo.titulo || 'Cómo funciona')}</h2>
            <span class="hint">qué pasa, cómo lo hace y bajo qué reglas, paso por paso</span>
          </div>
          ${flowHtml(pasos, { id: 'pasos', tipo: 'paso' })}
        </div>`
      if (data.flujo.resultado) {
        cuerpo += `
          <div class="bloque">
            <div class="panel" style="border-left:3px solid var(--mad-produccion)">
              <span class="tag" style="color:var(--mad-ink)">Resultado</span>
              <p style="margin-top:var(--space-2);font-family:var(--font-heading);font-size:var(--text-lg);font-weight:var(--font-medium);line-height:var(--leading-snug)">${esc(data.flujo.resultado)}</p>
            </div>
          </div>`
      }
    }
    if (paginas.length) {
      flujos.paginas = { items: paginas, tipo: 'pagina' }
      cuerpo += `
        <div class="bloque"${pasos.length ? '' : ' style="margin-top:0"'}>
          <div class="bloque-head">
            <h2>Las pantallas</h2>
            <span class="hint">contenido, funciones y permisos de cada pantalla</span>
          </div>
          ${flowHtml(paginas, { id: 'paginas', tipo: 'pagina' })}
        </div>`
    }
    if (!pasos.length && !paginas.length) {
      cuerpo = `<div class="empty">Sin funcionamiento documentado.</div>`
    }
  }

  if (activa === 'estado') {
    cuerpo = issues.length
      ? `<div class="issues">
          ${issues
            .map((i) => {
              const m = ISSUE[i.tipo] || ISSUE.estado
              return `<div class="issue is-${m.cls}">
                <span class="badge is-${m.cls}"><span class="dot"></span>${esc(m.label)}</span>
                <div><h4>${esc(i.titulo)}</h4>${i.detalle ? `<p>${esc(i.detalle)}</p>` : ''}</div>
              </div>`
            })
            .join('')}
        </div>`
      : `<div class="empty">Sin novedades registradas.</div>`
  }

  if (activa === 'datos') {
    cuerpo = data?.datos
      ? `<div class="datos-grid">
          <div class="datos-col"><h4>Qué recibe</h4>${lista(data.datos.entra)}</div>
          <div class="datos-col procesa"><h4>Qué hace con eso</h4>${lista(data.datos.procesa)}</div>
          <div class="datos-col"><h4>Qué entrega</h4>${lista(data.datos.produce)}</div>
        </div>`
      : `<div class="empty">Sin resumen de datos.</div>`
  }

  if (activa === 'entregas') {
    cuerpo = `<div class="panel">${c.entregas
      .map((e) => `<div class="entrega"><b>${esc(e.label)}</b><span>${esc(e.alcance)}</span></div>`)
      .join('')}</div>`
  }

  if (activa === 'recursos') {
    cuerpo = `<div class="panel">${recursosHtml(mios)}</div>`
  }

  const html = `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">${esc(c.sigla)} · ${esc(TIPO[c.tipo].label)}</span>
        <h1>${esc(c.nombre)}</h1>
        <p class="lead">${esc(c.resumen)}</p>
        <div class="meta">
          ${despliegueBadge(c.despliegue)}
          ${nIa ? `<span class="badge is-ia">✦ ${nIa} punto${nIa > 1 ? 's' : ''} de IA</span>` : ''}
          ${pasos.length ? `<span class="badge">${pasos.length} pasos</span>` : ''}
          ${paginas.length ? `<span class="badge">${paginas.length} pantallas</span>` : ''}
        </div>
      </div>

      <nav class="tabs">
        ${tabs
          .map(
            (t) =>
              `<a class="${t.id === activa ? 'active' : ''}" href="#/p/${pid}/c/${cid}${t.id === 'funciona' ? '' : '/' + t.id}">
                ${esc(t.label)}${t.n ? `<span class="n">${t.n}</span>` : ''}
              </a>`,
          )
          .join('')}
      </nav>

      ${cuerpo}
    </div>`

  return { html, mount: () => montarFlows(flujos) }
}
