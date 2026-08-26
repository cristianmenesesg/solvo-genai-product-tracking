// ============================================================
// QUÉ SIGUE — el trabajo que viene, separado de dónde estamos hoy.
//
// "Cómo vamos" responde en qué estado está cada componente y qué lo bloquea.
// Esta vista responde qué se está construyendo y qué está por salir. Se agrupa
// por cuán cerca está de producción, no por tipo: al stakeholder le importa
// primero qué va a ver pronto.
// ============================================================
import { todosLosComponentes } from '../catalog.js'
import { esc } from '../render.js'
import { getQueSigue } from '../store.js'

export const TIPO_ITEM = {
  cambio: { label: 'Cambio pedido', glifo: '⇄' },
  funcion: { label: 'Nueva función', glifo: '+' },
  despliegue: { label: 'Salida a producción', glifo: '↑' },
}

// El color lo carga el avance hacia producción, no el tipo: así el verde
// sigue significando lo mismo en todo el sitio.
const GRUPOS = [
  {
    id: 'listo',
    titulo: 'Listo para salir',
    hint: 'validado en QA · sale en el sprint en curso',
    cls: 'g-listo',
  },
  {
    id: 'construccion',
    titulo: 'En construcción',
    hint: 'en desarrollo',
    cls: 'g-construccion',
  },
  {
    id: 'planificado',
    titulo: 'Planificado',
    hint: 'alcance definido · sin arrancar',
    cls: 'g-planificado',
  },
]

export async function renderProximo() {
  const data = await getQueSigue()
  const items = data?.items || []
  const comps = Object.fromEntries(todosLosComponentes().map((c) => [c.id, c]))

  const card = (it) => {
    const c = comps[it.componente]
    const t = TIPO_ITEM[it.tipo] || TIPO_ITEM.cambio
    return `
      <article class="item">
        <div class="item-head">
          <span class="badge item-tipo"><span aria-hidden="true">${t.glifo}</span>${esc(t.label)}</span>
        </div>
        <h3>${esc(it.titulo)}</h3>
        <p>${esc(it.detalle)}</p>
        ${it.cuando && it.estado !== 'listo' ? `<p class="item-cuando">${esc(it.cuando)}</p>` : ''}
        ${
          it.bloqueado
            ? `<p class="item-bloqueo"><span class="badge is-stop"><span class="dot"></span>Bloqueado</span> ${esc(it.bloqueado)}</p>`
            : ''
        }
        ${c ? `<a class="item-comp" href="#/p/${c.producto.id}/c/${c.id}">${esc(c.nombre)} →</a>` : ''}
      </article>`
  }

  const grupos = GRUPOS.map((g) => {
    const suyos = items.filter((i) => i.estado === g.id)
    if (!suyos.length) return ''
    return `
      <div class="bloque">
        <div class="bloque-head">
          <h2>${esc(g.titulo)}</h2>
          <span class="hint">${esc(g.hint)}</span>
          <span class="bloque-n">${suyos.length}</span>
        </div>
        <div class="items ${g.cls}">${suyos.map(card).join('')}</div>
      </div>`
  }).join('')

  const cuenta = (t) => items.filter((i) => i.tipo === t).length

  return `
    <div class="view">
      <div class="view-head">
        <span class="eyebrow">Transversal</span>
        <h1>Qué sigue</h1>
        <p class="lead">
          Cambios pedidos, funciones nuevas y salidas a producción de los dos productos.
          El estado de despliegue de cada componente está en
          <a href="#/estado" style="color:var(--work-ink);font-weight:600">Cómo vamos</a>.
        </p>
      </div>

      <div class="tiles">
        <div class="tile"><span class="n">${items.length}</span><span class="l">pendientes en total</span></div>
        <div class="tile"><span class="n">${items.filter((i) => i.estado === 'listo').length}</span><span class="l">salen en el sprint en curso</span></div>
        <div class="tile"><span class="n">${cuenta('cambio')}</span><span class="l">cambios pedidos</span></div>
        <div class="tile"><span class="n">${cuenta('funcion')}</span><span class="l">funciones nuevas</span></div>
      </div>

      ${grupos || '<div class="empty">Sin pendientes registrados.</div>'}
    </div>`
}
