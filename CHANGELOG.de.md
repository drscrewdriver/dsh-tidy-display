# Änderungsprotokoll

## 0.2.4-beta.5 — 2026-10-05

- **Behebt den Komplettausfall auf 0.1.2/0.1.5**: Die Client-Kanarienprüfung in `officialChildren` erkannte nur den 0.1.7+-Vertrag `list/session` für `conversation.chat.turnTail`, während die Hosts 0.1.2–0.1.5 `chain/session` deklarieren — der Wurf tötete den gesamten Client-Entry, und das Web-Boot-Gateway verweigerte den kompletten Seitenaufbau. Jetzt generationenweiße Whitelist (tail akzeptiert list- und chain-spec) und Bindung an die Live-Spec des Hosts; die zweite Kanarie im Mirror-Inject warnt ebenfalls, statt zu werfen.

## Unveröffentlicht

- Das Paket wurde in das unscoped **`dsh-tidy-display`** umbenannt und neu veröffentlicht: `package.json`-Name, Modul-Id `src/dsh-tidy-display.ts`, tsdown-Bundle-Id und die Insert-Zeile in `cordis.patch.yml` ziehen alle zusammen um (die Invariante Modul-Id = Paketname bleibt bestehen, sie wurde nur auf den neuen Namen neu verankert). Die frühere scoped-Veröffentlichung `@drscrewdriver/dsh-tidy-display@0.1.0` bleibt auf npm, ist aber überholt — Installation über den nackten Namen (`dsh plugin --profile web add dsh-tidy-display`). dist-tags: `dsh-0.1.7` und `latest`, beide → 0.1.0.

- Die gegenseitige Ausschließung mit `dsh-better-display` / `@bananasoldier01/dsh-tidychat` dokumentiert (README-Installationsabschnitte): Alle drei registrieren eine `reader`-Ansicht (gleiche id, gleiche Priorität 0) im Listenslot `conversation.view`, und das Slot-Registry des Hosts weist das Duplikat bei der Aktivierung zurück — der Client meldet `1 entry did not activate: failed` und die Seite bleibt auf dem Plugin-Lade-Fehlerbildschirm hängen. Live auf einem Web-Profil diagnostiziert, auf dem better-display neben der tidy-display-npm-Installation weiterhin aktiv war; am Paket selbst ist nichts falsch. better-display / tidychat deaktivieren oder deinstallieren, bevor dieses Plugin aktiviert wird.

- `check-harness-compat`-Gate: `--path-separator=/` an ripgrep übergeben. ripgrep 15 unter Windows gibt Pfade mit Backslashes aus, sodass der Pfadfilter `/src/client/` jede Datei übersprang, den Scan der offiziellen Registrierungen stumm leerte und den Baseline-Vergleich mit einer Wand von Phantom-`removedRegistrations` scheitern ließ — ausgerechnet auf dem Checkout, gegen den die Baseline aufgenommen worden war.

- Alte-Rückport ausgeliefert: Drei compat-Branches bringen die Nachrichtenleisten-Teilmenge auf Hosts vor 0.1.7 — `compat/0.1.5` (0.1.5-alpha.1~0.1.6, Tag `v0.1.0-dsh0.1.5`), `compat/0.1.2` (0.1.2-alpha.2~0.1.4.x, Tag `v0.1.0-dsh0.1.2`), `compat/0.1.1` (0.1.0-rc.7~0.1.2-alpha.1, Tag `v0.1.0-dsh0.1.1`). Die Host-Kompatibilitätsmatrix oben verlinkt die Tags inzwischen.

- Modul-Id in der Quelle fixiert (Build-Korrektur des lokalen Forks): `src/dsh-tidy-display.ts` exportiert nun `name = '@drscrewdriver/dsh-tidy-display'` (Paketname und tsdown-Eintrag auf die scoped Id ausgerichtet). Der Upstream-Baum trägt das unscoped `dsh-tidy-display`; baut man ihn unverändert und deployt ihn unter dem scoped Profileintrag, kann der Host das Client-Bundle nicht mounten, und das gesamte Plugin aktiviert sich stumm nicht (kein 阅读-Tab, nur die native Ansicht) — derselbe Fehler, den fork.4 im veröffentlichten Artefakt behoben hatte, jetzt auf Quellenebene für Fork-Builds fixiert.
- Die Reader-Zeilen stellen den Anker-Vertrag des hosteigenen ChatView wieder her: user / steering / Assistant-Antwort / turn-error / unknown-Zeilen tragen nun `data-chat-anchor-key={node.key}` und `data-chat-flow-kind={node.kind}` neben den Reader-Attributen, wie `OfficialNode` es für Fallback-Knoten bereits tat. Ökosystem-Plugins, die die nativen Anker als DOM-Quelle der Wahrheit lesen (z. B. die Nachrichtenleiste von dsh-tidychat), fanden unter dem Reader keine Zeilen mehr und rendern stumm nichts; der native Vertrag ist über 0.1.0-rc.7 → 0.1.7-rc.2 stabil und wird unverändert durchgereicht.
- Das Reasoning-Transkript erhält die transluzente Platte der Antwortblase (dasselbe Token `--dsw-alias-bg-layer-1`, 16px Radius, Milchglas-Blur im Glasmodus) unter demselben Schalter 消息气泡 / Message bubbles, in jedem Zustand — der Basisstil der Karte war die opake module-platform-Schicht samt ihrem flachen Zustand ([data-overflow=false][data-expanded=false]), der die Platte komplett fallen ließ; beides legte das Transkript direkt auf die Skins-Hintergründe. Die Paddings des flachen Zustands werden auf der Platte über spezifischere Regeln wiederhergestellt; Blasen aus lässt das bisherige flache/opake Verhalten bestehen.
- Nachrichtenblasen: Jede finale Antwort erscheint in einer abgerundeten Blase, die sie vom Seitenhintergrund trennt, damit Text nicht mehr direkt auf den Hintergründen geskinnter Hosts liegt. Der Glasmodus mischt dieselben Tokens transluzent, analog zur Milchglas-Behandlung der Nutzerblase. Ein neuer Schalter 消息气泡 / Message bubbles in den Einstellungen stellt bei aus die flache Anordnung wieder her (persistiert als `bubbles` auf `dsh.reader.v1`, standardmäßig an).

## 0.3.3 — 2026-09-24

- Harness `0.1.7-rc.2` akzeptiert (`dsh-v0.1.7-rc.2`, `477b4f420553e8a52c2fbccc464d7561b239c443`). Peer-Range bleibt `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` bleibt ein List-Slot. Der neue Tail-Eintrag `schedule-created` und die Tool-Ansicht `schedule_update` sind zusätzliche offizielle Registrierungen, die über die bestehenden Sitze gespiegelt werden.
- Der Tool-Änderungskontext für Entwickler (`tool-addition` / `tool-removal`) nutzt den offiziellen Titel- und Zähltext statt einer generischen Injektionszeile.
- Lokale Markdown-Bilder akzeptieren die Desktop-Dateiroute `dsh-app://app/api/file`.

## 0.3.2 — 2026-09-24

- Den Laufzeitvertrag der offiziellen 0.1.7-rc.1-Brücke vervollständigt: Tool-Ansichten erhalten `phase`/`useDisclosure`/`hookContext{callId}`, Chat-Knoten nutzen den `{turnData, disclosureReset}`-Snapshot-Store; behebt, dass offizielle Tool-Ansichten im echten Host stumm in den Fallback fielen.
- Mal-Lücken bei den Sticky-Lanes des Einklappbereichs: Die Lane strich nur den eigenen Kasten voll; der 14px-Abstand von `.turn`, das 16px-Padding der vorigen Zelle und der `--reader-control-width`-Vorhalter rechts der Status-Lane ließen beim Scrollen Inhalt durchscheinen; gelöst durch gleichfarbigen `box-shadow`, der nach oben/rechts zu einem durchgehenden Band nachmalt.

## 0.3.1 — 2026-09-24

- Harness `0.1.7-rc.1` akzeptiert. Peer-Range ist `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` ist ein List-Slot. Die alte Ketten-Erwartung warf beim Client-Boot eine Exception und ließ die Seite auf „Failed to load plugins“ stehen.
- Icon-Imports nutzen die rc.1-Gewichtsnamen (`IconBrowseOutlineRegular` und die übrigen). Die Größe bleibt eine Prop.
- Die Pending-Bestätigung liest nun `useSessionStatus` (`pendingInteraction`). Der entfernte Hook `useSessionPendingInteraction` warf sofort, sobald der Reader paintete.
- Code- und Terminal-Labels enthalten die rc.1-Toolbar-Felder (`codeLabel`, wrap und `noExitCode`).

## 0.3.0 — 2026-09-21

- Behoben: Nach dem Ausschalten des Auto-Einklappens und dem Ansehen der Prozessdetails ließ sich nach dem Wiedereinschalten weiterhin nicht einklappen; das Wiedereinschalten stellt die Auto-Einklapp-Regeln wieder her, Textauswahl-Schutz und späteres manuelles Ausklappen bleiben erhalten.
- Die offiziellen Renders von Feedback, Tool-Details, expliziten Artefakt-Karten, Befehlen und unbekannten Knoten sind in das bestehende Lese-Layout integriert; der offizielle Renderer übernimmt Injektion, Übersetzung, Store und Sub-Slots.
- Der direkte Aufruf von Tool-Komponenten und die Logik des Ausklappens per simuliertem Klick sind entfernt; bestehende Zusammenfassungen, Einklappen, Animationen und Datei-Schnellaktionen bleiben.
- Der offizielle Datei-Link-Dienst ist angebunden, Tool-Dateizeilennummern werden durchgereicht, RC2-lokale Markdown-Bilder samt Lade-Fallback ergänzt.
- Behoben, dass das Scroll-Following vom Boden weggezogen wurde; die Positionen der Lese-Spalten-Lane und des Sticky-Bereichs sind vereinheitlicht.
- Code-Interpreter-Ergebnisse werden als Terminal-Ausgabe dargestellt, Kontextzeilen sind kompatibel zu `provenance` und `producer`.
- Wiedergabefähige Integrationstests der offiziellen Komponenten, Interaktions-Regressions des Auto-Einklappens und eine Harness-Upgrade-Kompatibilitätsprüfung sind ergänzt; Abhängigkeiten an Harness `0.1.5-rc.2` angeglichen.
- Designumfang, Schnittstellengrenzen und zu konvergierende Module: siehe `docs/official-rendering-bridge.md`.

## 0.2.1 — 2026-09-20

### Behoben

- Die fixierten Reader-Lanes strichen nicht mehr über den Composer. Die Live-Statuszeile (`执行过程` / `正在使用工具`) pinnte mit `z-index: 8` am oberen Scrollport-Rand, während der Sticky-Composer-Sitz des Hosts `z-index: 7` hält und nichts zwischen Reader und `<body>` einen Stacking-Kontext erzeugt. Ein scrollender Reader drückte jede Turn-Level-Sticky-Lane ins Footer-Band — die Lane stoppt am unteren Rand ihres Containing-Blocks, der hinter der Eingabekarte durchläuft — und der Reader strich so seine eigene opake Platte über den Composer.
  - Die Live-Status-Lane besitzt nun die gemessene Lane unter der Toolbar, genau wie die geschlossenen Summary-Zeilen, statt sich die Toolbar-Lane zu teilen.
  - Lanes, die ein Scroll ins Footer-Band drücken kann, bleiben unter dem Composer-Sitz (`z-index` 6); nur die obere Toolbar-Lane behält 7, was sie auch über den Codeblock-Bannern des Hosts hält.
  - Der Skin-Modus führt keine eigene zweite Lane-Leiter mehr mit.
  - `tests/footer-precedence.test.ts` sichert die Leiter im Quell-Sheet und im eingecheckten Bundle.

## 0.2.0 – 2026-09-30 (Anpassung an die Wirtslinie 0.2.0)

- 12 `@deepseek-ai/dsh-*`-Peers auf `>=0.2.0-rc.1 <0.2.1-0` gehoben; devDependencies auf 0.2.0-rc.2; `pnpm-lock.yaml` entfernt (npm ist der einzige Paketmanager, `package-lock.json` liegt im Repo).
- Gate-Basislinie erneuert: `compat/harness-020rc2.json` (Host 0.2.0-rc.2; 74 offizielle Registrierungen unverändert, 14 von 18 Ankerdateien byteidentisch).
- Review der Host-0.2.0-Drifts (scoped-slots useMemo / ui-tool contract rein ergänzend userQuestionPanels / MessageItem TextShimmer / TurnProcessNodeView ohne Live-Uhr): überall nur Caller-Semantik, **keine Quellcodeänderungen**.
- Fixture-Server: `/favicon.ico` mit 204 bedient und unbekannte Anfragen geloggt (erste Headless-Fixture-Baseline auf diesem Rechner).

## 0.2.0 — 2026-09-18

### Diff-Review und Tool-Präsentation

- Diff-Review-Panel neu gebaut: Statistiken für hinzugefügte/gelöschte Zeilen (`+A -R`) werden bündig an den rechten Rand geschoben, exakt auf derselben 32px-Baseline wie der Summary-Text ausgerichtet.
- Das Diff-Overlay klappt sauber innerhalb der Lesespalte auf (0px horizontaler Überlauf) mit unabhängigem vertikalem Scrollen (`max-height: 420px; overscroll-behavior: contain`), sodass Mausrad-Ereignisse nicht in den Konversationsstrom lecken.
- Multi-Datei-Tabs scrollen horizontal mit adaptiver Inhaltshöhe beim Dateiwechsel.
- Custom-Tool-Karten aus PR #12: Das Rendering der Tool-Ansicht wird an den Slot `tool.call.toolview` delegiert, mit Error-Boundary-Isolation und Auto-Ausklappen.

### Transluzentes Milchglas und Skin-Modus

- Der transluzente Milchglasmodus ist ein Opt-in-Schalter in den Einstellungen.
- Ist er an, werden alle Kartenhintergründe, Tool-Detailrahmen und Codeblöcke transluzent mit Backdrop-Blur, sodass opake weiße Flecken entfallen und sich Drittanbieter-Wallpaper und Fenster-Skins nahtlos anfügen.

### Verfeinertes Einklappen und Lebendigkeit

- Zurück zu einem einzigen, intuitiven Auto-Einklapp-Schalter (**自动折叠开 / 关**) in der Lese-Toolbar und in den Einstellungen; die komplexen Mehrebenen-Regeln entfallen, während Reasoning und Tools bei ausgeschaltetem Zustand vollständig ausgeklappt bleiben.
- Zeilenumbruch-Bug behoben, damit Summary-Zeilen bei ausreichendem Platz strikt einzeilig bleiben.
- Echtzeit-Warteuhren (`WaitClock`), Ausführungszeit-Tracking und Token-Durchsatz-Metriken (`TurnMetrics`) vollständig erhalten und aktiv.
- Animierte Aufklappvorgänge enthalten Fallback-Timeouts, um Render-Stillstände zu verhindern.

### Tidy-Display-Einstellungen

- Glas, Auto-Einklappen und Artefakt-Öffnungsmodus teilen sich den Root-Store `dsh.reader.v1`, sodass Einstellungen und Leseansicht über Refreshes hinweg synchron bleiben.
- Artefakt-Öffnungsmodus: Standard System-App, optional Sidebar. Ordner/Reveal bleiben beim OS.
- Installations-Erkennung und Statusmeldung für das generative-mcpapps-Skill-Paket.

### Kompatibilität und Lebendigkeit

- Eine Warte startet nun neu, wenn ein Tool zurückkehrt. Das Übergabeset nannte Kinds aus dem Konversationsvertrag (`tool-result`), während der Reader gegen die Kinds der Chat-Schicht prüft, wo ein zurückgekehrtes Tool die `tool-call`-Zeile ist, deren `data.root` ein Ergebnis trägt. Kein Knoten trug je den alten Namen, der Branch war tot, und ein zurückgekehrtes Tool startete die Uhr nie neu. Das Set und jedes Kind, über das es nachdenkt, sind nun gegen die eigene Kind-Union des Hosts typisiert, sodass ein falscher Name an `tsc` scheitert statt stumm zur Laufzeit, und ein noch laufendes Tool ausdrücklich keine Warte ist.
- Die Einklapp-Choreografie kann sich nicht mehr festfahren. Jede Phase schreitet an Animations-Promises und gerenderten Frames voran, und eine abgebrochene Animation rejected, während ein versteckter Tab keine Frames liefert — beides ließ die Maschine für immer in einer Nicht-Idle-Phase zurück, was die Frame-Quelle auf den gezeigten Snapshot hielt und die Text-Enthüllung pausierte, sodass der Turn steckend wirkte, bis die View remountete. Jede Phase hat nun zusätzlich eine Wanduhr-Frist, die die nächste Phase erzwingt.
- Solange die Choreografie die Enthüllung hält, saugt der Stream-Puffer die Quelle weiter auf statt früh zurückzukehren, damit der Text nach dem Setzen des Folds nie von einem veralteten Ziel fortsetzt.
- Der Status zeigt, wie viele Sub-Agenten der Turn gestartet hat, gelesen aus der turn-process-Zeile des Hosts statt hier erneut gezählt.
- Den `command-input`-Render-Branch gestrichen: Dieser String ist in keinem veröffentlichten Host ein Chat-Knoten-Kind, er ließ die Datei nur so wirken, als behandle sie einen Fall, der nicht auftreten kann.
- Auch jeder animierte Aufklapper erhält eine Wanduhr-Frist. `fill: 'both'` pinnt das öffnende Keyframe, sodass eine Web Animation, die nie `onfinish` erreicht (abgebrochen, unmountet oder vom Compositor übersprungen), die Zeile mit null Höhe und null Deckkraft im DOM ließ — ein Klick wirkte wie nichts.
- Ein Tidy-Display-Einstellungsbereich kommt hinzu: Artefakte öffnen standardmäßig weiterhin in der System-App, mit optionaler Vorschau in der rechten Sidebar, plus generative-mcpapps-Skill-Root-Erkennung und Installationshinweisen.
- Echo von Bildern aus Pending-Submissions abgesichert, damit ein reiner Text-Send nicht `conversation.view` zum Absturz bringen kann (`images` / `attachments` können fehlen).
- Die Installationshinweise nennen nur konventionelle relative Roots (`.dsh/skills`, `.agents/skills`) und drucken nie Host-Home oder absolute Plugin-Pack-Pfade.

### Lesen und Einklappen

- Ein späterer Reasoning-Schritt klappt nur den abgeschlossenen Prozesslauf ein, dem er folgt. Der noch streamende Lauf bleibt vollständig ausgeklappt, sodass ein langer Turn als Wechselspiel aus Digests und Prosa liest statt mitten im Gedanken zu kollabieren.
- Fold-Intensität 2 (`过程摘要`) ist der reine-Prozess-Modus aus PR #14: Prosa wird nie eingeklappt; jeder abgeschlossene Lauf aus Reasoning-/Tool-/Record-Schritten kollabiert in einen Digest, der benennt, was die Tools tatsächlich getan haben (`读取 Reader.tsx`, `运行 pnpm test`), gelesen aus derselben Tool-Identität, die auch die Tool-Karten nutzen. Er ist nicht der Standard — der Standard-Fold (Stufe 1) behält die Choreografie des aktuellen Main.
- Ein abgeschlossener reiner-Prozess-Turn klappt auch seinen Schlussslauf ein und überspringt die doppelt gewordene Zählerzeile des geschlossenen Turns, die er nicht mehr braucht.

### Leseoberfläche

- Bei eingeschaltetem Milchglas nutzen Sticky-Lanes dasselbe Liquid Glass wie der dsh-auto-memory-Bereich: transluzente `bg-layer-2`-Tönung, `blur(28px)`, Haarlinien-Rahmen, 16px Radius und sanfte Anhebung. Detail-Chips bleiben transparent, bis sie gehovert oder fokussiert werden. Ausgeschaltet entspricht das Chrome dem aktuellen Main.
- Die Toolbar reserviert die Breite ihrer gesamten Steuergruppe. Nur den ersten Button zu messen ließ die Status-Lane über alle späteren Steuerelemente malen.
- Ein Komprimierungs-Trenner kommt jetzt an statt einfach zu erscheinen: Die Regel fährt aus ihrer Mitte auseinander, die Pille setzt sich, das Zifferblatt dreht sich einmal. Gated durch `data-motion=off` und `prefers-reduced-motion` wie jede andere Transition.

### Diff-Review

- Die Zählwerte geänderter Zeilen aus dem Tool-Ergebnis lesen, das der Host bereits beilegt (`meta.diffs`, `{ path, oldText, newText }`), mit Fallback auf die eigenen Argumente des Calls für `write` / `edit` / `str_replace_editor`, wenn ein Host-Build sie nicht sendet. Die Namens-Whitelist ist wichtig: Mehrere unrelated Tools nehmen ein Feld namens `content`, und deren erfundene Hinzufügungen zu zählen hätte Calls, die keine Datei änderten, Zählwerte angedichtet.
- Die Kind-Calls eines Parent-Calls in dessen eigene Zählwerte einrollen. Ein `run_code`, der Dateien schreibt, berichtet, was seine Kinder geändert haben, statt was seine eigenen Argumente enthalten, sodass ein Run, dessen Edits eine Ebene tiefer liegen, seine Zählwerte nicht mehr verliert. Jedes Kind trägt über seine eigenen Argumente bei, gelesen aus dem gelandeten Ergebnis oder dem Pending-Call.
- `+N -M` sitzt am Zeilenende in Grün/Rot und öffnet ein Panel mit je einem Eintrag pro geänderter Datei — die Datei-Tabs, die gelöschten Zeilen auf rotem und die hinzugefügten auf grünem Untergrund, mit derselben `DiffBlock`-Primitiven, die auch die offizielle Tool-Zeile rendert. Das Panel ist im Fluss, nie ein schwebendes Popup, sodass das `overflow: clip` der Flusszelle es nicht abschneiden kann.
- Öffnen und Schließen des Panels animieren echte Höhe in der eigenen Motion-Sprache des Plugins, und die Karte wird zurück in den Sichtbereich geholt, wenn sie unterhalb des Folds aufklappt; ein offenes Panel hält sein Caret leuchtend.

### Warten und Zeitmessung

- Anzeigen, wie lange das Modell den Turn schon hat, neben 「深度求索中」und dem In-Flow-Warteindikator. Die Uhr ist am letzten Ereignis verankert, das dem Modell die Kontrolle übergeben hat — ein zurückgekehrtes Tool, ein injizierter Kontext, ein Run-Befehl, die eigene Nachricht des Nutzers — nie am Turn-Anfang, damit eine gerade begonnene Warte nicht die Minuten erbt, die die Tools bereits verbraucht haben.
- Nach zehn Sekunden ergänzt die Anzeige ein 「暂未响应」-Badge, und sobald das Modell seinen ersten Block produziert, wird der ganze Indikator zurückgezogen. Ein noch laufendes Tool ist keine Warte: Das Tool ist es, das arbeitet.
- Ein lange gelaufener Befehl behält seine Dauer nach der Rückkehr (Warnfarbe nach zehn Sekunden); ein schneller zeigt nach Abschluss nichts. Laufende Schritte zeigen eine Live-Sekundenanzeige und ein schimmerndes Summary während der Arbeit.

### Scrollen

- Tail-Following löst nur bei einer echten Aufwärtsbewegung des Readers. Inhaltswachstum und die Follow-Easing selbst bewegen ebenfalls `scrollTop`, und das als „der Nutzer hat den Boden verlassen“ zu lesen fror das Following mitten im Turn ein.
- Das Scroll-Anchoring des Browsers auf dem Konversations-Scroller deaktiviert, solange der Reader gemountet ist: Es verschob den Viewport von sich aus, während das Transkript wuchs.
- Nur ein fokussiertes Textfeld setzt das Following aus, und nur innerhalb des Readers. Das Fokussieren des Composers hielt das Transkript früher an.
- Streamen mit der Eigenrate der Quelle: ein Feed-Forward-Term, geschätzt aus der Ankunftsrate, kommt oben auf den proportionalen Regler. Eine rein proportionale Enthüllung pendelte sich bei konstantem `catchUpMs`-Rückstand ein, egal wie schnell das Modell, was sich wie 「慢」 las, während der Rückstau mit schnelleren Modellen wuchs; der Feed-Forward-Term entwässert den Rückstau, und der proportionale Term absorbiert das Transport-Jitter.
- Einen Batch von Wörtern auf einer Uhr enthüllen statt ein Wort pro festem Intervall. Die Wortabstände pinnten die Rate nahe 16 Wörter/Sekunde, sodass auch ein schnelles Modell wortweise ankam; ein Batch landet nun in einem kurzen Fenster, während ein einzelnes neues Wort die ursprüngliche Tippkadenz behält.
- Das eigene Following des Reasoning-Bereichs schreitet mit dem Rückstau statt im festen Schritt-und-Halte-Rhythmus: Es rückte früher alle ~1,3 Sekunden zwei Zeilen vor, egal wie schnell der Text ankam — genau das ließ den Bereich hinter einem schnellen Modell zurückzubleiben wirken.
### Host-DOM-Hooks

- Den `data-chat-flow=""`-Hook des ChatView an der Reader-Spalte behalten, damit Skins, die `[data-composer-seat]` verstecken, wenn der Scrollport keinen Chat-Flow hat (maid-atelier, phoebe-atelier und andere), den Composer auch in der Leseansicht zeigen.

## 0.1.1 — 2026-09-16

Die akzeptierte Leseansicht-Integration, einschließlich der aus PRs #2, #5 und #8 konsolidierten Arbeit. Frühere `0.2.0`/`0.2.1`-Überschriften waren unveröffentlichte Entwicklungsnotizen; diese Änderungen kommen mit diesem Release, nicht als eigene veröffentlichte Versionen.

### Lesen und Einklappen

- Ein späterer Reasoning-Schritt kann frühere Schritte seiner Kette in eine kompakte Zähl-Zusammenfassung einklappen. Alleinige Body-/Tool-Updates lösen kein Einklappen aus; user-/steering-Eingaben setzen die Kette zurück. Die Auto-Fold-Steuerung kann diese Präsentation deaktivieren.
- Stabile keyed Rows schrumpfen, bevor Zähler aktualisiert werden, pausieren kurz und enthüllen dann die gepufferte Ausgabe. Quellreihenfolge, ausgewählter Text, Reduced-Motion-Verhalten und die sichtbare finale Antwort bleiben erhalten.
- Prozessstatistiken überdauern den Turn-Abschluss. Leere versteckte Schritte häufen in langen abgeschlossenen Turns keine 16px-Lücken mehr an.
- Die Auto-Fold-Steuerung erhält eine voll breite, nahtlose Lane ohne Trennlinien oder Ersatzschatten. Statistiken bleiben im normalen Fluss, bis sie oben ankommen, und kleben dann unter der gemessenen Status-Lane, ausgeklappt oder eingeklappt.
- Kurze Status-Labels bleiben lesbar statt abgeschnitten zu werden. Die Wartezeit resettet auf die neueste user-/steering-Einreichung statt die ursprüngliche Startzeit des Turns zu erben.

### Navigation und native Parität

- Das neuere TimelineRail bleibt, inklusive inkrementellem Verlaufsladen, Metriken pro Turn, Fork-Unterstützung und Composer-sicherer Landung. Gescrollt wird der Konversationscontainer statt beliebiger Vorfahren-Boxen.
- Host-synthetische `turn-process`-JSON-Karten werden übersprungen; `/goal`-Befehlseingabe wird als beschrifteter Text gerendert; Systemprompt-Details bekommen ihren eigenen Scrollport.
- Das kompakte Zurück-nach-unten-Chevron am nativen Nahe-unten-Schwellwert wird genutzt und Scroll-Anker-Erfassung zusammengefasst.
- Zeit/Kopieren-Kontrollen der Nutzernachricht und Turn-Ende-Dauer werden gezeigt; produzierte Dateizeilen warten, bis der Turn geschlossen ist.

### Interaktive Inhalte

- Generative MCP Apps aus unterstützten Code-Fences, Custom-Blocks und Tool-Ergebnissen werden über einen isolierten Iframe gerendert (`sandbox="allow-scripts allow-forms"`, ohne `allow-same-origin`).
- SEP-1865-JSON-RPC-Initialisierung, Größenbestimmung, Kontext-Updates und Prompt-Feedback in den Composer, mit Hell-/Dunkel-Synchronisation und begrenzter Auto-Höhe.
- Das generative-mcpapps-Skill-Paket, Beispiele und zweisprachige Dokumentation sind enthalten.

### Distribution und Verifikation

- Ziel ist DeepSeek Harness 0.1.5-rc.2 über die öffentlichen Plugin-/Client-Erweiterungspunkte. Keine Änderungen an Agent, SDK, Provider, Credentials oder Harness-Core.
- Der Stock-Install-Bundle-Patch und die neu gebaute, eingecheckte `lib/` werden ausgeliefert, Deklarationen inklusive; git-/Tarball-Installation braucht kein `prepare`.
- Unit-Regressions für Fold-Reihenfolge/-Timing und Steering-Uhr kommen hinzu, plus Browser-Fixtures mit echten Komponenten für Motion, 500 versteckte Zeilen, sticky/umgebrochene Statistiken und Warteuhren-Resets.

## 0.1.0

Erste öffentliche Veröffentlichung des akzeptierten Leseansicht-Plugins, veröffentlicht als `dsh-tidy-display`.

- Nativer Kontext und Tool-Details mit quellsortiertem, unverändertem Reasoning.
- Begrenzte Long-Reasoning-Karten mit zweizeiligem Folgen, ausgeklapptem Folgen und manueller Pause/Fortsetzung.
- Prozess-Einklappen erfolgreicher Turns mit separater finaler Antwort.
- Quellsortierte Text-Enthüllung und unaufdringliches Busy-State-Shimmer.
- Stabile Status-Typografie und kompakte Disclosure-Abstände.
- Native Inhalts-Fallbacks und ein Trusted-Plugin-Block-Erweiterungsslot.
- 42 Regressionstests; keine Änderungen an DSH-Agent, SDK, Providern oder Core.
