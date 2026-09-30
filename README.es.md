# dsh-tidy-display

[简体中文](README.md) | [English](README.en.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Русский](README.ru.md) | [Español](README.es.md)

**Tidy Display** — un plugin comunitario para DeepSeek Harness (DSH) **0.1.7** que fusiona la vista de lectura y el raíl de mensajes en un solo plugin: las sesiones largas se vuelven fáciles de ojear, navegables y reanudables.

> Este proyecto nace de la fusión de dos plugins de DSH muy populares:
> [dsh-better-display](https://github.com/aa2246740/dsh-better-display) (vista de lectura, mantenido mediante un fork) ×
> [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat) (raíl de mensajes / carga inteligente del historial).
> La fusión elimina el conflicto de contrato DOM entre ambos; crédito y agradecimiento a los dos.

## Procedencia y agradecimientos (declarados tal cual)

**La vista de lectura en vivo** procede de [dsh-better-display](https://github.com/aa2246740/dsh-better-display): el render en streaming del upstream aa2246740, la coreografía de plegado del proceso y el puente oficial, mejorados por el fork de drscrewdriver. Este proyecto no reescribió su pipeline de render ni el de animaciones.

**El raíl de mensajes** procede de [dsh-tidychat](https://github.com/BananaSoldier01/dsh-tidychat): el raíl sobre canvas, el hover de ojo de pez, la cadena de colores y la carga inteligente del historial son porteos, mejorados por la línea compat de drscrewdriver (destello blanco, paridad con el steering, el DOM como única fuente de verdad).

### Carencias del better-display original, corregidas por este proyecto / el fork

1. **Sin placa detrás de los mensajes ni del razonamiento** — las respuestas finales y el texto de razonamiento se colocan directamente sobre el fondo de la página; la legibilidad sufre con skins, fondos de pantalla y temas oscuros. → El fork añadió a las respuestas la placa translúcida oficial `--dsw-alias-bg-layer-1`, y a la tarjeta de razonamiento el mismo fondo (commits `fa3a795`, `94d59c7`).
2. **La vista de lectura pierde los anclajes por fila del host** — `data-chat-anchor-key` / `data-chat-flow-kind` no se emiten con las filas de mensajes, así que los plugins de terceros que dependen de ese contrato como fuente de verdad del DOM (p. ej., el raíl de tidychat) resuelven cero filas y **fallan en silencio** en la vista de lectura. → El arreglo se envió al upstream como [aa2246740/dsh-better-display#41](https://github.com/aa2246740/dsh-better-display/pull/41); el proyecto fusionado incluye el mismo arreglo.
3. Su TimelineRail es un único raíl con el esquema oficial — sin resúmenes de ojo de pez, sin salto por clic, sin colores.

### Carencias del dsh-tidychat original, y el motivo de la fusión

1. El plegado / los separadores son cirugía DOM que se solapa con el plegado nativo del host (0.1.2+), obligando al usuario a elegir manualmente entre uno u otro.
2. Las versiones v0.2.10 y anteriores leían mal la instantánea en hosts DSH 0.1.2 — el raíl resolvía cero turnos y **nunca llegó a renderizarse realmente** (corregido en v0.3.0; véase `docs/RAIL-ROOT-CAUSE-ANALYSIS.md` en su repositorio).
3. Entraba en conflicto **en ambos sentidos** con la vista de lectura de better-display: la cirugía de tidychat no alcanzaba las filas de la vista de lectura, y los anclajes perdidos por la vista de lectura a su vez inutilizaban el raíl — la motivación directa de esta fusión.

Gracias a los dos upstreams y a sus autores (aa2246740, BananaSoldier01) — este proyecto está a hombros de ellos. Las mejoras del upstream que no entren en conflicto se irán incorporando cuando toque.

## Compatibilidad con el host

| Host DSH | Vista de lectura | Raíl de mensajes | Ajustes |
|---|---|---|---|
| 0.1.7-rc.1+ (esta línea) | ✅ | ✅ (ambas vistas) | 起子插件设置 → 整洁显示 |
| 0.1.5-alpha.1 ~ 0.1.6 (incl. 0.1.5) | ❌ | ✅ (línea `compat/0.1.5`, tag `v0.1.0-dsh0.1.5`) | tarjeta de configuración del plugin |
| 0.1.2-alpha.2 ~ 0.1.4.x | ❌ | ✅ (línea `compat/0.1.2`, tag `v0.1.0-dsh0.1.2`) | tarjeta de configuración del plugin |
| 0.1.0-rc.7 ~ 0.1.2-alpha.1 (incl. 0.1.1) | ❌ | ✅ (línea `compat/0.1.1`, tag `v0.1.0-dsh0.1.1`) | tarjeta de configuración del plugin |

- La vista de lectura está ligada al contrato de slot de 0.1.7 (el propio host tuvo cambios incompatibles entre 0.1.7-rc.1 y rc.2); no se retroportará a hosts antiguos.
- El backport a hosts antiguos **ya está hecho**: el subconjunto del raíl (raíl + destello + colores + carga inteligente) se publica en tres ramas compat, instalación en una línea tipo `dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display#v0.1.0-dsh0.1.5`; tras publicar en npm se añaden los dist-tags `dsh-0.1.5` / `dsh-0.1.2` / `dsh-0.1.1`. La toma de control del raíl oficial de la línea 0.1.5 queda pendiente de verificación práctica; 0.1.3 / 0.1.4 van en teoría por la línea `compat/0.1.2`, sin probar.
- 0.1.0-rc.6 y anteriores quedan fuera del soporte (use dsh-tidychat 0.1.0).
- Matriz a fecha de 2026-09-28 (línea tidy-display v0.1.0 / better-display 0.3.3-fork.5 / tidychat 0.3.4).

## Funcionalidades

### Vista de lectura (de better-display)
- Los pasos de ejecución se recogen en resúmenes desplegables; las respuestas finales se presentan como **burbujas de mensaje** (placa translúcida + cristal esmerilado opcional que deja ver los fondos de las skins)
- La tarjeta de razonamiento comparte la misma placa translúcida; el razonamiento en streaming puede seguir el desplazamiento, pausarse y desplegarse por completo
- Puente oficial: vistas de herramientas, feedback, tarjetas de entregables, turnTail y demás se renderizan por los slots oficiales
- Los bloques `` ```mcp-app `` se montan como tarjetas interactivas aisladas (`<iframe sandbox="allow-scripts allow-forms">`); paquete de skills en [`skills/generative-mcpapps/`](skills/generative-mcpapps/)
- Fila de entregables, reloj de espera, eco de pendientes; la «Conversación / Trayectoria» original, el cuadro de entrada, el selector de modelo, las herramientas y las aprobaciones siguen ahí

### Raíl de mensajes (de dsh-tidychat)
- Raíl de navegación sobre canvas en el borde de la conversación: hover de ojo de pez con tarjetas de resumen, salto por clic, resaltado del turno actual al desplazarse
- Estilos **líneas / puntos**, posición **borde izquierdo / derecho (en espejo)**
- **Anillo de destello blanco**: un destello suave bajo la marca del turno actual y del turno bajo el cursor los mantiene legibles sobre fondos recargados
- **Colores**: el color de marca y el color de acento ofrecen cada uno Automático (sigue el tema, con corrección automática si falta contraste) / Personalizado (selector de color + texto HEX/RGB + deslizador de opacidad)
- **Toma el control del raíl de mensajes oficial**: oculta el TurnNavigator oficial del borde derecho (oculto, no desmontado) y deja solo este raíl
- Funciona en **ambas** vistas: la vista «Conversación» nativa y la vista de lectura

### Ajustes
Todos los ajustes están en **Ajustes → 起子插件设置 → 整洁显示 (Tidy Display)**: raíl de mensajes (interruptor / posición / estilo / destello / toma de control / colores) + burbujas de mensaje / cristal esmerilado translúcido / plegado automático / modo de apertura de entregables. La configuración se persiste en `dsh.reader.v1`.

## Instalación

> ⚠️ **Excluyente mutuamente con `dsh-better-display` y `@bananasoldier01/dsh-tidychat`**: los tres registran una vista `reader` (mismo id, misma prioridad) en el slot de lista `conversation.view`. Activarlos a la vez hace fallar la activación por registro duplicado (el cliente informa `entry did not activate` y la página se queda atascada en la pantalla de fallo de carga de plugins). Desinstale o desactive aquellos antes de activar este plugin.

### App de escritorio DSH Studio (recomendada)

Abra **Ajustes → Plugins → Añadir plugin** e introduzca el nombre del paquete:

```text
dsh-tidy-display
```

### Web CLI

Publicado en npm — instale por el nombre simple:

```sh
dsh plugin --profile web add dsh-tidy-display
```

La dirección de GitHub también funciona (las líneas compat de hosts antiguos se instalan por tag; ver la matriz de arriba):

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-tidy-display
```

Directorio local / tarball (desarrollo / prueba local):

```sh
dsh plugin --profile web add ./dsh-tidy-display
dsh plugin --profile web add ./dsh-tidy-display-0.1.0.tgz
```

`dsh.bundle` se captura en el arranque: **no** escriba a mano la misma fila de insert en el `cordis.patch.yml` del perfil (montaje doble); para quitar una copia ya instalada use `dsh plugin --profile web remove dsh-tidy-display`. Para un Web Host ya en ejecución, vuelva a abrir el Host una vez y recargue la página.

## Desarrollo

```sh
pnpm install
npm run typecheck
npm run build      # genera lib/ (se sube al repo; la compuerta check-harness-compat necesita un checkout del Harness)
npm test
```

Apunta a DeepSeek Harness **0.1.7-rc.1+** (peer `>=0.1.7-rc.1 <0.1.8`). Solo presentación — no cambia la ejecución del Agent, el SDK ni las credenciales de los modelos. Node.js `^22.19.0 || >=24`. Las sesiones nuevas entran por defecto en lectura.

## Relación con los proyectos originales

Véase «[Procedencia y agradecimientos](#procedencia-y-agradecimientos-declarados-tal-cual)» al principio — las mejoras del upstream que no entren en conflicto se irán incorporando cuando toque.

## Licencia

Las partes de presentación y Markdown proceden de DeepSeek Harness (MIT). Las animaciones toman como referencia [Transitions.dev](https://transitions.dev/). El código de este repositorio es [MIT](LICENSE).
