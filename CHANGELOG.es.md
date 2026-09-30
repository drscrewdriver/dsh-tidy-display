# Registro de cambios

## Sin publicar

- El paquete se renombró al **`dsh-tidy-display`** sin ámbito (unscoped) y se republicó: el nombre en `package.json`, el id del módulo `src/dsh-tidy-display.ts`, el id del bundle de tsdown y la fila de insert de `cordis.patch.yml` se mueven todos juntos (la invariante id-de-módulo-=-nombre-de-paquete no cambia, solo se reancla al nuevo nombre). La publicación con ámbito anterior `@drscrewdriver/dsh-tidy-display@0.1.0` sigue en npm pero queda superada — instale por el nombre simple (`dsh plugin --profile web add dsh-tidy-display`). dist-tags: `dsh-0.1.7` y `latest`, ambos → 0.1.0.

- Se documentó la exclusión mutua con `dsh-better-display` / `@bananasoldier01/dsh-tidychat` (secciones de instalación del README): los tres registran una vista `reader` (mismo id, misma prioridad 0) en el slot de lista `conversation.view`, y el registro de slots del host rechaza el duplicado en la activación — el cliente informa `1 entry did not activate: failed` y la página se queda atascada en la pantalla de fallo de carga de plugins. Diagnosticado en vivo sobre un perfil web donde better-display seguía activo junto a la instalación npm de tidy-display; el paquete en sí no tiene ningún defecto. Desactive o desinstale better-display / tidychat antes de activar este plugin.

- Compuerta `check-harness-compat`: pasar `--path-separator=/` a ripgrep. ripgrep 15 en Windows imprime rutas con barras invertidas, de modo que el filtro de ruta `/src/client/` se saltaba todos los archivos, vaciaba en silencio el escaneo de registros oficiales y hacía fallar la comparación con la línea base con una muralla de `removedRegistrations` fantasma — y justo en el checkout contra el que se había grabado la línea base.

- Backport heredado publicado: tres ramas compat llevan el subconjunto del raíl de mensajes a hosts anteriores a 0.1.7 — `compat/0.1.5` (0.1.5-alpha.1~0.1.6, tag `v0.1.0-dsh0.1.5`), `compat/0.1.2` (0.1.2-alpha.2~0.1.4.x, tag `v0.1.0-dsh0.1.2`), `compat/0.1.1` (0.1.0-rc.7~0.1.2-alpha.1, tag `v0.1.0-dsh0.1.1`). La matriz de compatibilidad de host de arriba ya enlaza los tags.

- Id del módulo fijado en el código (corrección de compilación local del fork): `src/dsh-tidy-display.ts` ahora exporta `name = '@drscrewdriver/dsh-tidy-display'` (con el nombre del paquete y la entrada de tsdown alineados con el id con ámbito). El árbol del upstream lleva el `dsh-tidy-display` sin ámbito; construirlo sin cambios y desplegarlo bajo la entrada de perfil con ámbito impide que el host monte el bundle del cliente y todo el plugin falla en activarse en silencio (sin pestaña de 阅读, solo la vista nativa) — el mismo fallo que fork.4 corrigió en el artefacto publicado, ahora fijado a nivel de código para las compilaciones del fork.
- Las filas del reader restauran el contrato de anclas del ChatView del host: las filas user / steering / respuesta del asistente / error de turno / desconocida llevan ahora `data-chat-anchor-key={node.key}` y `data-chat-flow-kind={node.kind}` junto a los atributos del reader, igual que ya hacía `OfficialNode` para los nodos de fallback. Los plugins del ecosistema que leían las anclas nativas como fuente de verdad del DOM (p. ej. el raíl de mensajes de dsh-tidychat) dejaban de encontrar filas bajo el reader y no renderizaban nada, en silencio; el contrato nativo es estable de 0.1.0-rc.7 a 0.1.7-rc.2 y se traspasa tal cual.
- La transcripción del razonamiento recibe la placa translúcida de la burbuja de respuesta (mismo token `--dsw-alias-bg-layer-1`, radio 16px, desenfoque esmerilado en modo cristal) bajo el mismo interruptor 消息气泡 / Message bubbles, en todos los estados — el estilo base de la tarjeta era la capa opaca module-platform y su estado plano ([data-overflow=false][data-expanded=false]) eliminaba por completo la placa, ambos ponían la transcripción directamente sobre los fondos de las skins. Los paddings del estado plano se restauran sobre la placa mediante reglas de mayor especificidad; burbujas desactivadas conserva el comportamiento plano/opaco anterior.
- Burbujas de mensaje: cada respuesta final se renderiza en una burbuja redondeada que la separa del fondo de la página, de modo que el texto ya no queda directamente sobre los fondos de los hosts con skins. El modo cristal mezcla los mismos tokens de forma translúcida, imitando el tratamiento esmerilado de la burbuja del usuario. Un nuevo interruptor 消息气泡 / Message bubbles en los ajustes restaura la disposición plana cuando está apagado (persistido como `bubbles` en `dsh.reader.v1`, activado por defecto).

## 0.3.3 — 2026-09-24

- Se acepta Harness `0.1.7-rc.2` (`dsh-v0.1.7-rc.2`, `477b4f420553e8a52c2fbccc464d7561b239c443`). El rango peer sigue siendo `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` sigue siendo un slot de lista. La nueva entrada de cola `schedule-created` y la vista de herramienta `schedule_update` son registros oficiales adicionales, reflejados a través de los asientos existentes.
- El contexto de cambio de herramientas para desarrolladores (`tool-addition` / `tool-removal`) usa el título y el recuento oficiales en lugar de una fila de inyección genérica.
- Las imágenes Markdown locales aceptan la ruta de archivo del Desktop `dsh-app://app/api/file`.

## 0.3.2 — 2026-09-24

- Se completó el contrato en tiempo de ejecución del puente oficial 0.1.7-rc.1: las vistas de herramientas reciben `phase`/`useDisclosure`/`hookContext{callId}` y los nodos de chat pasan al store de instantánea `{turnData, disclosureReset}`; corrige que las vistas de herramientas oficiales caían en silencio al fallback en el host real.
- Grietas de pintura en los carriles pegajosos de la zona plegada: el carril solo pintaba el fondo sólido de su propia caja; el hueco de 14px de `.turn`, el padding de 16px de la celda previa y la franja reservada `--reader-control-width` a la derecha del carril de estado dejaban entrever contenido al desplazarse; se sustituyó por un `box-shadow` del mismo color que repinta hacia arriba/a la derecha formando una banda continua.

## 0.3.1 — 2026-09-24

- Se acepta Harness `0.1.7-rc.1`. El rango peer es `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` es un slot de lista. La vieja expectativa de cadena lanzaba una excepción durante el arranque del cliente y dejaba la página en “Failed to load plugins”.
- Los imports de iconos usan los nombres de peso de rc.1 (`IconBrowseOutlineRegular` y el resto). El tamaño sigue siendo una prop.
- La confirmación pendiente ahora lee `useSessionStatus` (`pendingInteraction`). El hook eliminado `useSessionPendingInteraction` lanzaba en cuanto el reader pintaba.
- Las etiquetas de código y terminal incluyen los campos de toolbar de rc.1 (`codeLabel`, wrap y `noExitCode`).

## 0.3.0 — 2026-09-21

- Corregido el problema por el que, tras desactivar el plegado automático y ver los detalles del proceso, al reactivarlo seguía sin poder plegarse; la reactivación restaura las reglas de plegado automático y se conservan la protección de selección de texto y el despliegue manual posterior.
- Se integran en el diseño de lectura existente las renderizaciones oficiales de feedback, detalles de herramientas, tarjetas explícitas de entregables, comandos y nodos desconocidos; el renderizador oficial se encarga de la inyección, la traducción, el store y los sub-slots.
- Se elimina la llamada directa a los componentes de herramientas y la lógica de desplegar con clic simulado; se conservan los resúmenes, plegados, animaciones y acciones rápidas de archivos existentes.
- Se integra el servicio oficial de enlaces a archivos, se pasan los números de línea de los archivos de herramientas, y se completan las imágenes Markdown locales de RC2 y la degradación por fallo de carga.
- Se corrige el despegue del fondo en el seguimiento del desplazamiento y se unifican las posiciones del carril de la columna de lectura y de la zona pegajosa.
- Los resultados del intérprete de código se muestran como salida de terminal, con líneas de contexto compatibles con `provenance` y `producer`.
- Se añaden pruebas de integración reproducibles de componentes oficiales, regresiones de interacción del plegado automático y una comprobación de compatibilidad de actualizaciones de Harness; dependencias alineadas con Harness `0.1.5-rc.2`.
- Alcance de diseño, fronteras de interfaz y módulos pendientes de converger: véase `docs/official-rendering-bridge.md`.

## 0.2.1 — 2026-09-20

### Corregido

- Los carriles fijados del reader ya no pintan sobre el composer. La fila de estado en vivo (`执行过程` / `正在使用工具`) fijada en la parte superior del scrollport con `z-index: 8`, mientras el asiento pegajoso del composer del host posee `z-index: 7` y nada entre el reader y `<body>` crea un contexto de apilamiento. Un reader en desplazamiento apretaba cada carril pegajoso a nivel de turno dentro de la banda del pie — el carril se detiene en el borde inferior de su bloque contenedor, que pasa por detrás de la tarjeta de entrada — y así el reader pintaba su propia placa opaca sobre el composer.
  - El carril de estado en vivo ahora posee el carril medido bajo la toolbar, exactamente igual que las filas de resumen cerradas, en vez de compartir el de la toolbar.
  - Los carriles que un desplazamiento puede apretar en la banda del pie quedan por debajo del asiento del composer (`z-index` 6); solo el carril de la toolbar superior conserva 7, lo que también lo mantiene por encima de los banners de bloques de código del host.
  - El modo skin ya no lleva su propia segunda escalera de carriles.
  - `tests/footer-precedence.test.ts` protege la escalera en la hoja de código fuente y en el bundle commiteado.

## 0.2.0 — 2026-09-30 (adaptación a la línea de host 0.2.0)

- 12 peers `@deepseek-ai/dsh-*` actualizados a `>=0.2.0-rc.1 <0.2.1-0`; devDependencies a 0.2.0-rc.2; `pnpm-lock.yaml` eliminado (npm es el único gestor de paquetes, `package-lock.json` en el repo).
- Línea base del gate renovada: `compat/harness-020rc2.json` (host 0.2.0-rc.2; 74 registros oficiales sin cambios, 14 de 18 archivos ancla idénticos byte a byte).
- Revisión de la deriva del host 0.2.0 (scoped-slots useMemo / contract de ui-tool solo añade userQuestionPanels / MessageItem TextShimmer / TurnProcessNodeView sin reloj en vivo): solo semántica de llamador, **cero cambios de código fuente**.
- El servidor de fixtures sirve `/favicon.ico` con 204 y registra peticiones desconocidas (primera baseline de fixtures headless en esta máquina).

## 0.2.0 — 2026-09-18

### Revisión de diffs y presentación de herramientas

- Panel de revisión de diffs reingenierado: las estadísticas de líneas añadidas/eliminadas (`+A -R`) se empujan a ras del margen derecho, perfectamente alineadas sobre la misma línea base de 32px que el texto del resumen.
- La superposición de diff se expande con limpieza dentro de la columna de lectura (0px de desbordamiento horizontal) con desplazamiento vertical independiente (`max-height: 420px; overscroll-behavior: contain`), evitando que los eventos de la rueda del ratón se filtren al flujo de la conversación.
- Las pestañas multiarchivo se desplazan horizontalmente con altura de contenido adaptativa al cambiar de archivo.
- Tarjetas de herramientas personalizadas del PR #12: la renderización de vistas de herramientas se delega en el slot `tool.call.toolview` con aislamiento por error boundary y capacidad de autoexpansión.

### Cristal esmerilado translúcido y modo skin

- El modo de cristal esmerilado translúcido es un interruptor opcional en los Ajustes.
- Al activarlo, todos los fondos de tarjetas, marcos de detalles de herramientas y bloques de código se vuelven translúcidos con desenfoque de fondo, eliminando las manchas blancas opacas y adaptándose sin costuras a fondos de pantalla y skins de ventana de terceros.

### Plegado refinado y viveza

- Se vuelve a un único interruptor intuitivo de plegado automático (**自动折叠开 / 关**) en la barra de lectura y en los Ajustes, eliminando las complejas reglas multinivel pero manteniendo razonamiento y herramientas totalmente desplegados cuando está apagado.
- Corregido el error de salto de línea para que las filas de resumen sigan siendo estrictamente de una sola línea cuando hay espacio.
- Los relojes de espera en tiempo real (`WaitClock`), el seguimiento del tiempo de ejecución y las métricas de rendimiento de tokens (`TurnMetrics`) se conservan por completo y siguen activos.
- Las revelaciones animadas incluyen tiempos de espera de respaldo para evitar bloqueos de renderizado.

### Ajustes de Tidy Display

- Cristal, plegado automático y modo de apertura de entregables comparten el store raíz `dsh.reader.v1`, de modo que Ajustes y la vista de lectura permanecen sincronizados entre recargas.
- Modo de apertura de entregables: aplicación del sistema por defecto, Sidebar opcional. Carpeta/revelar siguen siendo del SO.
- Detección de la instalación del paquete de skills generative-mcpapps e informe de estado.

### Compatibilidad y viveza

- Una espera ahora se reinicia cuando una herramienta devuelve. El conjunto de traspaso nombraba tipos del contrato de conversación (`tool-result`) mientras el reader compara contra los tipos de la capa de chat, donde una herramienta devuelta es la fila `tool-call` cuyo `data.root` lleva un resultado. Ningún nodo llevó jamás el nombre antiguo, así que la rama estaba muerta y una herramienta devuelta nunca reiniciaba el reloj. El conjunto y cada tipo sobre el que razona están ahora tipados contra la unión de tipos del propio host, de modo que un nombre erróneo falla en `tsc` en lugar de fallar en silencio en tiempo de ejecución, y una herramienta que sigue en marcha explícitamente no es una espera.
- La coreografía de plegado ya no puede quedarse atascada. Cada fase avanza sobre promesas de animación y fotogramas renderizados, y una animación cancelada rechaza mientras una pestaña oculta no entrega fotogramas — cualquiera de las dos dejaba la máquina para siempre en una fase no inactiva, lo que sostenía la fuente de fotogramas en la instantánea mostrada y pausaba la revelación del texto, de modo que el turno parecía atascado hasta que la vista se remontaba. Cada fase tiene además un plazo de reloj de pared que fuerza la siguiente fase.
- Mientras la coreografía retiene la revelación, el búfer de flujo sigue absorbiendo la fuente en lugar de salir antes, de modo que el texto nunca se reanuda desde un objetivo rancio una vez asentado el plegado.
- El estado muestra cuántos subagentes despachó el turno, leído de la fila turn-process del propio host en lugar de volver a contarse aquí.
- Se elimina la rama de renderizado `command-input`: esa cadena no es un tipo de nodo de chat en ningún host publicado, solo hacía parecer que el archivo trataba un caso que no puede ocurrir.
- Cada revelación animada recibe también un plazo de reloj de pared. `fill: 'both'` fija el fotograma clave de apertura, de modo que una Web Animation que nunca llega a `onfinish` (cancelada, desmontada o saltada por el compositor) dejaba la fila en el DOM con altura y opacidad cero — hacer clic parecía no hacer nada.
- Se añade una sección de ajustes de Tidy Display: los entregables siguen abriéndose por defecto en la aplicación del sistema, con una vista previa opcional en la Sidebar derecha, además de la detección de la raíz de skills generative-mcpapps y una guía de instalación.
- Se blindan los ecos de imágenes de envíos pendientes para que un envío de solo texto no pueda romper `conversation.view` (`images` / `attachments` pueden faltar).
- La guía de instalación nombra solo raíces relativas convencionales (`.dsh/skills`, `.agents/skills`) y nunca imprime el home del host ni rutas absolutas de paquetes de plugins.

### Lectura y plegado

- Un paso de razonamiento posterior solo pliega la tanda de proceso terminada que le sigue. La tanda que aún está en streaming queda totalmente desplegada, de modo que un turno largo se lee como alternancia de resúmenes y prosa en lugar de plegarse a mitad de pensamiento.
- La intensidad de plegado 2 (`过程摘要`) es el modo de solo proceso del PR #14: la prosa nunca se pliega; cada tanda terminada de pasos de razonamiento / herramienta / registro se pliega en un resumen que nombra lo que las herramientas hicieron de verdad (`读取 Reader.tsx`, `运行 pnpm test`), leído de la misma identidad de herramienta que usan las tarjetas de herramientas. No es el predeterminado — el plegado estándar (nivel 1) conserva la coreografía del main actual.
- Un turno de solo proceso terminado también pliega su tanda final, y se salta la fila de contador de turno cerrado duplicada que ya no necesita.

### Superficie de lectura

- Con el cristal esmerilado activado, los carriles pegajosos usan el mismo liquid glass que el panel de dsh-auto-memory: velo translúcido `bg-layer-2`, `blur(28px)`, borde filiforme, radio de 16px y una leve elevación. Los chips de detalle permanecen transparentes hasta que se les pone el cursor o el foco. Con el interruptor apagado, el acabado coincide con el main actual.
- La barra reserva el ancho de todo su grupo de controles. Medir solo el primer botón dejaba que el carril de estado pintara sobre todos los controles posteriores.
- Un separador de compactación ahora llega en lugar de aparecer sin más: la línea barre desde su centro, la píldora se instala y el dial gira una vez. Limitado por `data-motion=off` y `prefers-reduced-motion` como cualquier otra transición.

### Revisión de diffs

- Se leen los recuentos de líneas modificadas del resultado de herramienta que el host ya adjunta (`meta.diffs`, `{ path, oldText, newText }`), con retroceso a los propios argumentos de la llamada para `write` / `edit` / `str_replace_editor` cuando una compilación del host no los envía. La lista blanca de nombres importa: varias herramientas sin relación toman un campo llamado `content`, y contar las adiciones inventadas de estas atribuía cambios a llamadas que no modificaron ningún archivo.
- Las llamadas hijas de una llamada padre se pliegan en sus propios recuentos. Un `run_code` que escribe archivos informa de lo que cambiaron sus hijos en lugar de lo que contienen sus propios argumentos, de modo que una ejecución cuyas ediciones están un nivel abajo ya no pierde sus recuentos. Cada hijo aporta mediante sus propios argumentos, leídos del resultado recibido o de la llamada pendiente.
- `+N -M` va al final de la fila en verde/rojo y abre un panel que lista una entrada por archivo modificado — las pestañas de archivos, las líneas eliminadas sobre un fondo rojo y las añadidas sobre uno verde, usando la misma primitiva `DiffBlock` que la fila de herramienta oficial. El panel está en el flujo, nunca es una ventana flotante, así que el `overflow: clip` de la celda de flujo no puede cortarlo.
- Abrir y cerrar el panel anima la altura real en el propio lenguaje de movimiento del plugin, y la tarjeta se trae de vuelta a la vista cuando se abre bajo el pliegue; un panel abierto mantiene su cursor encendido.

### Espera y cronometraje

- Se muestra cuánto tiempo lleva el modelo con el turno, junto a 「深度求索中」y el indicador de espera dentro del flujo. El reloj se ancla al último evento que entregó el control al modelo — una herramienta devuelta, un contexto inyectado, un comando ejecutado, el propio mensaje del usuario — nunca al inicio del turno, de modo que una espera que recién comienza no hereda los minutos que las herramientas ya gastaron.
- Pasados diez segundos la lectura añade una insignia 「暂未响应」, y en el momento en que el modelo produce su primer bloque todo el indicador se retira. Una herramienta que sigue en marcha no es una espera: la que trabaja es la herramienta.
- Un comando que corrió mucho tiempo conserva su duración tras devolver (color de advertencia pasados diez segundos); uno rápido no muestra nada una vez terminado. Los pasos en marcha muestran un recuento de segundos en vivo y un resumen brillante mientras trabajan.

### Desplazamiento

- El seguimiento de cola solo se desacopla ante un movimiento real hacia arriba del reader. El crecimiento del contenido y la suavización del propio seguimiento también mueven `scrollTop`, y leerlo como «el usuario dejó el fondo» congelaba el seguimiento a mitad de turno.
- Se desactiva el anclaje de desplazamiento del navegador en el scroller de la conversación mientras el reader está montado: movía el viewport por su cuenta a medida que crecía la transcripción.
- Solo un campo de texto con foco suspende el seguimiento, y solo dentro del reader. Enfocar el composer solía detener el avance de la transcripción.
- Flujo al ritmo propio de la fuente: se añade un término de anticipación (feed-forward) estimado a partir de la tasa de llegada sobre el controlador proporcional. Una revelación puramente proporcional se estabilizaba en un retraso constante de `catchUpMs` sin importar la velocidad del modelo, lo que se leía 「慢」 mientras el rezago crecía con los modelos rápidos; el término de anticipación drena el rezago y el proporcional absorbe la vibración del transporte.
- Revelar un lote de palabras en un solo reloj en lugar de una palabra por intervalo fijo. El espaciado por palabra fijaba el ritmo cerca de 16 palabras/segundo, de modo que incluso un modelo rápido llegaba palabra a palabra; un lote ahora aterriza dentro de una sola ventana corta mientras que una palabra nueva solitaria mantiene la cadencia de tipeo original.
- El seguimiento propio del panel de razonamiento avanza con el rezago en lugar de a paso-y-pausa fijos: antes avanzaba dos líneas cada ~1,3 segundos sin importar la velocidad de llegada del texto, y es justo eso lo que hacía parecer que el panel se quedaba atrás respecto a un modelo rápido.
### Ganchos DOM del host

- Se conserva el gancho `data-chat-flow=""` del ChatView en la columna del Reader para que las skins que ocultan `[data-composer-seat]` cuando el scrollport no tiene chat-flow (maid-atelier, phoebe-atelier y otras) sigan mostrando el composer en la vista de lectura.

## 0.1.1 — 2026-09-16

La integración de la vista de lectura aceptada, incluido el trabajo consolidado de los PR #2, #5 y #8. Los encabezados `0.2.0` / `0.2.1` anteriores eran notas de desarrollo sin publicar; esos cambios se entregan en esta versión, no como versiones publicadas separadas.

### Lectura y plegado

- Un paso de razonamiento posterior puede plegar los pasos anteriores de su cadena en un compacto resumen de recuento. Las simples actualizaciones de cuerpo/herramienta no disparan el plegado; la entrada de usuario/steering reinicia la cadena. El control de plegado automático puede desactivar esta presentación.
- Las filas con clave estables se encogen antes de que se actualicen los contadores, pausan brevemente y luego revelan la salida amortiguada. Se preservan el orden de la fuente, el texto seleccionado, el comportamiento de movimiento reducido y la respuesta final visible.
- Las estadísticas de proceso sobreviven al fin del turno. Los pasos ocultos vacíos ya no acumulan huecos de 16px en los turnos largos terminados.
- El control de plegado automático recibe un carril de ancho completo y sin costuras, sin líneas divisorias ni sombras de reemplazo. Las estadísticas permanecen en el flujo normal hasta llegar arriba, y entonces se pegan bajo el carril de estado medido, tanto desplegadas como plegadas.
- Las etiquetas de estado cortas siguen siendo legibles en lugar de truncarse. El tiempo de espera se reinicia al último envío de usuario/steering en lugar de heredar la hora de inicio original del turno.

### Navegación y paridad nativa

- Se mantiene el TimelineRail más reciente, incluida la carga incremental del historial, las métricas por turno, el soporte de forks y un aterrizaje seguro para el composer. Se desplaza el contenedor de la conversación y no cajas ancestro sin relación.
- Se omiten las tarjetas JSON `turn-process` sintéticas del host; la entrada del comando `/goal` se renderiza como texto etiquetado; los detalles del system prompt tienen su propio scrollport.
- Se usa el chevron compacto de volver-al-fondo en el umbral nativo de casi-fondo y se coalen las capturas de anclaje de desplazamiento.
- Se muestran los controles de hora/copiar de los mensajes del usuario y la duración al cierre del turno; las filas de archivos producidos esperan a que el turno se cierre.

### Contenido interactivo

- Se renderizan MCP Apps generativas desde cercas de código admitidas, bloques personalizados y resultados de herramientas mediante un iframe aislado (`sandbox="allow-scripts allow-forms"`, sin `allow-same-origin`).
- Soporte de la inicialización JSON-RPC de SEP-1865, dimensionado, actualizaciones de contexto y retroalimentación de prompts hacia el composer, con sincronización claro/oscuro y altura automática acotada.
- Se incluye el paquete de skills generative-mcpapps, ejemplos y documentación bilingüe.

### Distribución y verificación

- Apunta a DeepSeek Harness 0.1.5-rc.2 a través de los puntos de extensión públicos de plugin/client. Sin cambios en Agent, SDK, proveedores, credenciales ni el núcleo de Harness.
- Se entrega el parche del bundle de instalación estándar y la `lib/` reconstruida y commiteada, con declaraciones incluidas; la instalación git/tarball no requiere `prepare`.
- Se añaden regresiones unitarias de orden/tiempo de plegado y reloj de steering, además de fixtures de navegador con componentes reales para el movimiento, 500 filas ocultas, estadísticas pegajosas/con salto de línea y reinicios del reloj de espera.

## 0.1.0

Primera publicación pública del plugin de vista de lectura aceptado, publicado como `dsh-tidy-display`.

- Contexto nativo y detalles de herramientas con razonamiento ordenado por la fuente y sin modificar.
- Tarjetas de razonamiento largo acotadas con seguimiento de dos líneas, seguimiento desplegado y pausa/reanudación manual.
- Plegado de proceso en turnos exitosos con respuesta final separada.
- Revelación de texto ordenada por la fuente y un discreto brillo de estado ocupado.
- Tipografía de estado estable y espaciado compacto de revelaciones.
- Alternativas de contenido nativas y un slot de extensión de bloques para plugins de confianza.
- 42 pruebas de regresión; sin cambios en el Agent de DSH, el SDK, los proveedores ni el núcleo.
