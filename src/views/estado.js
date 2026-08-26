// ============================================================
// ESTADO — la pantalla de "cómo vamos": dónde está hoy cada componente,
// qué viene después y qué lo tiene frenado.
//
// La matriz no muestra etiquetas sueltas: cada celda dice una frase concreta.
// "Lo que viene" se deriva de que-sigue.json, así el presente y el futuro
// siguen teniendo una sola fuente cada uno y esta vista no duplica nada.
// ============================================================
import { productos, todosLosComponentes, DESPLIEGUE, TIPO, site } from '../catalog.js'
import { esc, madurez, despliegueBadge } from '../render.js'
import { getEstado, getQueSigue } from '../store.js'

// Etiqueta de avance + el pendiente concreto + cuándo sale, en ese orden.
const AVANCE = { listo: 'Listo', construccion: 'En construcción', planificado: 'Planificado' }

function textoDeItem(it) {
  if (it.tipo === 'despliegue') return it.cuando || 'Salida a producción planificada'
  const cola = it.cuando ? ` · ${it.cuando.replace('Sale a producción', 'sale')}` : ''
  return `${AVANCE[it.estado]} · ${it.titulo}${cola}`
}

export async function renderEstado() {
  const [estado, queSigue] = await Promise.all([getEstado(), getQueSigue()])
  const items = queSigue?.items || []
  const comps = todosLosComponentes().sort(
    (a, b) => DESPLIEGUE[a.despliegue].orden - DESPLIEGUE[b.despliegue].orden || a.nombre.localeCompare(b.nombre),
  )

  const filas = comps
    .map((c) => {
      const bloqueantes = (estado[c.id] || []).filter((i) => i.tipo === 'bloqueante')
      const suyos = items.filter((i) => i.componente === c.id)

      const viene = suyos.length
        ? `<ul class="celda-lista">${suyos
            .map((it) => `<li><a href="#/que-sigue">${esc(textoDeItem(it))}</a></li>`)
            .join('')}</ul>`
        : c.despliegue === 'suspendido'
          ? `<span class="celda-nada">Sin pendientes · proyecto suspendido</span>`
          : `<span class="celda-nada">Sin pendientes</span>`

      const frena = bloqueantes.length
        ? `<ul class="celda-lista">${bloqueantes
            .map((i) => `<li><b>${esc(i.titulo)}</b><small>${esc(i.detalle)}</small></li>`)
            .join('')}</ul>`
        : `<span class="celda-nada">Sin bloqueantes</span>`

      return `
      <tr${bloqueantes.length ? ' class="tiene-freno"' : ''}>
        <td class="c-nombre">
          <b><a href="#/p/${c.producto.id}/c/${c.id}">${esc(c.nombre)}</a></b>
          <small>${esc(c.producto.nombre)} · ${esc(c.sigla)} · ${esc(TIPO[c.tipo].label)}</small>
        </td>
        <td>${despliegueBadge(c.despliegue)}</td>
        <td>${viene}</td>
        <td class="c-bloq">${frena}</td>
      </tr>`
    })
    .join('')

  const resumen = productos
    .map(
      (p) => `
      <div class="panel">
        <h3 style="font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-4)">${esc(p.nombre)}</h3>
        ${madurez(p.componentes)}
      </div>`,
    )
    .join('')

  const frenados = comps.filter((c) => (estado[c.id] || []).some((i) => i.tipo === 'bloqueante')).length

  return `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">Transversal</span>
        <h1>Cómo vamos</h1>
        <p class="lead">
          Estado de despliegue, pendientes y bloqueantes de los ${comps.length} componentes del
          ecosistema. El detalle de cada pendiente está en
          <a href="#/que-sigue" style="color:var(--work-ink);font-weight:600">Qué sigue</a>.
        </p>
      </div>

      <div class="grid-2">${resumen}</div>

      <div class="bloque">
        <div class="bloque-head">
          <h2>Componente por componente</h2>
          <span class="hint">ordenado por madurez · ${frenados ? `${frenados} con bloqueantes` : 'sin bloqueantes'}</span>
        </div>
        <div class="tabla-scroll">
          <table class="matriz">
            <thead>
              <tr><th>Componente</th><th>Estado</th><th>Pendientes</th><th>Bloqueantes</th></tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <p style="margin-top:var(--space-4);font-size:var(--text-sm);color:var(--ink-3)">
          Información de estado con corte al ${esc(site.corteEstado)}.
        </p>
      </div>
    </div>`
}
