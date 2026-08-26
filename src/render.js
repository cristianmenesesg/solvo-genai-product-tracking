// ============================================================
// RENDER — primitivas compartidas por las vistas.
// ============================================================
import { DESPLIEGUE, TIPO } from './catalog.js'

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const lista = (items, cls = '') =>
  `<ul${cls ? ` class="${cls}"` : ''}>${(items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`

// ---- Estado -------------------------------------------------
export const despliegueBadge = (d) => {
  const m = DESPLIEGUE[d] || DESPLIEGUE.desarrollo
  return `<span class="badge is-${esc(d)}"><span class="dot"></span>${esc(m.label)}</span>`
}
export const tipoBadge = (t) => {
  const m = TIPO[t] || TIPO.automatizacion
  return `<span class="badge">${m.icono} ${esc(m.label)}</span>`
}

// ---- Barra de madurez ---------------------------------------
// Rampa secuencial + leyenda etiquetada SIEMPRE presente: la etiqueta es el
// canal primario y la barra aporta la proporción. "Suspendido" va tramado.
const ORDEN_MADUREZ = ['produccion', 'qa', 'desarrollo', 'suspendido']

export function madurez(componentes) {
  const total = componentes.length
  const conteo = ORDEN_MADUREZ.map((k) => [k, componentes.filter((c) => c.despliegue === k).length]).filter(([, n]) => n)
  const barra = conteo
    .map(([k, n]) => `<span class="m-${k}" style="flex:${n}" title="${n} ${DESPLIEGUE[k].label.toLowerCase()}"></span>`)
    .join('')
  const leyenda = conteo
    .map(([k, n]) => `<span><i class="m-${k}"></i><strong>${n}</strong> ${esc(DESPLIEGUE[k].label.toLowerCase())}</span>`)
    .join('')
  return `
    <div>
      <div class="madurez" role="img" aria-label="${total} componentes: ${conteo.map(([k, n]) => `${n} ${DESPLIEGUE[k].label.toLowerCase()}`).join(', ')}">${barra}</div>
      <div class="madurez-leyenda">${leyenda}</div>
    </div>`
}

// ---- Recursos (ya enmascarados por el sync) ------------------
// Agrupados según la regla real del ecosistema: lo que dev y qa comparten se
// deduplica; producción muestra solo lo dedicado.
const GRUPOS = [
  { id: 'devqa', titulo: 'Desarrollo y QA', test: (r) => r.ambiente === 'dev' || r.ambiente === 'qa' },
  { id: 'prod', titulo: 'Producción', test: (r) => r.ambiente === 'prod' },
  { id: 'externo', titulo: 'Servicios externos', test: (r) => r.capa === 'externo' && r.ambiente === 'compartido' },
  { id: 'comun', titulo: 'Recursos comunes', test: (r) => r.capa !== 'externo' && r.ambiente === 'compartido' },
]
const ESTADO_CLS = { Activo: 'ok', 'En provisión': 'curso', Planificado: 'plan', 'Por confirmar': 'plan', Suspendido: 'plan' }

export function recursosHtml(rows) {
  if (!rows.length) return `<div class="empty">Sin recursos registrados.</div>`
  return GRUPOS.map((g) => {
    let items = rows.filter(g.test)
    if (g.id === 'devqa') {
      const vistos = new Set()
      items = items.filter((r) => !vistos.has(r.titulo) && vistos.add(r.titulo))
    }
    if (!items.length) return ''
    return `
      <div class="recursos-grupo">
        <h4>${esc(g.titulo)}</h4>
        <div class="recursos-lista">
          ${items
            .map(
              (r) => `<span class="recurso" title="${esc(r.estado)}">
                <span class="state ${ESTADO_CLS[r.estado] || 'plan'}"></span>
                ${esc(r.titulo)} <em>· ${esc(r.tipo)}</em>
              </span>`,
            )
            .join('')}
        </div>
      </div>`
  }).join('')
}

// ---- Capas de infraestructura --------------------------------
export const CAPA = {
  externo: { label: 'Servicios externos', desc: 'Proveedores de terceros que el ecosistema consume.' },
  aplicacion: { label: 'Aplicación', desc: 'Interfaces web y sus servicios de backend.' },
  orquestacion: { label: 'Orquestación', desc: 'Cómputo donde se ejecutan las automatizaciones.' },
  datos: { label: 'Datos', desc: 'Persistencia de datos y archivos.' },
  plataforma: { label: 'Plataforma', desc: 'Identidad, red, secretos y protección perimetral.' },
}
export const ORDEN_CAPAS = ['aplicacion', 'orquestacion', 'datos', 'externo', 'plataforma']
