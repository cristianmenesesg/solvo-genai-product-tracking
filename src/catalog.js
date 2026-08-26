// ============================================================
// MANIFIESTO — fuente de verdad de la estructura del sitio.
// productos[] → componentes[]
//
// - Un COMPONENTE es una unidad que compone un producto: tiene funcionamiento
//   propio, recursos asignados y sus propias entregas. Su `id` = el domain slug
//   del vault (el mismo que aparece en `proyectos[]` del inventario de recursos),
//   que es lo que permite filtrar sus recursos.
// - tipo: 'automatizacion' (flujo por pasos) | 'webapp' (páginas) | 'hibrido' (ambos).
// - despliegue: vocabulario único del sitio — ver DESPLIEGUE abajo.
//
// FUENTES: los Executive Summaries del vault alimentan el contenido funcional
// (se usan como fuente, NO se publican); shared/tracking/Roadmap-Entregas-Handoff.md
// alimenta despliegue y bloqueantes.
// ============================================================

export const site = {
  nombre: 'Solvo GenAI · Seguimiento de Productos',
  brand: 'solvo-genai',
  // Corte de la información de estado (roadmap de entregas del vault).
  corteEstado: '2026-08-21',
}

export const TIPO = {
  automatizacion: { label: 'Automatización', icono: '⚙' },
  webapp: { label: 'Web App', icono: '🖥' },
  hibrido: { label: 'Híbrido', icono: '⧉' },
}

export const DESPLIEGUE = {
  produccion: { label: 'En producción', cls: 'ok', orden: 0 },
  qa: { label: 'En QA', cls: 'curso', orden: 1 },
  desarrollo: { label: 'En desarrollo', cls: 'plan', orden: 2 },
  suspendido: { label: 'Suspendido', cls: 'stop', orden: 3 },
}

export const productos = [
  {
    id: 'solvo-sales-platform',
    nombre: 'Solvo Sales Platform',
    tagline: 'De vacante detectada a reunión agendada.',
    descripcion:
      'El proceso comercial de Solvo Global, automatizado de punta a punta: detección de vacantes (de clientes actuales, del mercado ICP y por demanda), research de empresas y decisores, cold outreach personalizado con IA, y la plataforma web donde el equipo comercial trabaja el pipeline.',
    info: {
      Usuarios: '~35 del equipo comercial',
      Volumen: '~150.000 vacantes · ~5.000 empresas',
      Identidad: 'SSO corporativo con resolución de rol',
    },
    componentes: [
      {
        id: 'current-client-us-openings', sigla: 'CCO', nombre: 'Current Client US Openings',
        tipo: 'automatizacion', despliegue: 'produccion',
        resumen: 'Detecta cada semana las vacantes que publican los clientes activos de Solvo y las notifica al vendedor asignado.',
        entregas: [
          { label: 'MVP', alcance: 'Detección semanal orquestada en Indeed y LinkedIn, con notificación por vendedor.' },
          { label: 'Despliegue a producción', alcance: 'Puesta en producción del pipeline con activación controlada.' },
        ],
      },
      {
        id: 'general-us-openings', sigla: 'GUO', nombre: 'General US Openings',
        tipo: 'automatizacion', despliegue: 'produccion',
        resumen: 'Barre el mercado laboral de Estados Unidos y clasifica con IA qué vacantes puede cubrir talento remoto global.',
        entregas: [
          { label: 'MVP', alcance: 'Barrido de los 50 estados en 5 días, clasificación IA de viabilidad remota y enriquecimiento del detalle.' },
        ],
      },
      {
        id: 'on-demand-openings', sigla: 'ODO', nombre: 'On-Demand Openings',
        tipo: 'automatizacion', despliegue: 'qa',
        resumen: 'Permite que un comercial pida en el momento las vacantes de una empresa puntual, las revise y decida si las guarda.',
        entregas: [
          { label: 'MVP', alcance: 'Pipeline en dos fases (búsqueda sin persistir + confirmación con detalle) gobernado por una ventana única.' },
        ],
      },
      {
        id: 'company-decision-maker', sigla: 'CDM', nombre: 'Company & Decision Makers',
        tipo: 'automatizacion', despliegue: 'produccion',
        resumen: 'Investiga una empresa y descubre a sus decisores con email verificado, más un perfil comercial listo para usar.',
        entregas: [
          { label: 'MVP', alcance: 'Research multi-fuente con perfil de empresa, sales pitch y contactos verificados.' },
          { label: 'Release 2', alcance: 'Ampliación del pipeline de research.' },
          { label: 'Normalización de datos', alcance: 'Normalización de los datos de empresas y decisores.' },
        ],
      },
      {
        id: 'email-cold-outreach', sigla: 'ECO', nombre: 'Email Cold Outreach',
        tipo: 'automatizacion', despliegue: 'produccion',
        resumen: 'Envía cada día emails en frío con copy escrito por IA sobre las vacantes reales del prospecto, y avanza su pipeline.',
        entregas: [
          { label: 'MVP', alcance: 'Ciclo diario de selección, generación de copy con IA y envío multi-contacto.' },
          { label: 'Release 2', alcance: 'Research idempotente, observabilidad unificada y ajustes de copy.' },
          { label: 'Coherencia de copy', alcance: 'Ajuste de identidad y coherencia del mensaje.' },
        ],
      },
      {
        id: 'landing-agendamiento', sigla: 'ECO', nombre: 'Landing de Agendamiento',
        tipo: 'hibrido', despliegue: 'produccion',
        resumen: 'La página donde el prospecto que abre el email elige un horario y queda con la reunión confirmada.',
        entregas: [
          { label: 'MVP', alcance: 'Landing de agendamiento con confirmación por correo y analítica de funnel.' },
          { label: 'Release 2', alcance: 'Vitrina de talento asociada a la vacante del prospecto, medición y administración.' },
        ],
      },
      {
        id: 'reporte-funnel', sigla: 'ECO', nombre: 'Reporte de Funnel',
        tipo: 'automatizacion', despliegue: 'produccion',
        resumen: 'Mide el recorrido completo del prospecto, del correo entregado a la reunión confirmada, y lo entrega cada semana por correo.',
        entregas: [
          { label: 'MVP', alcance: 'Captura de eventos de punta a punta y reporte semanal del embudo con el detalle adjunto.' },
        ],
      },
      {
        id: 'solvo-platform', sigla: 'SPL', nombre: 'Solvo Platform',
        tipo: 'webapp', despliegue: 'produccion',
        resumen: 'La plataforma web donde el equipo comercial trabaja las vacantes y empresas que los pipelines detectan.',
        entregas: [
          { label: 'MVP', alcance: 'Autenticación SSO, dashboard, gestión de empresas y vacantes, pipeline y roles.' },
          { label: 'Release 2', alcance: 'Asignación dual con herencia, exportación CSV y filtros avanzados.' },
          { label: 'Mejoras y ajustes UI', alcance: 'Refinamientos de usabilidad sobre el alcance entregado.' },
          { label: 'Scraping On-Demand', alcance: 'Popup de scraping por demanda, ventana configurable y filtro de origen.' },
        ],
      },
      {
        id: 'reporte-estatus', sigla: 'RES', nombre: 'Reporte de Estatus del Sistema',
        tipo: 'automatizacion', despliegue: 'qa',
        resumen: 'Un correo semanal que responde qué produjo el ecosistema, si algún pipeline se detuvo y cuánto consumió cada proveedor.',
        entregas: [
          { label: 'MVP', alcance: 'Reporte de estatus de las ejecuciones del ecosistema.' },
        ],
      },
      {
        id: 'ai-avatar', sigla: 'AIA', nombre: 'AI Avatar',
        tipo: 'automatizacion', despliegue: 'suspendido',
        resumen: 'Genera videos personalizados de 60 segundos con el avatar del comercial para acompañar el outreach.',
        entregas: [
          { label: 'MVP', alcance: 'Research, confirmación humana, guion con IA y producción del video con avatar.' },
        ],
      },
    ],
  },
  {
    id: 'solvo-recruiter-platform',
    nombre: 'Solvo Recruiter Platform',
    tagline: 'De candidato abierto a talento contactado.',
    descripcion:
      'El espejo invertido del proceso comercial: en lugar de detectar vacantes, detecta personas abiertas a nuevas oportunidades, arma con ellas un pool de talento y le da a los reclutadores la plataforma para buscarlo y contactarlo.',
    info: {
      Usuarios: 'Equipo de reclutamiento de Solvo',
      Alcance: 'Talento remoto global, fuera de Estados Unidos',
      Identidad: 'SSO corporativo con resolución de rol',
    },
    componentes: [
      {
        id: 'talent-pool-scraping', sigla: 'FTPS', nombre: 'Talent Pool Scraping',
        tipo: 'automatizacion', despliegue: 'qa',
        resumen: 'Detecta candidatos que se declaran abiertos a nuevas oportunidades y construye con ellos el pool de talento.',
        entregas: [
          { label: 'PoC', alcance: 'Prueba de concepto de detección de candidatos open-to-work.' },
          { label: 'MVP v1', alcance: 'Primer pipeline productivo de construcción del pool.' },
          { label: 'Release 2', alcance: 'Pipeline de scraping completo con prework y despliegue.' },
        ],
      },
      {
        id: 'solvo-recruiter-platform', sigla: 'SRP', nombre: 'App de Reclutadores',
        tipo: 'webapp', despliegue: 'qa',
        resumen: 'La plataforma donde el reclutador busca dentro del pool de talento y lanza el contacto por email.',
        entregas: [
          { label: 'MVP', alcance: 'Autenticación SSO y roles, configuración admin, búsqueda de candidatos y outreach por email.' },
        ],
      },
    ],
  },
]

// ---- Helpers ------------------------------------------------
export const findProducto = (id) => productos.find((p) => p.id === id)
export const findComponente = (pid, cid) => findProducto(pid)?.componentes.find((c) => c.id === cid)
export const todosLosComponentes = () =>
  productos.flatMap((p) => p.componentes.map((c) => ({ ...c, producto: p })))
export const slugsDe = (p) => p.componentes.map((c) => c.id)
