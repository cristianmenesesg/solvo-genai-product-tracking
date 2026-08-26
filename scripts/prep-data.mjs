// ============================================================
// prep-data.mjs — genera public/ desde src/data/ + el vault.
//
// Corre en predev y prebuild. Vercel NO lo corre: consume la public/ commiteada.
//
//   1) Vendoriza los tokens del brand Solvo GenAI del vault.
//   2) Deriva el inventario de recursos ENMASCARADO (allowlist de campos).
//   3) Copia el contenido de src/data/ a public/data/.
//   4) Valida la estructura (referencias, vocabularios, completitud).
//   5) GUARD ANTI-FUGA: escanea todo public/data/ contra patrones sensibles.
//      Si algo se cuela, aborta el build.
//
// El sitio es cliente-facing: nunca publica identificadores reales de
// infraestructura (nombres Azure, resource groups, grupos de seguridad,
// subdominios) ni dato alguno de costo.
// ============================================================
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { productos, todosLosComponentes, DESPLIEGUE, TIPO } from '../src/catalog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(__dirname, '..')
const VAULT = path.resolve(SITE, '..', '..')
const SRC_DATA = path.join(SITE, 'src', 'data')
const PUB = path.join(SITE, 'public')
const PUB_DATA = path.join(PUB, 'data')
const INVENTARIO = path.join(VAULT, 'shared', 'tracking', 'inventario-recursos.json')
const DS = path.join(VAULT, 'shared', 'design-system', 'solvo-genai')
const DS_TOKENS = path.join(DS, 'tokens.css')
// Icono para el sidebar y el favicon; el color va sobre claro y el blanco sobre oscuro.
const DS_LOGOS = ['SolvoGenAI_Icon_Color.png', 'SolvoGenAI_Icon_White.png', 'SolvoGenAI_Logo_Color.png', 'SolvoGenAI_Logo_White.png']

const exists = (p) => fs.access(p).then(() => true).catch(() => false)
const fail = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1) }

// ---- Capas de infraestructura ------------------------------
// El tipo de recurso decide su capa; el sitio nunca muestra el tipo Azure real.
export const CAPAS = ['orquestacion', 'aplicacion', 'datos', 'externo', 'plataforma']
const CAPA_POR_TIPO = {
  'Virtual Machine': 'orquestacion',
  'Container Apps Environment': 'orquestacion',
  'Container App': 'aplicacion',
  'Static Web App': 'aplicacion',
  'PostgreSQL Flexible Server': 'datos',
  'Storage Account': 'datos',
  'API externa': 'externo',
  'Container Registry': 'plataforma',
  'Key Vault': 'plataforma',
  'Virtual Network': 'plataforma',
  'Private Endpoint': 'plataforma',
  'Network Interface': 'plataforma',
  Identity: 'plataforma',
  'Front Door + WAF': 'plataforma',
}

// Traducción de tipos técnicos a lenguaje de negocio (el sitio es cliente-facing).
const TIPO_LEGIBLE = {
  'Virtual Machine': 'Servidor de automatizaciones',
  'Container Apps Environment': 'Entorno de contenedores',
  'Container App': 'Servicio de aplicación',
  'Static Web App': 'Sitio web',
  'PostgreSQL Flexible Server': 'Base de datos',
  'Storage Account': 'Almacenamiento de archivos',
  'API externa': 'Servicio externo',
  'Container Registry': 'Registro de imágenes',
  'Key Vault': 'Bóveda de secretos',
  'Virtual Network': 'Red privada',
  'Private Endpoint': 'Acceso privado',
  'Network Interface': 'Interfaz de red',
  Identity: 'Identidad corporativa',
  'Front Door + WAF': 'Protección perimetral',
}

// ---- 1) Design system --------------------------------------
async function vendorTokens() {
  if (!(await exists(DS_TOKENS))) {
    fail(`No se encontró el design system en ${DS_TOKENS}.\n  El sync necesita el workspace del vault softgic.`)
  }
  const out = path.join(PUB, 'design-system', 'solvo-genai')
  await fs.mkdir(path.join(out, 'logos'), { recursive: true })
  await fs.copyFile(DS_TOKENS, path.join(out, 'tokens.css'))
  for (const l of DS_LOGOS) {
    const src = path.join(DS, 'assets', 'logos', l)
    if (!(await exists(src))) fail(`Falta el logo ${l} en el design system.`)
    await fs.copyFile(src, path.join(out, 'logos', l))
  }
}

// ---- 2) Recursos enmascarados ------------------------------
// ALLOWLIST estricta: solo estos campos salen del inventario. Nunca `nombre`,
// `resourceGroup`, `tipoAzure`, `descripcion`, `comoSeUtiliza`, `notas` ni `costoMensualUSD`.
async function derivarRecursos() {
  if (!(await exists(INVENTARIO))) fail(`No se encontró el inventario de recursos en ${INVENTARIO}.`)
  const { meta, recursos } = JSON.parse(await fs.readFile(INVENTARIO, 'utf8'))

  const salida = recursos
    .filter((r) => r.estado !== 'Eliminado')
    .map((r) => {
      const capa = CAPA_POR_TIPO[r.tipo]
      if (!capa) fail(`Recurso con tipo sin capa asignada: "${r.tipo}". Agregalo a CAPA_POR_TIPO.`)
      return {
        titulo: r.titulo,
        tipo: TIPO_LEGIBLE[r.tipo] || r.tipo,
        capa,
        ambiente: r.ambiente,
        estado: r.estado,
        proyectos: r.proyectos || [],
      }
    })

  await fs.mkdir(PUB_DATA, { recursive: true })
  await fs.writeFile(
    path.join(PUB_DATA, 'recursos.json'),
    JSON.stringify({ corte: meta.corte, recursos: salida }, null, 2),
  )
  return salida
}

// ---- 3) Copia de contenido ---------------------------------
async function copiarData() {
  await fs.rm(path.join(PUB_DATA, 'componentes'), { recursive: true, force: true })
  await fs.rm(path.join(PUB_DATA, 'cadena-valor'), { recursive: true, force: true })
  await fs.rm(path.join(PUB_DATA, 'infra'), { recursive: true, force: true })
  await fs.rm(path.join(PUB_DATA, 'estado'), { recursive: true, force: true })
  await fs.rm(path.join(PUB_DATA, 'proximo'), { recursive: true, force: true })
  await fs.cp(SRC_DATA, PUB_DATA, { recursive: true })
}

// ---- 4) Validación -----------------------------------------
const leerJson = async (p) => (await exists(p) ? JSON.parse(await fs.readFile(p, 'utf8')) : null)

async function validar(recursos) {
  const errores = []
  const comps = todosLosComponentes()
  const idsComp = new Set(comps.map((c) => c.id))

  for (const c of comps) {
    if (!DESPLIEGUE[c.despliegue]) errores.push(`${c.id}: despliegue "${c.despliegue}" fuera del vocabulario.`)
    if (!TIPO[c.tipo]) errores.push(`${c.id}: tipo "${c.tipo}" fuera del vocabulario.`)

    const data = await leerJson(path.join(SRC_DATA, 'componentes', `${c.id}.json`))
    if (!data) { errores.push(`${c.id}: falta src/data/componentes/${c.id}.json`); continue }

    const quiereFlujo = c.tipo === 'automatizacion' || c.tipo === 'hibrido'
    const quierePaginas = c.tipo === 'webapp' || c.tipo === 'hibrido'
    if (quiereFlujo && !data.flujo?.pasos?.length) errores.push(`${c.id}: tipo ${c.tipo} pero sin flujo.pasos[].`)
    if (quierePaginas && !data.paginas?.length) errores.push(`${c.id}: tipo ${c.tipo} pero sin paginas[].`)

    // Todo paso lleva su explicación llana, su dato de entrada y salida, y su mecánica.
    for (const p of data.flujo?.pasos || []) {
      if (!p.quePasa) errores.push(`${c.id} · paso ${p.id}: falta "quePasa" (la explicación en lenguaje llano).`)
      for (const k of ['entra', 'sale', 'acciones', 'trabajaCon']) {
        if (!p[k]?.length) errores.push(`${c.id} · paso ${p.id}: falta "${k}[]".`)
      }
      if (p.ia) {
        for (const k of ['rol', 'recibe', 'instruccion', 'produce', 'noDecide']) {
          if (!p.ia[k] || (Array.isArray(p.ia[k]) && !p.ia[k].length)) {
            errores.push(`${c.id} · paso ${p.id}: bloque ia sin "${k}".`)
          }
        }
      }
    }
    // Las ramas apuntan a pasos existentes.
    const idsPaso = new Set((data.flujo?.pasos || []).map((p) => p.id))
    for (const r of data.flujo?.ramas || []) {
      if (!idsPaso.has(r.from)) errores.push(`${c.id}: rama desde paso inexistente "${r.from}".`)
      if (r.componente && !idsComp.has(r.componente)) errores.push(`${c.id}: rama hacia componente inexistente "${r.componente}".`)
    }
    // Toda página lleva contenido, funciones, roles y origen.
    for (const pg of data.paginas || []) {
      for (const k of ['proposito', 'contenido', 'funciones', 'roles', 'origenDatos']) {
        if (!pg[k] || (Array.isArray(pg[k]) && !pg[k].length)) errores.push(`${c.id} · página ${pg.id}: falta "${k}".`)
      }
    }
  }

  // Cadena de valor e infra por producto.
  for (const p of productos) {
    const cadena = await leerJson(path.join(SRC_DATA, 'cadena-valor', `${p.id}.json`))
    if (!cadena?.estaciones?.length) errores.push(`${p.id}: falta cadena-valor con estaciones[].`)
    for (const e of cadena?.estaciones || []) {
      if (e.componente && !idsComp.has(e.componente)) errores.push(`${p.id}: estación hacia componente inexistente "${e.componente}".`)
    }
    const infra = await leerJson(path.join(SRC_DATA, 'infra', `${p.id}.json`))
    if (!infra?.nodes?.length) errores.push(`${p.id}: falta infra con nodes[].`)
    const idsNodo = new Set((infra?.nodes || []).map((n) => n.id))
    for (const n of infra?.nodes || []) {
      if (!CAPAS.includes(n.capa)) errores.push(`${p.id}: nodo "${n.id}" con capa inválida "${n.capa}".`)
      if (!n.tecnologia) errores.push(`${p.id}: nodo "${n.id}" sin "tecnologia" (con qué está hecha la pieza).`)
    }
    for (const e of infra?.edges || []) {
      if (!idsNodo.has(e.from) || !idsNodo.has(e.to)) errores.push(`${p.id}: edge ${e.from}→${e.to} referencia un nodo inexistente.`)
    }
  }

  // Qué sigue: el trabajo en el horizonte.
  const queSigue = await leerJson(path.join(SRC_DATA, 'proximo', 'que-sigue.json'))
  if (!queSigue?.items) errores.push('Falta src/data/proximo/que-sigue.json con items[].')
  const TIPOS_ITEM = ['cambio', 'funcion', 'despliegue']
  const ESTADOS_ITEM = ['listo', 'construccion', 'planificado']
  for (const it of queSigue?.items || []) {
    if (!idsComp.has(it.componente)) errores.push(`que-sigue · ${it.id}: componente inexistente "${it.componente}".`)
    if (!TIPOS_ITEM.includes(it.tipo)) errores.push(`que-sigue · ${it.id}: tipo "${it.tipo}" fuera del vocabulario.`)
    if (!ESTADOS_ITEM.includes(it.estado)) errores.push(`que-sigue · ${it.id}: estado "${it.estado}" fuera del vocabulario.`)
    if (!it.titulo || !it.detalle) errores.push(`que-sigue · ${it.id}: falta título o detalle.`)
  }

  // Estado y bloqueantes.
  const estado = await leerJson(path.join(SRC_DATA, 'estado', 'estado-actual.json'))
  if (!estado) errores.push('Falta src/data/estado/estado-actual.json')
  for (const id of Object.keys(estado || {})) {
    if (!idsComp.has(id)) errores.push(`estado-actual: componente inexistente "${id}".`)
  }

  // Los slugs de recursos deben existir como componentes (si no, el sidebar queda mudo).
  const slugsRecursos = new Set(recursos.flatMap((r) => r.proyectos))
  for (const s of slugsRecursos) {
    if (!idsComp.has(s)) console.warn(`  ! inventario: el slug "${s}" no corresponde a ningún componente del catálogo.`)
  }

  if (errores.length) fail(`Validación fallida (${errores.length}):\n  - ${errores.join('\n  - ')}`)
}

// ---- 5) Guard anti-fuga ------------------------------------
// Escanea TODO public/data/ — incluidos los JSON escritos a mano — contra
// patrones de identificadores reales y de costos. Ante un match, aborta.
const PATRONES = [
  { re: /solvoplat[a-z0-9]*/i, que: 'nombre real de recurso Azure' },
  { re: /\bSOL-[A-Z0-9]+(?:-[A-Z0-9]+)+/, que: 'resource group' },
  { re: /\bSG-[A-Za-z0-9]+-[A-Za-z0-9-]+/, que: 'grupo de seguridad' },
  { re: /Microsoft\.[A-Za-z]+\//, que: 'tipo de recurso ARM' },
  { re: /[a-z0-9-]+\.(?:azurewebsites|azurecontainerapps|azurecr|vault\.azure|postgres\.database|blob\.core)\.[a-z.]+/i, que: 'FQDN de recurso' },
  { re: /costoMensual|USD\s*\d|\$\s?\d+(?:[.,]\d+)?\s*(?:\/|\s)?\s*mes/i, que: 'dato de costo' },
  { re: /"resourceGroup"|"tipoAzure"|"comoSeUtiliza"/, que: 'campo prohibido del inventario' },
  { re: /\b(?:[A-Za-z0-9+/]{32,}={0,2})\b/, que: 'posible secreto o token' },
]

async function walk(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

async function guard() {
  const archivos = await walk(PUB_DATA)
  const fugas = []
  for (const f of archivos) {
    const txt = await fs.readFile(f, 'utf8')
    txt.split('\n').forEach((linea, i) => {
      for (const { re, que } of PATRONES) {
        const m = linea.match(re)
        if (m) fugas.push(`${path.relative(SITE, f)}:${i + 1} — ${que}: "${m[0]}"`)
      }
    })
  }
  if (fugas.length) {
    fail(
      `GUARD ANTI-FUGA: ${fugas.length} identificador(es) sensible(s) en public/data/.\n  - ` +
      fugas.join('\n  - ') +
      '\n\n  El sitio es cliente-facing. Reescribí el dato con un nombre genérico y volvé a correr el sync.',
    )
  }
  return archivos.length
}

// ---- main --------------------------------------------------
async function main() {
  await vendorTokens()
  const recursos = await derivarRecursos()
  await copiarData()
  await validar(recursos)
  const n = await guard()
  const comps = todosLosComponentes().length
  console.log(
    `✓ sync — ${productos.length} productos · ${comps} componentes · ${recursos.length} recursos enmascarados · ` +
    `${n} archivos publicados · guard anti-fuga OK`,
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
