# Solvo GenAI · Seguimiento de Productos

Sitio estático (sin base de datos) que publica, para los stakeholders de Solvo Global, **qué
construimos, cómo funciona cada componente por dentro, qué datos mueve, dónde actúa la IA y en
qué estado está**.

Es un **dashboard**: sidebar persistente y pantallas que se escanean, no un documento
para leer de corrido. La navegación baja en cuatro niveles y el sidebar despliega los
componentes del producto abierto, así nunca hace falta volver atrás.

```
#/                             Productos — el ecosistema y sus números
#/p/<producto>                 Detalle del producto — madurez, cadena de valor, bloqueantes, infra
#/p/<producto>/componentes     Componentes del producto
#/p/<producto>/c/<comp>[/tab]  Detalle del componente — pestañas: funciona · estado · datos · entregas · recursos
#/estado                       Cómo vamos — dónde está hoy cada componente y qué lo frena
#/que-sigue                    Qué sigue — cambios pedidos, funciones nuevas y salidas a producción
```

Misma convención de repo que [`solvo-genai-prototypes`](../solvo-genai-prototypes/README.md):
**Vite + JavaScript vanilla**, `public/` commiteada, deploy en Vercel.

## Comandos

```bash
npm install
npm run sync      # genera public/data/** + tokens y logos del design system (necesita el vault)
npm run dev       # sync + servidor de desarrollo (localhost:5175)
npm run build     # verify + build de producción → dist/  (lo que corre Vercel)
npm run preview   # sirve dist/ localmente
```

**`sync` necesita el vault; `build` no.** Vercel clona este submódulo solo, sin
`../../shared/` al lado, así que el `prebuild` corre `prep-data.mjs --verify`: valida la
estructura de `src/data/` y pasa el guard anti-fuga sobre la `public/` commiteada, sin
escribir nada y sin tocar el vault. Al editar contenido, corré `npm run sync` en el
workspace y **commiteá la `public/` resultante** — es lo que consume el deploy.

## Las tres decisiones de presentación

Lo que hace a este sitio distinto de un catálogo de features:

**1. El flujo es un rail interactivo, y cada paso se explica en dos registros.** El detalle de un
componente usa el mismo modelo de interacción que el motor de los
[review decks](../solvo-review-decks/README.md): un rail horizontal de nodos, y el nodo
elegido sube su contenido al panel. Cada paso abre con **Qué pasa** — dos o tres frases sin jerga, para cualquiera — y sigue con
la mecánica para quien la necesita: **cómo lo hace** numerado, **las reglas y excepciones** que
aplica (ahí vive el comportamiento ante fallos) y **con qué sistemas trabaja**. Entre medio,
una franja compacta con el dato que **entra** y el que **sale**. Nadie tiene que leer lo que no
le sirve, y el técnico no se queda sin profundidad.

El mismo rail sirve para las **pantallas** de una web app, porque el modelo de interacción
del sitio debe ser uno solo. Con una diferencia que carga información: los pasos van
numerados y con barra de avance (el orden importa: el paso 3 no corre antes que el 2); las
pantallas van con su glifo esquemático y sin progreso, porque en una app el orden no es
información.

**2. La IA está marcada y explicada igual en todas partes.** El naranja de marca está
**reservado para la IA**: toda marca naranja del sitio señala un punto donde actúa un modelo, y
nunca se usa para estado. El nodo que lleva IA se distingue en el rail antes de abrirlo, y al
abrirlo aparece siempre la misma estructura — *rol · qué se le entrega · qué se le instruye ·
qué devuelve · qué NO decide*. Vive en el paso donde ocurre, no en un índice aparte: el conteo
de puntos de IA por producto y por componente es lo que dice dónde buscar.

**3. El estado vive aparte del contenido funcional, y el presente aparte del futuro.**
`#/estado` responde **dónde estamos**: la matriz de componente × dónde está × lo que viene ×
qué lo frena, con una frase concreta en cada celda en vez de una etiqueta suelta. `#/que-sigue` responde **qué viene**: los cambios pedidos, las funciones nuevas y
lo que está por salir, agrupados por cuán cerca están de producción. La línea entre las dos es
nítida — un bloqueante es un impedimento de hoy y vive en el estado; todo lo que mira hacia
adelante vive en Qué sigue — y así ninguna de las dos duplica a la otra.

## Modelo: producto → componente

Un **componente** es una unidad que compone un producto (una automatización, una web app o
ambas) con funcionamiento propio, recursos asignados y entregas. Su `id` en el catálogo = el
*domain slug* del vault (el mismo que aparece en `proyectos[]` del inventario de recursos), que
es lo que permite filtrar sus recursos.

`tipo`: `automatizacion` (pipeline por pasos) · `webapp` (páginas) · `hibrido` (ambos).

## Arquitectura

```
src/
  catalog.js          # MANIFIESTO (a mano): productos → componentes, tipo y estado
  main.js             # chrome + hash router
  render.js           # primitivas: badges, barra de madurez, recursos, capas
  store.js            # acceso cacheado a /data
  views/              # productos · producto (+ componentes) · componente · estado · proximo
  components/
    flow.js           # el rail interactivo y el bloque de IA (elemento firma)
  chrome.css          # shell de dashboard (sidebar + migas) + semánticos del sitio
  theme/dark.css      # dark mode (el brand GenAI no lo trae)
  styles/             # flow (el rail) · paneles (tiles, cards, matriz, índice de IA)
  data/
    componentes/*.json     # flujo.pasos[] (con datos{} e ia{}) · paginas[] · datos{}
    cadena-valor/*.json    # estaciones[] por producto
    infra/*.json           # nodes[] por capa + edges[]
    estado/estado-actual.json  # estado y bloqueantes por componente (el presente)
    proximo/que-sigue.json     # cambios, funciones nuevas y salidas planificadas (el futuro)
scripts/prep-data.mjs  # sync: recursos enmascarados + validación + guard + tokens
public/                # GENERADO por el sync (se commitea; Vercel solo corre vite build)
```

## Editar contenido

- **Alta o estado de un componente** → `src/catalog.js`.
- **Cómo funciona** → `src/data/componentes/<comp>.json`:
  - automatización → `flujo.pasos[]`. Cada paso se escribe en **dos registros, uno por
    audiencia**: `quePasa` es la explicación en lenguaje llano (sin jerga, 2–3 frases) y debajo
    va la mecánica — `acciones[]` (lo que hace, numerado), `reglas[]` (condiciones, exclusiones
    y comportamiento ante fallos) y `trabajaCon[]` (los sistemas que toca, con nombres
    genéricos). `entra[]` y `sale[]` son el dato que entra y el que sale. `reglas` es opcional:
    un paso sin condiciones no la lleva. Si en ese paso actúa un modelo, se agrega su bloque
    `ia`. `flujo.ramas[]` enlaza a otros componentes por su `componente`.
  - web app → `paginas[]`, cada página con `proposito`, `contenido[]`, `funciones[]`, `roles` y
    `origenDatos[]`, más su `arquetipo` (define el glifo: `auth · tiles · list · detail · table ·
    search · form`).
- **Cadena de valor** → `src/data/cadena-valor/<producto>.json`.
- **Infraestructura** → `src/data/infra/<producto>.json` (`nodes[]` con su `capa` y su
  `tecnologia`, `edges[]`). Capas válidas:
  `aplicacion · orquestacion · datos · externo · plataforma`. Cada nodo lleva **dos nombres**:
  el funcional (`nombre`, qué es la pieza) y el técnico (`tecnologia`, con qué está hecha —
  `Angular · Azure Static Web App`, `n8n · Azure Virtual Machine`, `OpenAI · GPT-4o-mini`). Ese
  par es lo que hace la sección legible para las dos audiencias. Los nodos van sin emoji a
  propósito: no todos los equipos corporativos los renderizan.
- **Estado y bloqueantes** → `src/data/estado/estado-actual.json` (`estado` · `bloqueante`).
  Solo el presente: dónde está el componente y qué lo tiene frenado.
- **Qué sigue** → `src/data/proximo/que-sigue.json`. Cada item declara su `componente`, su
  `tipo` (`cambio` = lo pidieron · `funcion` = capacidad nueva · `despliegue` = salida a
  producción), su `estado` de avance (`listo` · `construccion` · `planificado`), y
  opcionalmente `cuando` (en qué sprint sale) y `bloqueado` (qué lo frena). El color de la card lo
  carga el avance hacia producción, no el tipo: así el verde sigue significando lo mismo en
  todo el sitio.
- Las dos fuentes salen de `shared/tracking/Roadmap-Entregas-Handoff.md` del vault; al
  actualizarlas, actualizar también `site.corteEstado` en el catálogo.
- **Recursos** → se editan en el inventario del vault; el sync los re-deriva enmascarados.

El sync valida antes de publicar: que todo componente tenga su JSON, que su tipo coincida con lo
que trae (una automatización sin pasos falla), que **todo paso tenga su explicación llana, su entrada, su salida y sus acciones**, que
**todo bloque de IA tenga sus cinco campos**, que toda página tenga contenido, funciones, roles y
origen, y que ramas, estaciones y edges apunten a algo que existe. Si algo está roto, aborta.

## Seguridad — enmascaramiento

El sitio es **cliente-facing**: nunca publica identificadores reales de infraestructura.

1. **Recursos** — `prep-data.mjs` lee `../../shared/tracking/inventario-recursos.json` y emite
   solo una *allowlist* de campos seguros: `titulo`, `tipo`, `capa`, `ambiente`, `estado`,
   `proyectos`. Nunca `nombre`, `resourceGroup`, `tipoAzure`, `descripcion`, `comoSeUtiliza`,
   `notas` ni `costoMensualUSD`. El tipo técnico se traduce a lenguaje de negocio.
2. **Guard anti-fuga** — tras generar, escanea **todo** `public/data/` contra patrones sensibles
   (nombres de recursos, resource groups, grupos de seguridad, dominios de servicio, datos de
   costo, posibles secretos). Si algo se cuela, el build **aborta con código 1**.
3. **Prompts** — el campo `ia.instruccion` se escribe **parafraseado en lenguaje natural**: el
   sitio explica qué se le pide al modelo, nunca publica el texto interno con que se lo configura.

> **La línea es entre tecnología e instancia.** Nombrar el stack es correcto y es lo que un
> lector técnico necesita — Angular, FastAPI, n8n, PostgreSQL Flexible Server, Entra ID,
> Key Vault, Front Door + WAF, OpenAI, Brevo, Oxylabs. Lo que nunca se publica es *cuál*: no
> hay nombres de instancias, resource groups, dominios ni schemas. El guard escanea los JSON
> escritos a mano igual que los generados, como red de seguridad de la autoría.

Los **Executive Summaries** del vault son la *fuente* con la que se redacta el contenido de
`src/data/`, pero **no se publican** como documento.

## Design system

**Solvo GenAI** (`shared/design-system/solvo-genai/`): Poppins + Open Sans, primary `#F19556`,
secondary `#775AE5`. El sync vendoriza sus tokens **y sus logos** a `public/design-system/`.

Los logos se usan en dos lugares: el **icono** en la marca del sidebar —`Icon_Color` sobre claro,
`Icon_White` sobre oscuro, intercambiados por CSS según el tema— y el mismo icono como
**favicon**. El lockup completo (`Logo_Color` / `Logo_White`) queda vendorizado por si hace falta,
pero no se usa en el chrome: las dos versiones son lockups distintos (uno apilado, otro
horizontal) y alternarlos por tema movería el layout.

Como el brand no trae dark mode ni paleta de datos, el sitio aporta dos capas propias:

- `src/theme/dark.css` — redefine solo los semánticos del sitio; las rampas de marca no cambian.
  La rampa de madurez **no se invierte**: se eligió de nuevo contra la superficie oscura, donde
  más maduro = más luminoso.
- **Estados: un tono por estado**, no una rampa de un solo color. Cada par se verificó por
  separación (OKLab ΔE, visión normal y daltonismo simulado) y por contraste:

  | Estado | Claro | Oscuro |
  |---|---|---|
  | En producción | `#15803D` verde | `#4ADE80` |
  | En QA | `#EAB308` amarillo (texto `#A16207`) | `#FBBF24` |
  | En desarrollo | `#1D4ED8` azul | `#7CA0FF` |
  | Suspendido | `#6B7280` gris + tramado 45° | `#6B7280` |
  | Bloqueante | `#B91C1C` rojo | `#F87171` |

  Dos notas de la verificación. El amarillo elegido (`#CA8A04`/`#A16207`) es el que despeja a la
  vez el verde de producción y el naranja de la IA — los ámbares más oscuros caen sobre el
  naranja (ΔE ≈ 5, indistinguibles). Y verde↔amarillo queda en ΔE 7.7 bajo deuteranopia, apenas
  por debajo del piso: el alivio es que **todo badge lleva su etiqueta en texto**, que es el
  canal primario.

- **La IA se distingue por forma, no solo por tono.** Rojo y naranja quemado no se separan bajo
  daltonismo (ΔE 3.4), y ambos co-ocurren en las cards de componente. Por eso el chip de IA es
  **sólido** (`#A0531E` con texto blanco en claro; `#E07E3A` con texto oscuro en oscuro) frente
  a los badges de estado, que son delineados. La diferencia de forma no depende de la visión
  del color.

El color nunca es el único canal: todo estado y todo bloque de IA lleva además su etiqueta en texto.

## Deploy (Vercel)

Framework **Vite**, build `npm run build`, output `dist/`. `vercel.json` fija una CSP estricta
(sin scripts inline, sin frames, sin conexiones externas más allá de las fuentes de Google).

Vercel **no** corre el sync —no tiene el vault— pero sí corre el **guard anti-fuga** vía
`prebuild --verify`: un identificador real que alguien edite a mano en `public/` rompe el
deploy en lugar de publicarse.
