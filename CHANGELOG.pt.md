# Registro de mudanças

0.4.5: adendo de enumeração de hosts para DSH 0.2.1-rc.3 (aumento apenas na declaração; plano de contrato com diff zero).

## 0.4.4 — 2026-10-22

- **A vista de leitura libera o render_ui (conflito duro B com o dsh-genui)**. A condição de bypass do ResultView curto-circuitava render_ui e show_widget juntos para a linha de resultado genérica, e o GenUI só aparecia como JSON na leitura. Agora apenas o show_widget mantém o bypass (seu parâmetro html passa pelo McpAppFrame, renderização própria do tidy); o render_ui vai para o assento espelhado oficial tool.call.toolview: com o GenUI instalado o registro dele vence e o cartão aparece; sem GenUI, ou com render_ui levando html, o fallback do assento volta à linha genérica original — estado final padrão sem mudança alguma.
- **A vista de leitura delega a tomada sombra do assistant-step (conflito duro A com o dsh-raw-html-v2)**. Novos critérios isShadowWinner (priority < 0; os registros oficiais do host não escrevem priority) e acceptOfficialNode: a baseline oficial assistant-step continua filtrada e auto-renderizada pelo Reader, enquanto tomadas sombra externas (como o raw-html-v2 com a chave de renderização ligada) entram espelhadas no assento official.nodes e o Reader as delega via AssistantStepDelegation; sem sombra a delegação nem é montada — zero deriva de DOM quadro a quadro no caminho padrão. Com a chave desligada nada se registra, comportamento idêntico ao 0.4.3.
- i18n: adiciona o locale português (pt-BR) — dicionário em tempo de execução, metadados do pacote e espelhos README/CHANGELOG.

## 0.4.3 — 2026-10-21

- **A seta «carregar mais antigos» da trilha de mensagens aceita cliques contínuos**. A seta do topo da trilha na vista «Conversa» nativa só disparava uma vez: ao farejar o botão 加载更早 do host, ① a regex não reconhecia o texto em carregamento (正在加载更早 / Loading earlier) e a seta colapsava no instante do carregamento; ② hasMore só era recalculado em mudança de prefs, então o botão re-emergente não re-renderizava o componente. Agora a coincidência cobre os textos ocioso e de carregamento, e um MutationObserver com rAF (escopo [data-conversation-scroll]) dirige o recálculo reativo; loadOlder só clica em botões não desabilitados — clicar durante o carregamento é um no-op inofensivo. A trilha da vista de leitura já usava useSession(hasMore) + session().loadOlder() e não é afetada.
- **Blindagem da placa das bolhas contra skins que zeram tokens**. Em ambientes sem skin a placa .answer já existia; quem ficava nu de fato era a nova .processCommentary, de só linha vertical esquerda — agora recebe a mesma receita de três camadas da .answer (scrim bg-base 76% + tint neutro permanente + layer-1, inabalável mesmo se a skin zerar --dsw-alias-bg-layer-1), com raio/padding reduzidos para os comentários de processo lerem mais leves que a resposta final. A .answer também adota a receita.
- **Três ajustes na entrada de leitura e na barra de abas**. ① A aba de conversa vai para a extrema esquerda: o order do conversation.view na leitura muda de -5 para 1, ficando à direita da conversa nativa (order:0) e à esquerda da trajetória — ordem de leitura: 对话 · 阅读 · …. ② Sem forçamento: a política de entrada só leva à vista de leitura com ?reader=1 (ou 0.1.0-trial.N), caso contrário permanece o padrão do host. ③ Na leitura a área do composer é escondida por CSS global com escopo html[data-tidychat-reader] ([data-composer-seat]/[data-composer-card]), e o padding/reserva do composer no nó raiz da leitura é zerado via --dsh-composer-height / …-side-clearance; contagem de referências como guarda, sem machucar a outra instância da trilha ao alternar reader↔chat.

## 0.4.2 — 2026-10-18

- **Reforma da placa de vidro fosco: um único knob associado à chave**. Antes, no ramo glass as faces de conteúdo dos cartões de ferramenta (.toolDetails/.notice/.unknown/.toolRaw/.systemPrompt/.compactionSummaryBox/.attention/.imageFrame/.imageDialog) só recebiam a «transparência», sem placa — texto direto sobre o papel de parede. Todas passam a usar o knob --reader-plate-wash: 35% (wash bg-base auto-ajustado ao tema + wash neutro permanente no background-image, à prova de skin zerando token + blur 12px); a bolha .user e a nova .processCommentary seguem o mesmo knob. Com a chave desligada o ramo glass inteiro não se aplica, voltando ao fundo opaco nativo do host — aparência padrão inalterada. Direção de correção vinda de findings/glass-mode-opacity-fix.md (o ponto de partida 55%/45% convergiu para 35% uniforme por inspeção ao vivo).
- **A tabela de suporte acrescenta 0.2.1-rc.2**: enumeração em hosts.mjs de 16→17 itens, distribuída como a mesma string para engines.dsh + 12 peers dsh-* + os blocos geridos dos sete READMEs; presença verificada pacote por pacote no npm (12/12 com rc.2 em versão), validação semver bidirecional: acerta 0.2.1-rc.2/0.2.1-rc.1, rejeita 0.3.0-rc.1/0.2.2. Nota: este item é suporte de declaração; a face de quebra do rc.2 não foi testada na matriz completa.

## 0.4.1 — 2026-10-17

- **Adaptação ao DSH 0.2.1-rc.1 (lote de complementação das lacunas dos sete repositórios; guarda: código e manifesto na mesma release)**: ① os rótulos do cartão de terminal completam o commandLine(line) obrigatório do rc.1 (nome acessível; texto idêntico ao zh oficial 命令第 N 行); ② o slot oficial de imagens segue a renomeação do host: conversation.message.images → conversation.chat.message.images (chaves de declaração de OFFICIAL_SLOTS/OFFICIAL_SEATS/SlotMap e o fixture do navegador sincronizados; injetar slot antigo é falha silenciosa, grep do nome antigo = 0 nos dois sentidos; os hosts de linha antiga ainda recebem os campos renderMessageImages/openSkill, com cast mantendo o rc.1 verde no plano de tipos); ③ nova baseline compat/harness-0.2.1-rc.1.json (checkout registrado na tag rc.1, --path-separator=/ contra falsos removed no Windows) assumida como baseline padrão do build. Critério de carga: hosts.mjs acrescenta 0.2.1-rc.1, engines.dsh + 12 peers dsh-* + blocos geridos dos sete READMEs enumeram a mesma string exata (16 itens, sem intervalo/caret); semver bidirecional: acerta 0.2.1-rc.1 / rejeita 0.3.0-rc.1. devDeps do plano do host fixados em 0.2.1-rc.1 (ponto cego da verificação ①: node_modules instalado = linha-alvo), typecheck/build/155 testes unitários verdes.

## 0.4.0 — 2026-10-15

- **Novo interruptor «raciocínio sempre colado embaixo» (padrão desligado)**: o cartão de raciocínio recolhido rola continuamente para o fim do conteúdo, mostrando sempre a linha mais recente; durante o streaming também cola (ignorando o seguimento prévio de 840ms/500ms). A preferência global é pinReasoningBottom em dsh.reader.v1; o painel de configurações ganha um role=switch (data-tidy-display-pin-bottom), localizado em 9 idiomas.
- **Correção: a chave escrevia no prefs global enquanto o leitor lia um store com escopo, e não pegava**: a ordem de leitura passa a ser «snapshot global prefsSnap primeiro, recuo no store com escopo», no mesmo padrão do autoFold; o tipo inline de openPrefs.getSnapshot é completado com o campo; o carimbo de build data-reader-build realinhado a esta versão.

## 0.3.1 — 2026-10-10

- **Corrigido: linhas de chamada de ferramenta sem placa de bolha — o texto ficava solto sobre papéis de parede de skin**. A placa das bolhas cobria só respostas e cartões de raciocínio; as linhas de ferramenta recolhidas (e sua caixa de detalhes expandida) ficavam sobre a página nua. Com data-reader-bubbles=on a linha de ferramenta de nível superior recebe a mesma placa da resposta (linha + detalhe expandido num único cartão; subchamadas continuam planas dentro da placa do pai, sem bolhas aninhadas).
- **As placas das bolhas agora têm três camadas**. Skins de papel de parede podem publicar --dsw-alias-bg-layer-1 totalmente transparente, deixando cada bolha uma moldura em volta de nada. Cada placa agora põe um tint neutro permanente, e a placa da linha de ferramenta soma um scrim de 76% da cor-base da página (color-mix sobre --dsw-alias-bg-base, sensível ao tema), então moldura ⟹ piso se sustenta seja lá o que a skin zerar. A caixa de detalhes expandida ganhou seu próprio tint claro para o caminho de bolhas desligadas.
- **Métricas de rodada e contagens do resumo de recolhimento legíveis nos dois temas**. As pílulas de uso de tokens / tempo decorrido e o resumo 思考×N · 工具×N saíram das camadas de rótulo mais fracas para --dsw-alias-label-primary (inverte com o tema) e, em telas claras (body:not([data-ds-dark-theme])), renderizam em preto pleno.

## 0.2.4-beta.5 — 2026-10-05

- **Corrige a falha total em 0.1.2/0.1.5**: a canarização do cliente em officialChildren só aceitava o contrato list/session da geração 0.1.7+ para conversation.chat.turnTail, enquanto hosts 0.1.2–0.1.5 declaram chain/session — o throw matava todo o entry do cliente e a porta de arranque web rejeitava a página inteira. Agora há lista branca por geração (a tail aceita spec list e chain) e a spec viva do host é vinculada; a segunda canaria no espelho também apenas avisa, sem lançar. Resíduo conhecido: na 0.1.2 pode aparecer um cartão de degradação elegante React #130 sob mensagens do usuário na página de leitura (corpo/faixas inafetados).

## 0.2.3 — 2026-10-03

- **Decisão de design: as linhas dentro da rodada não flutuam mais**. A linha de estado 用时 ×分×秒 e a linha-resumo de recolhimento 思考×… são parte do conteúdo, não barra de ferramentas — position: sticky, offsets de cola, z-index, placa --dsw-alias-bg-base e a sombra de remendo de -14px foram todos retirados; elas rolam com o conteúdo. Só a barra de ferramentas do topo (a chave de recolhimento automático) continua colada. O 0.2.3-beta.1 havia mexido só na geometria de cola, mas o feedback do usuário (conteúdo recolhido fica preso em posição indevida ao rolar) dizia exatamente que essas linhas não deviam fixar; o problema de texto sobre texto quando os tokens do tema são translúcidos desaparece junto (não há mais placa).
- O teste guarda footer-precedence é invertido para o novo contrato: linhas dentro da rodada não podem declarar position: sticky/fixed nem top; liveFoldContainer (regra morta) mantém a asserção de existência z<7 até limpeza futura.
- Correção do desalinhamento das faixas coladas do recolhimento (conteúdo rolando entre 用时 ×分×秒 e 思考×…, com a linha-resumo escondida sob a linha de estado): o top de .turnProcessSticky não incorpora mais a altura real medida da própria linha — quando a linha de estado quebrava e crescia, ela se pregava ainda mais baixo e a faixa abaixo da barra de ferramentas expunha conteúdo rolado (o remendo de -14px não cobria); os offsets de cola de .flowCell[data-flow-summary] / .closedProcessSummary passam a ser altura medida da barra + altura medida da linha de estado, sem depender do --reader-sticky-lane nunca atribuído (sempre o fallback de 40px — um estado quebrado em 56,8px, ou botões de 44px com pointer: coarse, enterrou a linha-resumo sob a placa da linha de estado). Regressão no fixture de navegador real rolando de 40px em 40px: 0 frestas, 0 sobreposições nas três faixas com estado quebrado em 56,8px. O carimbo data-reader-build e a versão do pacote realinhados. Porteado da linha 0.1.7 (ccd338e).
- eslint ignora .delivery/** (artefatos de build do fixture).
- Novo fixture de reprodução tests/browser-fold-scroll-issue.tsx (rodada fechada + duas faixas coladas + tabela de resposta longa), construído com node scripts/build-motion-fixture.mjs tests/browser-fold-scroll-issue.tsx.

## Sem publicar

- O pacote foi renomeado para dsh-tidy-display sem âmbito (unscoped) e republicado: o nome em package.json, o id de módulo src/dsh-tidy-display.ts, o id do bundle tsdown e a linha de insert do cordis.patch.yml se movem juntos (o invariante id-de-módulo-=-nome-de-pacote não muda, só se refixa no novo nome). A publicação com âmbito anterior @drscrewdriver/dsh-tidy-display@0.1.0 segue no npm mas fica superada — instale pelo nome simples (dsh plugin --profile web add dsh-tidy-display). dist-tags: dsh-0.1.7 e latest, ambos → 0.1.0.
- Documentada a exclusão mútua com dsh-better-display / @bananasoldier01/dsh-tidychat (seções de instalação do README): os três registram uma vista reader (mesmo id, mesma prioridade 0) no slot de lista conversation.view, e o registro de slots do host rejeita o duplicado na ativação — o cliente informa 1 entry did not activate: failed e a página fica presa na tela de falha de carregamento de plugins. Diagnosticado ao vivo num perfil web em que o better-display seguia ativo junto com a instalação npm do tidy-display; o pacote em si não tem defeito algum. Desative ou desinstale better-display / tidychat antes de ativar este plugin.
- Porta check-harness-compat: passar --path-separator=/ ao ripgrep. O ripgrep 15 no Windows imprime caminhos com barras invertidas, então o filtro de rota /src/client/ pulava todos os arquivos, esvaziava em silêncio a varredura de registros oficiais e fazia a comparação com a baseline falhar numa muralha de removedRegistrations fantasma — justo no checkout contra o qual a baseline havia sido registrada.
- Backport legado publicado: três ramas compat levam o subconjunto da trilha de mensagens a hosts anteriores a 0.1.7 — compat/0.1.5 (0.1.5-alpha.1~0.1.6, tag v0.1.0-dsh0.1.5), compat/0.1.2 (0.1.2-alpha.2~0.1.4.x, tag v0.1.0-dsh0.1.2), compat/0.1.1 (0.1.0-rc.7~0.1.2-alpha.1, tag v0.1.0-dsh0.1.1). A matriz de compatibilidade acima já liga as tags.
- Id de módulo fixado no código (correção de build local do fork): src/dsh-tidy-display.ts agora exporta name = @drscrewdriver/dsh-tidy-display (nome do pacote e entrada tsdown alinhados ao id com âmbito). A árvore do upstream traz o dsh-tidy-display sem âmbito; compilá-la sem mudanças e implantá-la sob a entry de perfil com âmbito impede o host de montar o bundle do cliente, e o plugin inteiro falha em ativar em silêncio (sem aba de 阅读, só a vista nativa) — a mesma falha que o fork.4 corrigiu no artefato publicado, agora fixada na fonte para os builds do fork.
- As linhas do reader restauram o contrato de âncoras do ChatView do host: as linhas user / steering / resposta do assistente / erro de rodada / desconhecida carregam data-chat-anchor-key={node.key} e data-chat-flow-kind={node.kind} junto dos atributos do reader, como o OfficialNode já fazia para nós de fallback. Plugins do ecossistema que leem as âncoras nativas como fonte de verdade do DOM (p. ex. a trilha do dsh-tidychat) paravam de encontrar linhas sob o reader e não renderizavam nada em silêncio; o contrato nativo é estável de 0.1.0-rc.7 a 0.1.7-rc.2 e é repassado tal qual.
- A transcrição do raciocínio recebe a placa translúcida da bolha de resposta (mesmo token --dsw-alias-bg-layer-1, raio 16px, desfoque fosco no modo vidro) sob a mesma chave 消息气泡 / Message bubbles, em todos os estados — o estilo base do cartão era a camada opaca module-platform e seu estado plano ([data-overflow=false][data-expanded=false]) eliminava a placa por completo, ambos jogando a transcrição direto sobre os fundos das skins. Os paddings do estado plano são restaurados sobre a placa com regras de maior especificidade; bolhas desligadas mantém o comportamento plano/opaco anterior.
- Bolhas de mensagem: cada resposta final é renderizada numa bolha arredondada que a separa do fundo da página, de modo que o texto não fica mais direto sobre papéis de parede de hosts com skins. O modo vidro mistura os mesmos tokens de forma translúcida, imitando o tratamento fosco da bolha do usuário. Uma nova chave 消息气泡 / Message bubbles nos ajustes restaura o layout plano quando desligada (persistida como bubbles em dsh.reader.v1, ligada por padrão).

## 0.3.3 — 2026-09-24

- Aceito o Harness 0.1.7-rc.2 (dsh-v0.1.7-rc.2, 477b4f420553e8a52c2fbccc464d7561b239c443). O intervalo peer segue >=0.1.7-rc.1 <0.1.8.
- conversation.chat.turnTail continua um slot de lista. A nova entrada de fila schedule-created e a vista de ferramenta schedule_update são registros oficiais adicionais, espelhados pelos assentos existentes.
- O contexto de mudança de ferramentas para desenvolvedores (tool-addition / tool-removal) usa o título e a contagem oficiais em vez de uma linha de injeção genérica.
- Imagens Markdown locais aceitam a rota de arquivo do Desktop dsh-app://app/api/file.

## 0.3.2 — 2026-09-24

- Completado o contrato de tempo de execução da ponte oficial 0.1.7-rc.1: as vistas de ferramentas recebem phase/useDisclosure/hookContext{callId} e os nós de chat passam ao store de snapshot {turnData, disclosureReset}; corrige as vistas de ferramentas oficiais caindo em silêncio no fallback no host real.
- Frestas de pintura nas faixas coladas da zona recolhida: a faixa só pintava o fundo sólido da própria caixa; o vão de 14px do .turn, o padding de 16px da célula anterior e a faixa reservada --reader-control-width à direita da faixa de estado deixavam conteúdo vazar ao rolar; substituído por box-shadow da mesma cor repintando para cima/para a direita numa banda contínua.

## 0.3.1 — 2026-09-24

- Aceito o Harness 0.1.7-rc.1. O intervalo peer é >=0.1.7-rc.1 <0.1.8.
- conversation.chat.turnTail é um slot de lista. A expectativa antiga de corrente lançava exceção no arranque do cliente e deixava a página em Failed to load plugins.
- Os imports de ícones usam os nomes de peso do rc.1 (IconBrowseOutlineRegular e o resto). O tamanho continua prop.
- A confirmação pendente agora lê useSessionStatus (pendingInteraction). O hook removido useSessionPendingInteraction lançava assim que o reader pintava.
- Os rótulos de código e terminal incluem os campos de toolbar do rc.1 (codeLabel, wrap e noExitCode).

## 0.3.0 — 2026-09-21

- Corrigido o problema em que, após desligar o recolhimento automático e ver os detalhes do processo, religar não recolhia mais; religar restaura as regras de recolhimento automático preservando a proteção de seleção de texto e as expandições manuais posteriores.
- Integram-se no layout de leitura existente as renderizações oficiais de feedback, detalhes de ferramenta, cartões explícitos de entregáveis, comandos e nós desconhecidos; o renderizador oficial cuida de injeção, tradução, store e sub-slots.
- Removidas a chamada direta dos componentes de ferramenta e a lógica de expandir por clique simulado; mantidos os resumos, recolhimentos, animações e ações rápidas de arquivos existentes.
- Integrado o serviço oficial de links de arquivo, com passagem dos números de linha das ferramentas e complementação das imagens Markdown locais do RC2 e da degradação por falha de carga.
- Corrigida a colagem do acompanhamento de cauda ao rolar e unificadas as posições da faixa da coluna de leitura e da zona colada.
- Resultados do interpretador de código exibidos como saída de terminal, com linhas de contexto compatíveis com provenance e producer.
- Adicionados testes de integração reproduzíveis dos componentes oficiais, regressões de interação do recolhimento automático e checagem de compatibilidade de upgrades do Harness; dependências alinhadas ao Harness 0.1.5-rc.2.
- Escopo de design, fronteiras de interface e módulos a convergir: veja docs/official-rendering-bridge.md.

## 0.2.1 — 2026-09-20

### Corregido

- As faixas fixas do reader não pintam mais sobre o composer. A linha de estado ao vivo (执行过程 / 正在使用工具) ficava colada no topo do scrollport com z-index: 8, enquanto o assento colado do composer do host possui z-index: 7 e nada entre o reader e o body cria contexto de empilhamento. Um reader rolando comprimia cada faixa colada de nível de rodada para dentro da banda do rodapé — a faixa para na borda inferior do seu bloco contêiner, que passa atrás do cartão de entrada — e assim o reader pintava sua própria placa opaca sobre o composer. A faixa de estado ao vivo agora possui a faixa medida sob a barra de ferramentas, exatamente como as linhas de resumo fechadas, em vez de compartilhar a da barra; as faixas que um scroll pode comprimir na banda do rodapé ficam abaixo do assento do composer (z-index 6), e só a faixa da barra do topo conserva 7, o que também a mantém acima dos banners dos blocos de código do host. O modo skin não carrega mais uma segunda escada de faixas própria. tests/footer-precedence.test.ts protege a escada na folha de código-fonte e no bundle commitado.

## 0.2.0 — 2026-09-30 (adaptação à linha de host 0.2.0)

- 12 peers @deepseek-ai/dsh-* promovidos a >=0.2.0-rc.1 <0.2.1-0; devDependencies à 0.2.0-rc.2; pnpm-lock.yaml removido (npm é o único gerenciador de pacotes, package-lock.json no repositório).
- Baseline da porta renovada: compat/harness-020rc2.json (host 0.2.0-rc.2; 74 registros oficiais sem alteração, 14 de 18 arquivos-âncora idênticos byte a byte).
- Revisão da deriva do host 0.2.0 (scoped-slots useMemoizados / contrato ui-tool só acrescenta userQuestionPanels / MessageItem TextShimmer / TurnProcessNodeView sem relógio ao vivo): as quatro são semântica de chamador no plugin, **zero mudanças de código-fonte**. O servidor de fixtures serve /favicon.ico com 204 e registra requisições não correspondidas (primeira baseline de fixture headless nesta máquina).

## 0.2.0 — 2026-09-18

### Revisão de diffs e apresentação de ferramentas

- Painel de revisão de diffs reengenheirado: as estatísticas de linhas adicionadas/removidas (+A -R) vão coladas à margem direita, perfeitamente alinhadas à mesma linha base de 32px do texto-resumo. A sobreposição de diff expande com limpeza dentro da coluna de leitura (0px de transbordamento horizontal) com rolagem vertical independente (max-height: 420px; overscroll-behavior: contain), sem deixar a roda do mouse vazar para o fluxo da conversa. As abas de múltiplos arquivos rolam na horizontal com altura de conteúdo adaptativa ao trocar de arquivo. Os cartões de ferramenta customizados do PR #12 delegam a renderização da vista de ferramenta ao slot tool.call.toolview com isolamento por error boundary e autoexpansão.

### Vidro fosco translúcido e modo skin

- O modo de vidro fosco translúcido é uma chave opcional nos Ajustes; ligado, todos os fundos de cartões, molduras de detalhes de ferramenta e blocos de código ficam translúcidos com desfoque de fundo, eliminando manchas brancas opacas e se adaptando sem emenda a papéis de parede e skins de janela de terceiros.

### Refinamento do recolhimento e vivacidade

- Volta a um único interruptor intuitivo de recolhimento automático (自动折叠开 / 关) na barra de leitura e nos Ajustes, removendo as regras multinível complexas, mas mantendo raciocínio e ferramentas totalmente expandidos quando desligado. Corrigido o bug de quebra de linha para as linhas-resumo ficarem estritamente de uma linha quando há espaço.
- Os relógios de espera em tempo real (WaitClock), a contagem de tempo de execução e as métricas de throughput de tokens (TurnMetrics) seguem preservados e ativos por completo; as revelações animadas incluem timeouts de fallback contra travamentos de renderização.

### Ajustes do Tidy Display

- Vidro, recolhimento automático e modo de abertura de entregáveis compartilham o store raiz dsh.reader.v1, mantendo Ajustes e vista de leitura sincronizados entre recarregamentos.
- Modo de abertura de entregáveis: aplicativo do sistema por padrão, Sidebar opcional; pasta/revelar continuam no SO. Detecção da instalação do pacote de skills generative-mcpapps e relatório de estado.

### Compatibilidade e vivacidade

- A espera agora reinicia quando uma ferramenta devolve. O conjunto de repasse nomeava tipos do contrato de conversa (tool-result) enquanto o reader comparava contra os tipos da camada de chat, onde uma ferramenta devolvida é a linha tool-call cujo data.root traz o resultado; nenhum nó jamais teve o nome antigo — o ramo estava morto e uma ferramenta devolvida nunca reiniciava o relógio. O conjunto e cada tipo sobre que raciocina agora são tipados contra a própria união de tipos do host: um nome errado falha no tsc em vez de em silêncio no runtime, e uma ferramenta ainda em execução explicitamente não é espera.
- A coreografia de recolhimento não pode mais travar. Cada fase avança por promessas de animação e quadros renderizados, e uma animação cancelada rejeita enquanto uma aba oculta não entrega quadros — ambas deixavam a máquina para sempre numa fase não-ociosa, que segurava a fonte de quadros no snapshot exibido e pausava a revelação do texto, e a rodada parecia travada até remontar a vista. Cada fase ganha também um prazo de relógio de parede que força a próxima. Enquanto a coreografia segura a revelação, o buffer do fluxo continua absorvendo a fonte em vez de sair cedo, e o texto nunca retoma de um alvo rancio depois de assentado o recolhimento. O estado mostra quantos subagentes a rodada despachou, lido da própria linha turn-process do host em vez de recontado aqui.
- Retirado o ramo de renderização command-input: essa string não é tipo de nó de chat em host publicado algum; só fazia o arquivo parecer tratar um caso impossível. Toda revelação animada recebe prazo de relógio de parede: fill: both fixa o keyframe de abertura, e uma Web Animation que nunca chega a onfinish (cancelada, desmontada ou ignorada pelo compositor) deixava a linha no DOM com altura e opacidade zero — clicar não fazia nada.
- Acrescentada uma seção de ajustes do Tidy Display: entregáveis abrem por padrão no aplicativo do sistema, com pré-visualização opcional na Sidebar direita, além de detecção da raiz de skills generative-mcpapps e guia de instalação. Blindados os ecos de imagens de envios pendentes para um envio só de texto não quebrar o conversation.view (images / attachments podem faltar). A guia de instalação nomeia só raízes relativas convencionais (.dsh/skills, .agents/skills) e nunca imprime o home do host nem caminhos absolutos de pacotes de plugins.

### Leitura e recolhimento

- Um passo de raciocínio posterior só recolhe a série de processo encerrada que o segue; a série ainda em streaming fica totalmente expandida, de modo que uma rodada longa se lê como alternância de resumos e prosa em vez de recolher no meio do pensamento.
- A intensidade de recolhimento 2 (过程摘要) é o modo somente-processo do PR #14: a prosa nunca é recolhida; cada série encerrada de raciocínio / ferramenta / registro se recolhe num resumo que nomeia o que as ferramentas fizeram de fato (读取 Reader.tsx, 运行 pnpm test), lido da mesma identidade de ferramenta dos cartões. Não é o padrão — o recolhimento padrão (nível 1) mantém a coreografia do main atual. Uma rodada somente-processo encerrada também recolhe sua série final e pula a linha duplicada de contador de rodada fechada.

### Superfície de leitura

- Com o vidro fosco ligado, as faixas coladas usam o mesmo vidro líquido do painel dsh-auto-memory: wash translúcido bg-layer-2, blur(28px), borda capilar, raio 16px e elevação suave; os chips de detalhe ficam transparentes até hover ou foco. Com a chave desligada o acabamento coincide com o main atual.
- A barra reserva a largura de todo o seu grupo de controles; medir só o primeiro botão deixava a faixa de estado pintar sobre todos os controles seguintes.
- O separador de compactação agora chega em vez de simplesmente aparecer: a linha varre do centro, a pílula se assenta e o dial gira uma vez — gated por data-motion=off e prefers-reduced-motion como toda transição.

### Revisão de diffs

- As contagens de linhas modificadas vêm do resultado de ferramenta que o host já anexa (meta.diffs, { path, oldText, newText }), com recuo aos argumentos da própria chamada para write / edit / str_replace_editor quando um build do host não os envia. A lista branca de nomes importa: várias ferramentas sem relação têm um campo content, e contá-los inventava adições para chamadas que não mudaram arquivo algum.
- As chamadas filhas de uma chamada pai são recolhidas nas suas próprias contagens. Um run_code que escreve arquivos reporta o que seus filhos mudaram, não o que seus argumentos contêm, e uma execução cujas edições ficam um nível abaixo não perde mais as contagens; cada filho contribui pelos próprios argumentos, lidos do resultado recebido ou da chamada pendente.
- +N -M fica no fim da linha em verde/vermelho e abre um painel com uma entrada por arquivo modificado — abas de arquivos, linhas removidas sobre wash vermelho e adicionadas sobre verde, com a mesma primitiva DiffBlock da linha de ferramenta oficial. O painel está no fluxo, nunca é popup flutuante, e o overflow: clip da célula de fluxo não pode cortá-lo. Abrir e fechar anima a altura real na linguagem de movimento do plugin, o cartão volta à vista quando abre abaixo da dobra, e um painel aberto mantém o cursor aceso.

### Espera e cronometragem

- Mostra-se há quanto tempo o modelo está com a rodada, ao lado de 深度求索中 e do indicador de espera no fluxo. O relógio se ancora no último evento que passou o controle ao modelo — uma ferramenta devolvida, um contexto injetado, um comando executado, a própria mensagem do usuário — nunca no início da rodada, para uma espera recém-começada não herdar os minutos que as ferramentas já gastaram.
- Passados dez segundos a leitura ganha um badge 暂未响应, e no instante em que o modelo produz seu primeiro bloco o indicador inteiro se retira. Uma ferramenta em execução não é espera: quem trabalha é a ferramenta. Um comando longo conserva a duração após devolver (cor de aviso passados dez segundos); um rápido não mostra nada ao terminar; os passos em execução mostram contagem de segundos ao vivo e um resumo cintilante enquanto trabalham.

### Rolagem

- O acompanhamento de cauda só se descola num movimento real para cima do reader; o crescimento do conteúdo e a própria suavização do acompanhamento também movem o scrollTop, e ler isso como «o usuário saiu do fundo» congelava o acompanhamento no meio da rodada.
- Desativado o scroll anchoring do navegador no scroller da conversa enquanto o reader está montado: ele mexia o viewport sozinho à medida que a transcrição crescia. Só um campo de texto em foco suspende o acompanhamento, e só dentro do reader — focar o composer costumava parar a transcrição.
- O fluxo avança no ritmo próprio da fonte: um termo feed-forward estimado da taxa de chegada soma ao controlador proporcional. Uma revelação puramente proporcional se estabilizava num atraso constante catchUpMs independente da velocidade do modelo, o que se lia como 慢 enquanto a fila crescia com modelos rápidos; o feed-forward drena a fila e o proporcional absorve o jitter do transporte.
- Revela um lote de palavras num único relógio em vez de uma palavra por intervalo fixo; o espaçamento por palavra fixava o ritmo perto de 16 palavras/s, então até um modelo rápido chegava palavra a palavra — agora um lote cai numa janela curta, enquanto uma palavra solitária mantém a cadência original de digitação. O painel de raciocínio acompanha a própria fila em vez de passo-e-pausa fixos: andava duas linhas a cada ~1,3 s qualquer que fosse a velocidade de chegada, e era isso que fazia o painel parecer atrasado num modelo rápido.

### Ganchos de DOM do host

- Mantido o gancho data-chat-flow="" do ChatView na coluna do Reader, para que skins que escondem [data-composer-seat] quando o scrollport não tem chat-flow (maid-atelier, phoebe-atelier e outras) continuem mostrando o composer na vista de leitura.

## 0.1.1 — 2026-09-16

A integração aceita da vista de leitura, incluindo o trabalho consolidado dos PR #2, #5 e #8. Os cabeçalhos 0.2.0 / 0.2.1 anteriores eram notas de desenvolvimento não publicadas; essas mudanças vêm nesta versão, não como versões publicadas separadas.

### Leitura e recolhimento

- Um passo de raciocínio posterior pode recolher os passos anteriores da sua cadeia num resumo compacto de contagem; atualizações só de corpo/ferramenta não disparam o recolhimento, e a entrada de usuário/steering reinicia a cadeia. O controle de recolhimento automático pode desativar esta apresentação.
- As linhas com chave estável encolhem antes de os contadores atualizarem, pausam um instante e então revelam a saída em buffer — preservando a ordem da fonte, o texto selecionado, o comportamento de movimento reduzido e a resposta final visível. As estatísticas de processo sobrevivem ao fim da rodada; passos ocultos vazios não acumulam mais vãos de 16px em rodadas longas encerradas.
- O controle de recolhimento automático ganha uma faixa de largura plena sem emendas, sem linhas divisoras nem sombras de substituição; as estatísticas ficam no fluxo normal até o topo e então colam sob a faixa de estado medida, expandidas ou recolhidas. Rótulos de estado curtos continuam legíveis em vez de truncar; o tempo de espera reinicia no último envio de usuário/steering em vez de herdar a hora original de início da rodada.

### Navegação e paridade nativa

- Mantido o TimelineRail mais recente, com carregamento incremental do histórico, métricas por rodada, suporte a forks e aterrissagem segura ao composer; rola-se o contêiner da conversa, não caixas ancestrais sem relação.
- Pulas os cartões JSON turn-process sintéticos do host; a entrada do comando /goal é renderizada como texto rotulado; os detalhes do system prompt ganham scrollport próprio.
- Usa-se o chevron compacto de voltar-ao-fundo no limiar quase-fundo nativo, com coalescência das capturas de âncora de rolagem; mostram-se os controles de hora/cópia das mensagens do usuário e a duração ao fim da rodada, adiando as linhas de arquivos produzidos até o fechamento da rodada.

### Conteúdo interativo

- MCP Apps generativos renderizados de cercas de código suportadas, blocos customizados e resultados de ferramenta por iframe isolado (sandbox="allow-scripts allow-forms", sem allow-same-origin).
- Suporte à inicialização JSON-RPC da SEP-1865, dimensionamento, atualizações de contexto e feedback de prompts para o composer, com sincronização claro/escuro e autoaltura limitada.
- Incluído o pacote de skills generative-mcpapps, exemplos e documentação bilíngue.

### Distribuição e verificação

- Mira o DeepSeek Harness 0.1.5-rc.2 por pontos de extensão públicos de plugin/cliente. Sem mudanças em Agent, SDK, provedores, credenciais nem no núcleo do Harness.
- Entregue o patch de bundle de instalação padrão e a lib/ reconstruída e commitada, com declarações; a instalação git/tarball não precisa de prepare.
- Adicionadas regressões unitárias de ordem/timing do recolhimento e do relógio de steering, mais fixtures de navegador com componentes reais para movimento, 500 linhas ocultas, estatísticas coladas/com quebra de linha e reinícios do relógio de espera.

## 0.1.0

Primeira publicação pública do plugin de vista de leitura aceito, publicado como dsh-tidy-display.

- Contexto nativo e detalhes de ferramenta com raciocínio ordenado pela fonte e sem modificação.
- Cartões de raciocínio longo com limite, acompanhamento de duas linhas, acompanhamento expandido e pausa/retomada manuais.
- Recolhimento de processo em rodadas bem-sucedidas com resposta final separada.
- Revelação de texto ordenada pela fonte e um brilho discreto de estado ocupado.
- Tipografia de estado estável e espaçamento compacto de revelações.
- Fallbacks de conteúdo nativo e um slot de extensão de blocos para plugins confiáveis.
- 42 testes de regressão; sem mudanças no Agent do DSH, no SDK, nos provedores ou no núcleo.
