# Registro delle modifiche

## Da rilasciare

- Il pacchetto è stato rinominato nel **`dsh-tidy-display`** senza scope e ripubblicato: nome in `package.json`, id del modulo `src/dsh-tidy-display.ts`, id del bundle tsdown e riga di insert di `cordis.patch.yml` si muovono tutti insieme (l'invariante id-modulo-=-nome-pacchetto resta, è solo riagganciata al nuovo nome). La pubblicazione con scope precedente `@drscrewdriver/dsh-tidy-display@0.1.0` resta su npm ma è superata — installare con il nome semplice (`dsh plugin --profile web add dsh-tidy-display`). dist-tag: `dsh-0.1.7` e `latest`, entrambi → 0.1.0.

- Documentata l'esclusione reciproca con `dsh-better-display` / `@bananasoldier01/dsh-tidychat` (sezioni di installazione del README): tutti e tre registrano una vista `reader` (stesso id, stessa priorità 0) nello slot a lista `conversation.view`, e il registro degli slot dell'host rifiuta il duplicato all'attivazione — il client riporta `1 entry did not activate: failed` e la pagina resta bloccata sulla schermata di errore di caricamento dei plugin. Diagnosticato dal vivo su un profilo web in cui better-display era ancora attivo accanto all'installazione npm di tidy-display; il pacchetto in sé non ha alcun difetto. Disabilitare o disinstallare better-display / tidychat prima di attivare questo plugin.

- Gate `check-harness-compat`: passare `--path-separator=/` a ripgrep. ripgrep 15 su Windows stampa percorsi con backslash, quindi il filtro di percorso `/src/client/` saltava ogni file, svuotava in silenzio la scansione delle registrazioni ufficiali e mandava in errore il confronto con la baseline con una muraglia di `removedRegistrations` fantasma — proprio sul checkout rispetto al quale la baseline era stata registrata.

- Backport storico pubblicato: tre branch compat portano il sottoinsieme della barra dei messaggi agli host precedenti alla 0.1.7 — `compat/0.1.5` (0.1.5-alpha.1~0.1.6, tag `v0.1.0-dsh0.1.5`), `compat/0.1.2` (0.1.2-alpha.2~0.1.4.x, tag `v0.1.0-dsh0.1.2`), `compat/0.1.1` (0.1.0-rc.7~0.1.2-alpha.1, tag `v0.1.0-dsh0.1.1`). La matrice di compatibilità host sopra ora collega i tag.

- Id del modulo bloccato nel sorgente (correzione di build locale del fork): `src/dsh-tidy-display.ts` ora esporta `name = '@drscrewdriver/dsh-tidy-display'` (nome del pacchetto ed entry tsdown allineati all'id con scope). L'albero upstream porta il `dsh-tidy-display` senza scope; costruirlo senza modifiche e distribuirlo sotto l'entry di profilo con scope impedisce all'host di montare il bundle client e l'intero plugin fallisce ad attivarsi in silenzio (nessuna scheda 阅读, solo la vista nativa) — lo stesso guasto che fork.4 aveva corretto nell'artefatto pubblicato, ora bloccato a livello di sorgente per le build del fork.
- Le righe del reader ripristinano il contratto di ancore del ChatView dell'host: le righe user / steering / risposta dell'assistente / errore di turno / sconosciuta ora portano `data-chat-anchor-key={node.key}` e `data-chat-flow-kind={node.kind}` accanto agli attributi del reader, come già faceva `OfficialNode` per i nodi di fallback. I plugin dell'ecosistema che leggevano le ancore native come fonte di verità DOM (es. la barra dei messaggi di dsh-tidychat) smettevano di trovare righe sotto il reader e non renderizzavano nulla, in silenzio; il contratto nativo è stabile da 0.1.0-rc.7 a 0.1.7-rc.2 e viene trasmesso identico.
- La trascrizione del ragionamento riceve la piastra traslucida della bolla di risposta (stesso token `--dsw-alias-bg-layer-1`, raggio 16px, blur satinato in modalità vetro) sotto lo stesso interruttore 消息气泡 / Message bubbles, in ogni stato — lo stile base della scheda era il layer opaco module-platform e il suo stato piatto ([data-overflow=false][data-expanded=false]) eliminava del tutto la piastra, entrambe cose che appiccicavano la trascrizione direttamente sugli sfondi delle skin. I padding dello stato piatto sono ripristinati sulla piastra tramite regole a specificità più alta; bolle disattivate conserva il precedente comportamento piatto/opaco.
- Bolle di messaggio: ogni risposta finale viene resa in una bolla arrotondata che la separa dallo sfondo della pagina, così il testo non poggia più direttamente sugli sfondi degli host con skin. La modalità vetro mescola gli stessi token in forma traslucida, rispecchiando il trattamento satinato della bolla utente. Un nuovo interruttore 消息气泡 / Message bubbles nelle impostazioni ripristina il layout piatto quando disattivato (persistito come `bubbles` su `dsh.reader.v1`, attivo per impostazione predefinita).

## 0.3.3 — 2026-09-24

- Accettato Harness `0.1.7-rc.2` (`dsh-v0.1.7-rc.2`, `477b4f420553e8a52c2fbccc464d7561b239c443`). L'intervallo peer resta `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` resta uno slot a lista. La nuova voce di coda `schedule-created` e la vista tool `schedule_update` sono registrazioni ufficiali aggiuntive, replicate attraverso i posti esistenti.
- Il contesto di cambiamento tool per gli sviluppatori (`tool-addition` / `tool-removal`) usa il titolo e il conteggio ufficiali invece di una riga di iniezione generica.
- Le immagini Markdown locali accettano la route file del Desktop `dsh-app://app/api/file`.

## 0.3.2 — 2026-09-24

- Completato il contratto a runtime del ponte ufficiale 0.1.7-rc.1: le viste tool ricevono `phase`/`useDisclosure`/`hookContext{callId}` e i nodi chat passano allo store snapshot `{turnData, disclosureReset}`; risolve il fatto che le viste tool ufficiali cadevano in silenzio sul fallback nell'host reale.
- Fessure di disegno delle corsie sticky dell'area ripiegata: la corsia dipingeva il fondo pieno solo sulla propria scatola; il gap di 14px di `.turn`, il padding di 16px della cella precedente e la fascia riservata `--reader-control-width` a destra della corsia di stato lasciavano trasparire il contenuto durante lo scorrimento; sostituite con un `box-shadow` dello stesso colore che dipinge verso l'alto/a destra formando una banda continua.

## 0.3.1 — 2026-09-24

- Accettato Harness `0.1.7-rc.1`. L'intervallo peer è `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` è uno slot a lista. La vecchia attesa di catena lanciava un'eccezione al boot del client lasciando la pagina su “Failed to load plugins”.
- Gli import delle icone usano i nomi di peso rc.1 (`IconBrowseOutlineRegular` e gli altri). La dimensione resta una prop.
- La conferma pending ora legge `useSessionStatus` (`pendingInteraction`). L'hook rimosso `useSessionPendingInteraction` lanciava non appena il reader disegnava.
- Le etichette codice e terminale includono i campi toolbar rc.1 (`codeLabel`, wrap e `noExitCode`).

## 0.3.0 — 2026-09-21

- Corretto il problema per cui, disattivando il ripiegamento automatico e consultando i dettagli di processo, alla riattivazione non si poteva comunque ripiegare; la riattivazione ripristina le regole di ripiegamento automatico, conservando la protezione della selezione del testo e la successiva espansione manuale.
- Integrati nel layout di lettura esistente i rendering ufficiali di feedback, dettagli tool, schede esplicite di deliverable, comandi e nodi sconosciuti; il renderer ufficiale gestisce iniezione, traduzione, store e sub-slot.
- Rimossa la chiamata diretta ai componenti tool e la logica di espansione tramite click simulato, conservando i riassunti, i ripiegamenti, le animazioni e le azioni rapide sui file esistenti.
- Integrato il servizio ufficiale di link ai file, passati i numeri di riga dei file dei tool, completate le immagini Markdown locali RC2 e il degrado in caso di errore di caricamento.
- Corretto il trascinamento dal fondo nel follow dello scorrimento, unificate le posizioni della corsia della colonna di lettura e dell'area sticky.
- I risultati dell'interprete di codice sono mostrati come output di terminale, con righe di contesto compatibili con `provenance` e `producer`.
- Aggiunti test di integrazione riproducibili dei componenti ufficiali, regressioni d'interazione del ripiegamento automatico e un controllo di compatibilità agli upgrade di Harness; dipendenze allineate a Harness `0.1.5-rc.2`.
- Perimetro di design, confini delle interfacce e moduli da convergere: vedere `docs/official-rendering-bridge.md`.

## 0.2.1 — 2026-09-20

### Corretto

- Le corsie fissate del reader non dipingevano più sopra il composer. La riga di stato live (`执行过程` / `正在使用工具`) fissata in cima allo scrollport con `z-index: 8`, mentre il seggiolino sticky del composer dell'host possiede `z-index: 7` e nulla tra il reader e `<body>` crea uno stacking context. Un reader in scorrimento comprimeva ogni corsia sticky a livello di turno nella banda del footer — la corsia si ferma al fondo del suo blocco contenitore, che passa dietro la scheda di input — così il reader dipingeva la sua piastra opaca sopra il composer.
  - La corsia di stato live possiede ora la corsia misurata sotto la toolbar, esattamente come le righe di riepilogo chiuse, invece di condividere quella della toolbar.
  - Le corsie che uno scorrimento può comprimere nella banda del footer restano sotto il seggiolino del composer (`z-index` 6); solo la corsia della toolbar in alto conserva 7, cosa che la tiene anche sopra i banner dei blocchi codice dell'host.
  - La modalità skin non porta più con sé una seconda scala di corsie.
  - `tests/footer-precedence.test.ts` protegge la scala nel foglio sorgente e nel bundle committato.

## 0.2.0 — 2026-09-30 (adattamento alla linea host 0.2.0)

- 12 peer `@deepseek-ai/dsh-*` aggiornati a `>=0.2.0-rc.1 <0.2.1-0`; devDependencies a 0.2.0-rc.2; `pnpm-lock.yaml` rimosso (npm è l'unico package manager, `package-lock.json` nel repo).
- Baseline del gate rinnovata: `compat/harness-020rc2.json` (host 0.2.0-rc.2; 74 registrazioni ufficiali invariate, 14 dei 18 file ancora identici byte per byte).
- Revisione della deriva dell'host 0.2.0 (scoped-slots con useMemo / contract ui-tool puramente aggiuntivo userQuestionPanels / MessageItem TextShimmer / TurnProcessNodeView senza orologio live): ovunque semantica da chiamante, **zero modifiche al sorgente**.
- Il server delle fixture risponde 204 su `/favicon.ico` e registra le richieste non gestite (prima baseline fixture headless su questa macchina).

## 0.2.0 — 2026-09-18

### Revisione dei diff e presentazione dei tool

- Pannello di revisione dei diff reingegnerizzato: le statistiche di righe aggiunte/eliminate (`+A -R`) sono spinte a filo del margine destro, perfettamente allineate sulla stessa baseline di 32px del testo di riepilogo.
- L'overlay dei diff si espande in modo pulito all'interno della colonna di lettura (0px di overflow orizzontale) con scorrimento verticale indipendente (`max-height: 420px; overscroll-behavior: contain`), impedendo agli eventi della rotella di filtrare nel flusso della conversazione.
- Le schede multi-file scorrono orizzontalmente con altezza del contenuto adattiva al cambio di file.
- Schede tool personalizzate del PR #12: il rendering delle viste tool è delegato allo slot `tool.call.toolview` con isolamento tramite error boundary e capacità di auto-espansione.

### Vetro satinato traslucido e modalità skin

- La modalità vetro satinato traslucido è un interruttore opt-in nelle impostazioni.
- Quando attiva, tutti gli sfondi delle schede, le cornici dei dettagli tool e i blocchi di codice diventano traslucidi con blur di sfondo, eliminando le chiazze bianche opache e adattandosi senza giunzioni a wallpaper e skin di finestre di terze parti.

### Ripiegamento raffinato e vivacità

- Ritorno a un unico interruttore intuitivo di ripiegamento automatico (**自动折叠开 / 关**) nella toolbar di lettura e nelle impostazioni, rimuovendo le complesse regole multi-livello e mantenendo ragionamento e tool completamente aperti quando è disattivato.
- Corretto il bug di a capo così che le righe di riepilogo restino rigorosamente su una sola riga quando lo spazio lo consente.
- Orologi di attesa in tempo reale (`WaitClock`), tracciamento del tempo di esecuzione e metriche di throughput dei token (`TurnMetrics`) pienamente preservati e attivi.
- Le espansioni animate includono timeout di fallback per prevenire stalli di rendering.

### Impostazioni di Tidy Display

- Vetro, ripiegamento automatico e modalità di apertura dei deliverable condividono lo store radice `dsh.reader.v1`, così che impostazioni e vista di lettura restino sincronizzate dopo il refresh.
- Modalità di apertura dei deliverable: app di sistema predefinita, Sidebar opzionale. Cartella/rivelazione restano all'OS.
- Rilevamento dell'installazione del pacchetto di skill generative-mcpapps e riporto dello stato.

### Compatibilità e vivacità

- Un'attesa ora riparte quando un tool restituisce. L'insieme di passaggio di consegne nominava kind dal contratto di conversazione (`tool-result`) mentre il reader confrontava con i kind del layer chat, dove un tool restituito è la riga `tool-call` il cui `data.root` porta un risultato. Nessun nodo ha mai avuto il vecchio nome, quindi il ramo era morto e un tool restituito non riavviava mai l'orologio. L'insieme e ogni kind su cui ragiona sono ora tipizzati contro l'unione di kind dell'host stesso, così un nome sbagliato fallisce a `tsc` invece di fallire in silenzio a runtime, e un tool ancora in esecuzione esplicitamente non è un'attesa.
- La coreografia di ripiegamento non può più bloccarsi. Ogni fase avanza su promise di animazione e frame renderizzati, e un'animazione annullata rifiuta mentre una scheda nascosta non consegna frame — l'una o l'altra lasciava la macchina per sempre in una fase non-idle, il che teneva la sorgente di frame allo snapshot mostrato e metteva in pausa la rivelazione del testo, così il turno sembrava bloccato fino al remount della vista. Ogni fase ora ha anche una scadenza a orologio da muro che forza la fase successiva.
- Finché la coreografia trattiene la rivelazione, il buffer di stream continua ad assorbire la sorgente invece di uscire presto, così il testo non riprende mai da un obiettivo stantio una volta posato il ripiego.
- Lo stato mostra quanti sub-agent ha inviato il turno, letto dalla riga turn-process dell'host invece di essere ricontato qui.
- Eliminato il ramo di rendering `command-input`: quella stringa non è un kind di nodo chat in nessun host pubblicato, faceva solo sembrare che il file gestisse un caso che non può verificarsi.
- Anche ogni espansione animata riceve una scadenza a orologio da muro. `fill: 'both'` blocca il keyframe di apertura, quindi una Web Animation che non raggiunge mai `onfinish` (annullata, smontata o saltata dal compositor) lasciava la riga nel DOM a altezza e opacità zero — cliccarla sembrava non fare nulla.
- Aggiunta una sezione di impostazioni di Tidy Display: i deliverable si aprono ancora per impostazione predefinita nell'app di sistema, con un'anteprima opzionale nella Sidebar destra, più rilevamento della skill-root generative-mcpapps e istruzioni di installazione.
- Protezione degli echi di immagini delle sottomissioni pending così un invio di solo testo non può mandare in crash `conversation.view` (`images` / `attachments` possono mancare).
- Le istruzioni di installazione nominano solo radici relative convenzionali (`.dsh/skills`, `.agents/skills`) e non stampano mai la home dell'host o percorsi assoluti di pacchetti plugin.

### Lettura e ripiegamento

- Un passaggio di ragionamento successivo ripiega solo la sequenza di processo conclusa che segue. La sequenza ancora in streaming resta completamente aperta, così un turno lungo si legge come alternanza di riepiloghi e prosa invece di ripiegarsi a metà pensiero.
- L'intensità di ripiegamento 2 (`过程摘要`) è la modalità solo-processo del PR #14: la prosa non viene mai ripiegata; ogni sequenza conclusa di passaggi di ragionamento / tool / record si ripiega in un riepilogo che nomina ciò che i tool hanno fatto davvero (`读取 Reader.tsx`, `运行 pnpm test`), letto dalla stessa identità tool usata dalle schede tool. Non è il predefinito — il ripiegamento standard (livello 1) mantiene la coreografia dell'attuale main.
- Un turno solo-processo concluso ripiega anche la sua sequenza finale, e salta la riga contatore del turno chiuso divenuta duplicata di cui non ha più bisogno.

### Superficie di lettura

- Con il vetro satinato attivo, le corsie sticky usano lo stesso liquid glass del pannello dsh-auto-memory: velatura traslucida `bg-layer-2`, `blur(28px)`, bordo filo, raggio 16px e un leggero rilievo. I chip di dettaglio restano trasparenti finché non sono in hover o focus. Con l'interruttore spento, il chrome torna al main attuale.
- La toolbar riserva la larghezza dell'intero gruppo di controlli. Misurare solo il primo pulsante lasciava che la corsia di stato dipingesse sopra ogni controllo successivo.
- Un divisore di compattazione ora arriva invece di semplicemente apparire: il raggio si dispiega dal centro, la pillola si assesta e il quadrante fa un giro. Limitato da `data-motion=off` e `prefers-reduced-motion` come ogni altra transizione.

### Revisione dei diff

- Leggere i conteggi delle righe modificate dal risultato del tool che l'host già allega (`meta.diffs`, `{ path, oldText, newText }`), con fallback agli argomenti della chiamata stessa per `write` / `edit` / `str_replace_editor` quando una build dell'host non li invia. La whitelist dei nomi conta: diversi tool non correlati prendono un campo chiamato `content`, e contare le aggiunte inventate di questi attribuiva modifiche a chiamate che non avevano toccato alcun file.
- Le chiamate figlie di una chiamata padre si ripiegano nei suoi stessi conteggi. Un `run_code` che scrive file riporta ciò che i suoi figli hanno modificato piuttosto che ciò che contengono i suoi argomenti, così un run i cui edit stanno un livello sotto non perde più i suoi conteggi. Ogni figlio contribuisce con i propri argomenti, letti dal risultato depositato o dalla chiamata pending.
- `+N -M` sta in fondo alla riga in verde/rosso e apre un pannello che elenca una voce per file modificato — le schede dei file, le righe eliminate su fondo rosso e quelle aggiunte su fondo verde, usando la stessa primitiva `DiffBlock` della riga tool ufficiale. Il pannello è nel flusso, mai un popup flottante, così il `overflow: clip` della cella di flusso non può tagliarlo.
- Apertura e chiusura del pannello animano l'altezza reale nel linguaggio di movimento del plugin, e la scheda viene riportata in vista quando si apre sotto il margine; un pannello aperto tiene il proprio caret acceso.

### Attesa e tempi

- Mostrare da quanto tempo il modello ha in carico il turno, accanto a 「深度求索中」e all'indicatore di attesa nel flusso. L'orologio è ancorato all'ultimo evento che ha consegnato il controllo al modello — un tool restituito, un contesto iniettato, un comando eseguito, il messaggio stesso dell'utente — mai all'inizio del turno, così un'attesa appena cominciata non eredita i minuti che i tool hanno già speso.
- Dopo dieci secondi la lettura aggiunge un badge 「暂未响应」, e nel momento in cui il modello produce il suo primo blocco l'intero indicatore viene ritirato. Un tool ancora in esecuzione non è un'attesa: è il tool che sta lavorando.
- Un comando girato a lungo conserva la sua durata dopo la restituzione (colore d'avviso oltre i dieci secondi); uno veloce non mostra nulla una volta terminato. I passaggi in esecuzione mostrano un conteggio dei secondi live e un riepilogo scintillante mentre lavorano.

### Scorrimento

- Il tail-follow si stacca solo su un vero movimento verso l'alto del reader. La crescita del contenuto e l'easing del follow stesso muovono anch'esse `scrollTop`, e leggerlo come «l'utente ha lasciato il fondo» congelava il follow a metà turno.
- Disattivato lo scroll anchoring del browser sullo scroller della conversazione mentre il reader è montato: muoveva da solo il viewport man mano che la trascrizione cresceva.
- Solo un campo di testo con focus sospende il follow, e solo dentro il reader. Dare focus al composer fermava l'avanzamento della trascrizione.
- Stream al ritmo della sorgente: aggiunto un termine feed-forward stimato dal tasso di arrivo sopra il controllore proporzionale. Una rivelazione puramente proporzionale si assestava a un ritardo costante di `catchUpMs` a prescindere dalla velocità del modello, cosa che si leggeva 「慢」 mentre l'arretrato cresceva con i modelli veloci; il termine feed-forward drena l'arretrato e quello proporzionale assorbe il jitter del trasporto.
- Rivelare un lotto di parole su un unico orologio invece di una parola per intervallo fisso. La spaziatura a parola inchiodava il tasso vicino a 16 parole/secondo, così anche un modello veloce arrivava una parola per volta; un lotto ora atterra in una sola breve finestra mentre una parola nuova isolata mantiene la cadenza di battitura originale.
- Il follow del pannello di ragionamento avanza con l'arretrato invece che a passo-e-pausa fisso: prima avanzava di due righe ogni ~1,3 secondi a prescindere dalla velocità di arrivo del testo, ed è proprio ciò che dava l'impressione che il pannello restasse indietro rispetto a un modello veloce.
### Hook DOM dell'host

- Mantenuto l'hook `data-chat-flow=""` del ChatView sulla colonna del Reader così le skin che nascondono `[data-composer-seat]` quando lo scrollport non ha chat-flow (maid-atelier, phoebe-atelier e altre) mostrino comunque il composer nella vista di lettura.

## 0.1.1 — 2026-09-16

L'integrazione della vista di lettura accettata, compreso il lavoro consolidato dai PR #2, #5 e #8. Le intestazioni `0.2.0` / `0.2.1` precedenti erano note di sviluppo non pubblicate; quei cambiamenti vengono consegnati in questa release, non come versioni pubblicate separate.

### Lettura e ripiegamento

- Un passaggio di ragionamento successivo può ripiegare i passaggi precedenti della sua catena in un compatto riepilogo di conteggio. I soli aggiornamenti di corpo/tool non innescano il ripiegamento; l'input utente/steering azzera la catena. Il controllo di ripiegamento automatico può disattivare questa presentazione.
- Le righe con chiave stabile si rimpiccioliscono prima che i contatori si aggiornino, pausano brevemente, poi rivelano l'output bufferizzato. Ordine della sorgente, testo selezionato, comportamento reduced-motion e la risposta finale visibile sono preservati.
- Le statistiche di processo sopravvivono alla fine del turno. I passaggi nascosti vuoti non accumulano più gap da 16px nei turni lunghi conclusi.
- Il controllo di ripiegamento automatico riceve una corsia a tutta larghezza e senza giunzioni, senza linee divisorie né ombre di sostituzione. Le statistiche restano nel flusso normale fino in cima, poi si attaccano sotto la corsia di stato misurata, sia aperte che ripiegate.
- Le etichette di stato brevi restano leggibili invece di troncarsi. Il tempo di attesa si azzera sull'ultima sottomissione utente/steering invece di ereditare l'orario di inizio originale del turno.

### Navigazione e parità nativa

- Mantenuto il TimelineRail più recente, inclusi caricamento incrementale della cronologia, metriche per turno, supporto ai fork e atterraggio sicuro per il composer. Si scorre il contenitore della conversazione e non scatole antenate senza relazione.
- Saltate le schede JSON `turn-process` sintetiche dell'host; l'input del comando `/goal` è reso come testo etichettato; i dettagli del system prompt hanno il proprio scrollport.
- Uso del chevron compatto torna-al-fondo alla soglia nativa di quasi-fondo e coalescenza delle catture di anchor dello scorrimento.
- Mostrati i controlli ora/copia dei messaggi utente e la durata a fine turno; le righe dei file prodotti aspettano la chiusura del turno.

### Contenuti interattivi

- Rendering di MCP Apps generative da code fence supportati, blocchi personalizzati e risultati tool tramite un iframe isolato (`sandbox="allow-scripts allow-forms"`, senza `allow-same-origin`).
- Supporto all'inizializzazione JSON-RPC SEP-1865, dimensionamento, aggiornamenti di contesto e feedback dei prompt nel composer, con sincronizzazione chiaro/scuro e altezza automatica limitata.
- Incluso il pacchetto di skill generative-mcpapps, esempi e documentazione bilingue.

### Distribuzione e verifica

- Obiettivo DeepSeek Harness 0.1.5-rc.2 tramite i punti di estensione pubblici di plugin/client. Nessuna modifica ad Agent, SDK, provider, credenziali o core di Harness.
- Consegnata la patch del bundle a installazione standard e la `lib/` ricompilata e committata, dichiarazioni incluse; l'installazione git/tarball non richiede `prepare`.
- Aggiunte regressioni unitarie per ordine/tempistica del ripiegamento e orologio dello steering, più fixture browser con componenti reali per il motion, 500 righe nascoste, statistiche sticky/a capo e reset dell'orologio di attesa.

## 0.1.0

Prima pubblicazione pubblica del plugin di vista di lettura accettato, pubblicato come `dsh-tidy-display`.

- Contesto nativo e dettagli tool con ragionamento ordinato per sorgente e non modificato.
- Schede di lungo ragionamento limitate con follow a due righe, follow espanso e pausa/ripresa manuale.
- Ripiegamento del processo nei turni riusciti con risposta finale separata.
- Rivelazione del testo ordinata per sorgente e shimmer discreto dello stato occupato.
- Tipografia di stato stabile e spaziatura compatta delle espansioni.
- Fallback di contenuto nativi e slot di estensione a blocchi per plugin fidati.
- 42 test di regressione; nessuna modifica ad Agent DSH, SDK, provider o core.
