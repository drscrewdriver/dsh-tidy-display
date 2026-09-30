# Journal des modifications

## Non publié

- Le paquet est renommé en **`dsh-tidy-display`** sans scope et republié : le nom dans `package.json`, l'id de module `src/dsh-tidy-display.ts`, l'id de bundle tsdown et la ligne d'insert de `cordis.patch.yml` avancent tous ensemble (l'invariant id-de-module-=-nom-de-paquet ne change pas, il est simplement réancré sur le nouveau nom). La publication antérieure avec scope `@drscrewdriver/dsh-tidy-display@0.1.0` reste sur npm mais est supplantée — installez par le nom simple (`dsh plugin --profile web add dsh-tidy-display`). dist-tags : `dsh-0.1.7` et `latest`, tous deux → 0.1.0.

- Documentation de l'exclusion mutuelle avec `dsh-better-display` / `@bananasoldier01/dsh-tidychat` (sections d'installation du README) : les trois enregistrent une vue `reader` (même id, même priorité 0) dans le slot de liste `conversation.view`, et le registre de slots de l'hôte rejette le doublon à l'activation — le client signale `1 entry did not activate: failed` et la page reste bloquée sur l'écran d'échec de chargement des plugins. Diagnostiqué en direct sur un profil web où better-display restait activé aux côtés de l'installation npm de tidy-display ; le paquet lui-même n'a aucun défaut. Désactivez ou désinstallez better-display / tidychat avant d'activer ce plugin.

- Garde-fou `check-harness-compat` : passage de `--path-separator=/` à ripgrep. ripgrep 15 sous Windows imprime des chemins à antislash, si bien que le filtre de chemin `/src/client/` sautait chaque fichier, vidait silencieusement le scan des enregistrements officiels et faisait échouer la comparaison de base sous une pluie de `removedRegistrations` fantômes — et ce, précisément sur le checkout par rapport auquel la base avait été enregistrée.

- Rétroportage historique livré : trois branches compat portent le sous-ensemble du rail des messages vers les hôtes antérieurs à 0.1.7 — `compat/0.1.5` (0.1.5-alpha.1~0.1.6, tag `v0.1.0-dsh0.1.5`), `compat/0.1.2` (0.1.2-alpha.2~0.1.4.x, tag `v0.1.0-dsh0.1.2`), `compat/0.1.1` (0.1.0-rc.7~0.1.2-alpha.1, tag `v0.1.0-dsh0.1.1`). La matrice de compatibilité hôte ci-dessus pointe désormais vers les tags.

- Id de module verrouillé dans la source (correction de build local du fork) : `src/dsh-tidy-display.ts` exporte désormais `name = '@drscrewdriver/dsh-tidy-display'` (nom de paquet et entrée tsdown alignés sur l'id avec scope). L'arbre upstream porte le `dsh-tidy-display` sans scope ; le construire sans modification et le déployer sous l'entrée de profil avec scope empêche l'hôte de monter le bundle client, et tout le plugin échoue à s'activer en silence (pas d'onglet 阅读, vue native uniquement) — la même défaillance que fork.4 avait corrigée dans l'artefact publié, désormais verrouillée au niveau source pour les builds du fork.
- Les lignes du reader restaurent le contrat d'ancres du ChatView de l'hôte : les lignes user / steering / réponse de l'assistant / erreur de tour / inconnue portent désormais `data-chat-anchor-key={node.key}` et `data-chat-flow-kind={node.kind}` à côté des attributs du reader, à l'image de ce que `OfficialNode` faisait déjà pour les nœuds de repli. Les plugins de l'écosystème qui lisaient les ancres natives comme source de vérité DOM (par ex. le rail de dsh-tidychat) ne trouvaient plus aucune ligne sous le reader et ne rendaient rien, en silence ; le contrat natif est stable de 0.1.0-rc.7 à 0.1.7-rc.2 et est transmis tel quel.
- La transcription du raisonnement reçoit la plaque translucide de la bulle de réponse (même token `--dsw-alias-bg-layer-1`, rayon 16px, flou dépoli en mode verre), sous le même interrupteur 消息气泡 / Message bubbles, dans tous les états — le style de base de la carte était la couche opaque module-platform et son état à plat ([data-overflow=false][data-expanded=false]) supprimait totalement la plaque, deux causes qui collaient la transcription directement aux fonds d'écran des skins. Les paddings de l'état à plat sont rétablis sur la plaque via des règles à spécificité supérieure ; bulles désactivées, le comportement à plat/opaque précédent est conservé.
- Bulles de message : chaque réponse finale s'affiche dans une bulle arrondie qui la sépare du fond de page, le texte ne repose donc plus directement sur les fonds d'écran des hôtes skinnés. Le mode verre mélange les mêmes tokens en translucide, à l'image du traitement dépoli de la bulle utilisateur. Un nouvel interrupteur 消息气泡 / Message bubbles dans les réglages restaure la mise en page à plat lorsqu'il est désactivé (persisté comme `bubbles` sur `dsh.reader.v1`, activé par défaut).

## 0.3.3 — 2026-09-24

- Acceptation de Harness `0.1.7-rc.2` (`dsh-v0.1.7-rc.2`, `477b4f420553e8a52c2fbccc464d7561b239c443`). La plage peer reste `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` reste un slot de liste. La nouvelle entrée de fin `schedule-created` et la vue d'outil `schedule_update` sont des enregistrements officiels supplémentaires, reflétés via les sièges existants.
- Le contexte de changement d'outils du développeur (`tool-addition` / `tool-removal`) utilise le titre et le compteur officiels au lieu d'une ligne d'injection générique.
- Les images Markdown locales acceptent la route de fichier Desktop `dsh-app://app/api/file`.

## 0.3.2 — 2026-09-24

- Complétion du contrat d'exécution du pontage officiel 0.1.7-rc.1 : les vues d'outils reçoivent `phase`/`useDisclosure`/`hookContext{callId}`, et les nœuds de chat passent au store d'instantané `{turnData, disclosureReset}` ; corrige la chute silencieuse des vues d'outils officielles vers le repli sur un hôte réel.
- Fentes de peinture des voies épinglées de la zone repliée : la voie ne peignait son fond plein que sur sa propre boîte ; l'écart de 14px de `.turn`, le padding de 16px de la cellule précédente et la bande réservée `--reader-control-width` à droite de la voie de statut laissaient transparaître le contenu au défilement ; remplacées par un `box-shadow` de même couleur peignant vers le haut/la droite pour former une bande continue.

## 0.3.1 — 2026-09-24

- Acceptation de Harness `0.1.7-rc.1`. La plage peer est `>=0.1.7-rc.1 <0.1.8`.
- `conversation.chat.turnTail` est un slot de liste. L'ancienne attente de chaîne levait une exception au démarrage du client et laissait la page sur « Failed to load plugins ».
- Les importations d'icônes utilisent les noms de graisse rc.1 (`IconBrowseOutlineRegular` et consorts). La taille reste une prop.
- La confirmation en attente lit désormais `useSessionStatus` (`pendingInteraction`). Le hook supprimé `useSessionPendingInteraction` levait une exception dès la première peinture du reader.
- Les libellés de code et de terminal incluent les champs de barre d'outils rc.1 (`codeLabel`, wrap et `noExitCode`).

## 0.3.0 — 2026-09-21

- Correction du repli impossible après désactivation du repli automatique, consultation des détails de processus, puis réactivation ; la réactivation restaure les règles de repli automatique, tout en conservant la protection de la sélection de texte et le déploiement manuel ultérieur.
- Intégration, dans la mise en page de lecture existante, du rendu officiel des retours, détails d'outils, cartes de livrables explicites, commandes et nœuds inconnus ; le moteur de rendu officiel gère l'injection, la traduction, le store et les sous-slots.
- Suppression de l'appel direct aux composants d'outils et de la logique de déploiement par clic simulé ; les résumés, replis, animations et raccourcis de fichiers existants sont conservés.
- Intégration du service officiel de liens de fichiers, transmission des numéros de ligne des fichiers d'outils, ajout des images Markdown locales RC2 et de la dégradation en cas d'échec de chargement.
- Correction du retour en bas lors du suivi de défilement ; unification des positions de la voie de la colonne de lecture et de la zone épinglée.
- Les résultats de l'interpréteur de code s'affichent comme une sortie de terminal, avec des lignes de contexte compatibles `provenance` et `producer`.
- Ajout de tests d'intégration rejouables des composants officiels, de régressions d'interaction du repli automatique et d'une vérification de compatibilité des mises à niveau Harness ; dépendances alignées sur Harness `0.1.5-rc.2`.
- Périmètre de conception, frontières d'interface et modules à converger : voir `docs/official-rendering-bridge.md`.

## 0.2.1 — 2026-09-20

### Corrigé

- Les voies épinglées du reader ne peignaient plus au-dessus de la zone de saisie. La ligne de statut en direct (`执行过程` / `正在使用工具`) épinglée en haut du scrollport avec `z-index: 8`, alors que le siège collant du composeur de l'hôte détient `z-index: 7` et que rien entre le reader et `<body>` ne crée de contexte d'empilement. Un reader en défilement comprimait chaque voie collante de niveau tour dans la bande de pied — la voie s'arrête au bas de son bloc englobant, qui passe derrière la carte de saisie — et le reader peignait donc sa propre plaque opaque par-dessus le composeur.
  - La voie de statut en direct détient désormais la voie mesurée sous la barre d'outils, exactement comme les lignes de résumé fermées, au lieu de partager celle de la barre d'outils.
  - Les voies qu'un défilement peut comprimer dans la bande de pied restent sous le siège du composeur (`z-index` 6) ; seule la voie de la barre d'outils supérieure conserve 7, ce qui la maintient aussi au-dessus des bannières de blocs de code de l'hôte.
  - Le mode skin ne transporte plus sa propre seconde échelle de voies.
  - `tests/footer-precedence.test.ts` protège l'échelle dans la feuille de source et dans le bundle committé.

## 0.2.0 — 2026-09-18

### Revue des diffs et présentation des outils

- Refonte du panneau de revue de diffs : les statistiques d'ajout/suppression de lignes (`+A -R`) sont repoussées au ras de la marge droite, parfaitement alignées sur la même baseline de 32px que le texte du résumé.
- La superposition de diff se déploie proprement dans la colonne de lecture (0px de débordement horizontal) avec un défilement vertical indépendant (`max-height: 420px; overscroll-behavior: contain`), empêchant la molette de fuir vers le flux de conversation.
- Les onglets multi-fichiers défilent horizontalement avec une hauteur de contenu adaptative lors des changements de fichier.
- Cartes d'outils personnalisées du PR #12 : le rendu des vues d'outils est délégué au slot `tool.call.toolview` avec isolation par frontière d'erreur et auto-déploiement.

### Verre dépoli translucide et mode skin

- Le mode verre dépoli translucide est un interrupteur à activer dans les réglages.
- Lorsqu'il est activé, tous les fonds de cartes, cadres de détails d'outils et blocs de code deviennent translucides avec flou d'arrière-plan, éliminant les plages blanches opaques et s'adaptant sans couture aux fonds d'écran et skins de fenêtres tiers.

### Repli affiné et vivacité

- Retour à un unique interrupteur de repli automatique intuitif (**自动折叠开 / 关**) sur la barre d'outils de lecture et dans les réglages, supprimant les règles multi-niveaux complexes tout en gardant raisonnement et outils totalement dépliés lorsqu'il est désactivé.
- Correction du bug de retour à la ligne pour que les lignes de résumé restent strictement sur une seule ligne quand l'espace le permet.
- Horloges d'attente en temps réel (`WaitClock`), suivi du temps d'exécution et métriques de débit de tokens (`TurnMetrics`) entièrement préservés et actifs.
- Les déploiements animés incluent des délais de secours pour éviter les blocages de rendu.

### Réglages de Tidy Display

- Verre, repli automatique et mode d'ouverture des livrables partagent le store racine `dsh.reader.v1` afin que réglages et vue de lecture restent synchronisés après actualisation.
- Mode d'ouverture des livrables : application système par défaut, panneau latéral optionnel. Dossier/révélation restent gérés par l'OS.
- Détection de l'installation du pack de compétences generative-mcpapps et rapport d'état.

### Compatibilité et vivacité

- Une attente redémarre désormais quand un outil renvoie. L'ensemble de transfert nommait des kinds du contrat de conversation (`tool-result`) tandis que le reader compare aux kinds de la couche chat, où un outil renvoyé est la ligne `tool-call` dont `data.root` porte un résultat. Aucun nœud n'a jamais porté l'ancien nom : la branche était morte et un outil renvoyé ne redémarrait jamais l'horloge. L'ensemble et chaque kind qu'il manipule sont désormais typés contre l'union de kinds propre à l'hôte, de sorte qu'un nom erroné échoue à `tsc` au lieu d'échouer en silence à l'exécution, et un outil encore en cours n'est explicitement pas une attente.
- La chorégraphie de repli ne peut plus se bloquer. Chaque phase avance sur des promesses d'animation et des frames rendues, et une animation annulée rejette tandis qu'un onglet caché ne livre aucune frame — l'un ou l'autre laissait la machine dans une phase non-idle pour toujours, ce qui maintenait la source de frames au snapshot affiché et mettait en pause la révélation du texte, si bien que le tour semblait coincé jusqu'au remontage de la vue. Chaque phase dispose aussi d'une échéance d'horloge murale qui force la phase suivante.
- Tant que la chorégraphie retient la révélation, le tampon de flux continue d'absorber la source au lieu de sortir tôt, si bien que le texte ne reprend jamais depuis une cible périmée une fois le repli posé.
- Le statut affiche combien de sous-agents le tour a lancés, lu depuis la ligne turn-process propre à l'hôte au lieu d'être recompté ici.
- Suppression de la branche de rendu `command-input` : cette chaîne n'est un kind de nœud chat dans aucun hôte publié, elle ne faisait que donner l'impression que le fichier gérait un cas impossible.
- Chaque déploiement animé reçoit lui aussi une échéance d'horloge murale. `fill: 'both'` épingle la keyframe d'ouverture, si bien qu'une Web Animation qui n'atteint jamais `onfinish` (annulée, démontée ou sautée par le compositeur) laissait la ligne dans le DOM à hauteur et opacité nulles — cliquer dessus ne montrait rien.
- Ajout d'une section de réglages Tidy Display : les livrables s'ouvrent toujours par défaut dans l'application système, avec un aperçu optionnel dans le panneau latéral droit, plus la détection de la racine de compétences generative-mcpapps et des consignes d'installation.
- Protection des échos d'images des soumissions en attente pour qu'un envoi textuel seul ne puisse pas faire planter `conversation.view` (`images` / `attachments` peuvent être absents).
- Les consignes d'installation ne nomment que des racines relatives conventionnelles (`.dsh/skills`, `.agents/skills`) et n'impriment jamais le home de l'hôte ni des chemins absolus de packs de plugins.

### Lecture et repli

- Une étape de raisonnement ultérieure ne replie que la séquence de processus terminée qu'elle suit. La séquence encore en flux reste totalement déployée, si bien qu'un long tour se lit comme l'alternance de résumés et de prose au lieu de se replier en pleine pensée.
- L'intensité de repli 2 (`过程摘要`) est le mode processus seul du PR #14 : la prose n'est jamais repliée ; chaque séquence terminée d'étapes de raisonnement / outil / enregistrement se replie en un résumé qui nomme ce que les outils ont réellement fait (`读取 Reader.tsx`, `运行 pnpm test`), lu depuis la même identité d'outil que celle des cartes d'outils. Ce n'est pas le défaut — le repli standard (niveau 1) conserve la chorégraphie du main actuel.
- Un tour processus-seul terminé replie aussi sa séquence finale, et saute la ligne de compteur de tour fermé devenue doublon dont il n'a plus besoin.

### Surface de lecture

- Quand le verre dépoli est activé, les voies épinglées utilisent le même liquid glass que le panneau dsh-auto-memory : voile translucide `bg-layer-2`, `blur(28px)`, bordure filaire, rayon de 16px et léger relief. Les puces de détails restent transparentes jusqu'au survol ou au focus. Interrupteur désactivé, le chrome rejoint le main actuel.
- La barre d'outils réserve la largeur de tout son groupe de contrôles. Ne mesurer que le premier bouton laissait la voie de statut peindre par-dessus tous les contrôles suivants.
- Un séparateur de compaction arrive désormais au lieu d'apparaître simplement : le balayage part de son centre, la pastille s'installe et le cadran fait un tour. Soumis à `data-motion=off` et `prefers-reduced-motion` comme toutes les autres transitions.

### Revue de diffs

- Lecture des comptes de lignes modifiées depuis le résultat d'outil que l'hôte joint déjà (`meta.diffs`, `{ path, oldText, newText }`), avec repli sur les propres arguments de l'appel pour `write` / `edit` / `str_replace_editor` quand une build de l'hôte ne les envoie pas. La liste blanche de noms compte : plusieurs outils sans rapport prennent un champ nommé `content`, et compter les ajouts inventés de ces derniers attribuait des modifications à des appels qui n'avaient touché aucun fichier.
- Les appels enfants d'un appel parent sont repliés dans ses propres comptes. Un `run_code` qui écrit des fichiers rapporte ce que ses enfants ont modifié plutôt que ce que contiennent ses propres arguments, si bien qu'un run dont les modifications sont un niveau plus bas ne perd plus ses comptes. Chaque enfant contribue via ses propres arguments, lus depuis le résultat déposé ou l'appel en attente.
- `+N -M` se place en fin de ligne en vert/rouge et ouvre un panneau listant une entrée par fichier modifié — onglets de fichiers, lignes supprimées sur fond rouge et lignes ajoutées sur fond vert, avec la même primitive `DiffBlock` que la ligne d'outil officielle. Le panneau est dans le flux, jamais une popup flottante, si bien que le `overflow: clip` de la cellule de flux ne peut pas le couper.
- L'ouverture et la fermeture du panneau animent la vraie hauteur dans le langage de mouvement propre au plugin, et la carte est ramenée dans le champ de vision quand elle s'ouvre sous le pli ; un panneau ouvert garde son caret allumé.

### Attente et chronométrage

- Affichage depuis combien de temps le modèle a reçu le tour, à côté de 「深度求索中」et de l'indicateur d'attente dans le flux. L'horloge est ancrée au dernier événement ayant remis la main au modèle — un outil renvoyé, un contexte injecté, une commande exécutée, le propre message de l'utilisateur — jamais au début du tour, pour qu'une attente qui débute n'hérite pas des minutes déjà passées par les outils.
- Passées dix secondes, l'affichage ajoute un badge 「暂未响应」, et dès que le modèle produit son premier bloc tout l'indicateur se retire. Un outil encore en cours n'est pas une attente : c'est l'outil qui travaille.
- Une commande qui a tenu longtemps conserve sa durée après son retour (couleur d'avertissement passées dix secondes) ; une commande rapide n'affiche rien une fois terminée. Les étapes en cours montrent un compteur de secondes en direct et un résumé scintillant pendant qu'elles travaillent.

### Défilement

- Le suivi de fin ne se détache que sur un vrai mouvement vers le haut du reader. La croissance du contenu et l'easing du suivi lui-même déplacent aussi `scrollTop`, et le lire comme « l'utilisateur a quitté le bas » gelait le suivi en plein tour.
- Désactivation de l'ancrage de défilement du navigateur sur le scroller de conversation tant que le reader est monté : il déplaçait le viewport de lui-même à mesure que la transcription grossissait.
- Seul un champ de texte focalisé suspend le suivi, et uniquement dans le reader. Focaliser le composeur arrêtait auparavant l'avancement de la transcription.
- Streamer au rythme propre de la source : ajout d'un terme d'anticipation (feed-forward) estimé depuis le taux d'arrivée, par-dessus le contrôleur proportionnel. Une révélation purement proportionnelle se stabilisait à un retard constant de `catchUpMs` quelle que soit la vitesse du modèle, ce qui se lisait 「慢」 tandis que l'arriéré grossissait avec les modèles rapides ; le terme d'anticipation draine l'arriéré et le terme proportionnel absorbe la gigue du transport.
- Révéler un lot de mots sur une seule horloge au lieu d'un mot par intervalle fixe. L'espacement par mot calait le débit près de 16 mots/seconde, si bien qu'un modèle rapide arrivait quand même mot à mot ; un lot atterrit désormais dans une courte fenêtre unique tandis qu'un mot isolé garde la cadence de frappe originale.
- Le suivi propre du panneau de raisonnement progresse avec l'arriéré plutôt qu à un rythme fixe de pas-avec-pause : il avançait de deux lignes toutes les ~1,3 secondes quelle que soit la vitesse d'arrivée du texte, et c'est ce qui donnait l'impression que le panneau prenait du retard sur un modèle rapide.
### Crochets DOM de l'hôte

- Conservation du crochet `data-chat-flow=""` du ChatView sur la colonne du Reader afin que les skins qui masquent `[data-composer-seat]` quand le scrollport n'a pas de chat-flow (maid-atelier, phoebe-atelier et autres) affichent toujours le composeur en vue de lecture.

## 0.1.1 — 2026-09-16

L'intégration de la vue de lecture acceptée, y compris le travail consolidé des PR #2, #5 et #8. Les titres `0.2.0` / `0.2.1` antérieurs étaient des notes de développement non publiées ; ces changements livrent dans cette version, pas comme versions publiées distinctes.

### Lecture et repli

- Une étape de raisonnement ultérieure peut replier les étapes antérieures de sa chaîne en un résumé compact de comptage. Les seules mises à jour de corps/d'outil ne déclenchent pas de repli ; une entrée user/steering réinitialise la chaîne. La commande de repli automatique peut désactiver cette présentation.
- Les lignes à clé stables rapetissent avant la mise à jour des compteurs, marquent une brève pause, puis révèlent la sortie tamponnée. L'ordre de la source, le texte sélectionné, le comportement reduced-motion et la réponse finale visible sont préservés.
- Les statistiques de processus survivent à la fin du tour. Les étapes cachées vides n'accumulent plus d'écarts de 16px dans les longs tours terminés.
- La commande de repli automatique reçoit une voie pleine largeur et sans couture, sans lignes de séparation ni ombres de remplacement. Les statistiques restent dans le flux normal jusqu'en haut, puis se collent sous la voie de statut mesurée, déployées ou repliées.
- Les courts libellés de statut restent lisibles au lieu d'être tronqués. Le temps d'attente se réinitialise à la dernière soumission user/steering plutôt que d'hériter de l'heure de début originale du tour.

### Navigation et parité native

- Conservation du TimelineRail plus récent, y compris le chargement incrémental de l'historique, les métriques par tour, la prise en charge des forks et l'atterrissage sûr pour le composeur. Défilement du conteneur de conversation plutôt que des boîtes ancêtres sans rapport.
- Saut des cartes JSON `turn-process` synthétiques de l'hôte ; rendu de l'entrée de commande `/goal` en texte libellé ; les détails du prompt système reçoivent leur propre scrollport.
- Utilisation du chevron compact de retour-en-bas au seuil natif de quasi-bas et fusion des captures d'ancres de défilement.
- Affichage des contrôles temps/copie des messages utilisateur et de la durée de fin de tour ; les lignes de fichiers produits attendent la clôture du tour.

### Contenu interactif

- Rendu des MCP Apps génératives depuis les blocs de code pris en charge, les blocs personnalisés et les résultats d'outils via un iframe isolé (`sandbox="allow-scripts allow-forms"`, sans `allow-same-origin`).
- Prise en charge de l'initialisation JSON-RPC SEP-1865, du dimensionnement, des mises à jour de contexte et du feedback de prompt vers le composeur, avec synchronisation clair/sombre et hauteur auto bornée.
- Inclusion du pack de compétences generative-mcpapps, des exemples et d'une documentation bilingue.

### Distribution et vérification

- Cible DeepSeek Harness 0.1.5-rc.2 via les points d'extension publics de plugin/client. Aucun changement d'Agent, de SDK, de fournisseur, d'identifiants ni du cœur de Harness.
- Livraison du patch de bundle d'installation standard et de la `lib/` reconstruite et committée, déclarations incluses ; l'installation git/tarball n'exige pas `prepare`.
- Ajout de régressions unitaires d'ordre/chronométrage de repli et d'horloge de steering, plus des fixtures navigateur à composants réels pour le mouvement, 500 lignes cachées, statistiques collantes/retour à la ligne et réinitialisations de l'horloge d'attente.

## 0.1.0

Première publication publique du plugin de vue de lecture accepté, publié sous `dsh-tidy-display`.

- Contexte natif et détails d'outils avec raisonnement ordonné selon la source et non modifié.
- Cartes de long raisonnement bornées avec suivi sur deux lignes, suivi déployé et pause/reprise manuelle.
- Repli de processus des tours réussis avec réponse finale séparée.
- Révélation du texte ordonnée selon la source et scintillement discret d'état occupé.
- Typographie de statut stable et espacement compact des déploiements.
- Replis de contenu natifs et slot d'extension de bloc de plugin de confiance.
- 42 tests de régression ; aucun changement à l'Agent DSH, au SDK, aux fournisseurs ni au cœur.
