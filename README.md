# Cloud & Infra Roadmap 4.1 — Tracker

Aplicação web estática que reproduz integralmente o **Cloud & Infra Roadmap 4.1** (21/09/2026 — 31/03/2027) com checklists interativas e progresso persistido no navegador.

- Sem backend, sem framework, sem build — HTML + CSS + JavaScript puro.
- Fonte de verdade: o PDF original do roadmap (os textos do PDF prevalecem sobre paráfrases do SDD — ver [Notas de fidelidade](#notas-de-fidelidade)).
- Idioma: português brasileiro.

## Estrutura

```text
cloud-infra-roadmap/
├── index.html        # casca semântica (header, nav, seções, footer)
├── style.css         # identidade visual (paleta terrosa/verde-musgo, mobile-first, a11y)
├── script.js         # renderização, checklists, progresso, sync com GitHub Gist
├── data/
│   ├── roadmap.js    # conteúdo integral estruturado (7 etapas, 30 blocos, 69 atividades)
│   └── progress.js   # configuração pública do dono (owner, gistUser, gistId)
├── tests/
│   └── test-app.js   # harness jsdom (npm test)
├── _headers          # headers de segurança para Cloudflare Pages
├── deploy.sh         # publicação via wrangler (opcional)
└── package.json      # scripts npm test / npm start
```

## Executar localmente

Abra `index.html` direto no navegador — funciona, sem etapa de build.

Para um servidor local (recomendado, evita diferenças de comportamento entre `file://` e hospedagem):

```bash
python3 -m http.server 8080
# ou: npx serve .
```

Acesse `http://localhost:8080`.

## Funcionalidades

- **Hero de progresso** (primeiro bloco após a nav): anel SVG com a porcentagem, contadores "X de 69 atividades" e "X de 7 etapas", mini-barra fixa na navegação (sempre visível) e **Próxima ação** — card que aponta a primeira task pendente com botão "Ir para a tarefa" (rola até ela, expande o bloco e foca o checkbox).
- **Chips por etapa**: 7 atalhos com número, barra e status (A fazer / Em andamento / Concluída), em ritmo alternado musgo/terracota.
- **"Sobre este roadmap"**: nota, "Como utilizar", ritmo e tabela de competências ficam num painel expansível abaixo do hero, para não poluir a primeira dobra.
- **Checklists interativas**: 69 atividades marcáveis (itens "Faça" dos blocos). Os 4 itens de restrição do roadmap aparecem como *Observação* não-marcável.
- **Blocos expansíveis** (`details`/`summary`) com botões "Expandir/recolher todos" (global e por etapa).
- **Checkpoint final independente**: 11 competências com estado próprio — marcar o checkpoint não afeta as atividades semanais, e vice-versa.
- **Progresso sincronizado (GitHub Gist)**: seu progresso fica num gist e é lido a cada visita. Você marca as atividades com o token destravado e cada mudança é enviada ao gist sozinha (debounce + indicador "Salvando…/Salvo"). Nada de `git push` para atualizar o progresso.
- **Materiais**: links para as páginas oficiais embutidas no PDF original, validados.
- **Site público somente leitura**: o objetivo é as pessoas **verem o seu progresso**, não editarem o delas. A URL principal é **sempre somente leitura** (mesmo sem progresso publicado ou se o gist estiver fora do ar), com checkboxes desabilitados e sem botões de ação. Só você, com `#edit=<token>`, entra no modo de edição.
- **Compartilhar progresso (instantâneo)**: o botão "Compartilhar meu progresso" gera um link com o estado atual codificado no hash da URL (`#s=…`). Quem abrir vê exatamente esse progresso, em **modo somente leitura** (com aviso e data do instantâneo).

## Três modos de exibição

| Modo | Como entra | O que mostra |
| --- | --- | --- |
| Visitante (padrão) | URL normal, sem hash | Progresso lido do gist, **somente leitura** |
| Snapshot avulso | URL com `#s=…` | Progresso congelado no link, **somente leitura** |
| Edição (dono) | URL com `#edit=<token>` válido | Tracker editável, sincronizado com o gist |

O token nunca vai para o repositório: ele é digitado via `#edit=` (validado por uma leitura autenticada) e fica salvo no `localStorage` do seu navegador, para não redigitar a cada visita.

## Publicar seu progresso (fluxo do dono)

1. **Uma vez** — crie um **gist** (pode ser secreto) contendo um arquivo `progress.json` com o conteúdo inicial `{}`.
2. **Uma vez** — crie um **token fine-grained** do GitHub com a permissão **Gists: read and write** (ou um token clássico com escopo `gist`).
3. Preencha `data/progress.js` com seu usuário e o ID do gist:
   ```js
   window.OWNER_PROGRESS = {
     owner: "Seu Nome",
     gistUser: "seu-usuario-github",
     gistId: "id-do-gist",
     gistFile: "progress.json"
   };
   ```
   Faça o `git push` (só dessa configuração; não precisa repetir para o progresso).
4. Abra o site com `#edit=<TOKEN>` (ex.: `https://llicels.github.io/cloud-infra-roadmap/#edit=…`) e cole o token uma vez.
5. Marque suas atividades — elas são enviadas ao gist automaticamente. Quem abrir a URL normal vê o progresso atualizado, somente leitura.

> O ID do gist é público (aparece no código) e tudo bem: a leitura é pública de propósito. O token é o único segredo.

### Contraste

A paleta base do SDD (§2.2) foi mantida, mas os tokens de apoio foram escurecidos para atender WCAG AA com folga e dar corpo visual: `--color-muted` `#5B5E53` (~6,4:1), `--color-sand` `#C9BFA6`, `--color-border` `#C2C0A9`. Adicionados `--color-terra-strong` `#7A5233` (texto/acento terracota) e `--color-ink` `#23261F` (números). O terracota só aparece na espinha de etapas pares, numeração alternada e marcadores — o progresso permanece 100% verde-musgo.

### Regra de cálculo do progresso (SDD §8.5)

- **Progresso geral** = atividades (`type:"task"`) concluídas ÷ total de atividades do roadmap (69), exibido como `X de 69 atividades concluídas (P%)` com `P = floor(done/total*100)`.
- O **checkpoint final é excluído** do cálculo geral (evita dupla contagem) e os itens de observação **nunca** contam.
- **Progresso por etapa** considera apenas as atividades da própria etapa; uma etapa está concluída quando todas as atividades dela estão marcadas.
- Nenhuma etapa é classificada como "atrasada" com base na data — datas são apenas informativas.

## Testes

```bash
cd cloud-infra-roadmap/
npm install
npm test        # node tests/test-app.js — 75 asserções em jsdom
```

O harness (com `fetch` mockado) cobre: contagens (7 etapas / 30 blocos / 69 atividades + 4 observações / 11 checkpoint / 10 materiais), cálculo de progresso geral/etapa, classe `done` + badge "Concluída", `rel="noopener noreferrer"` em links externos, labels associados aos checkboxes, conteúdo obrigatório do roadmap e os **três modos**: visitante somente leitura (lendo o gist), edição destravada por token válido (com envio PATCH ao gist e indicador "Salvo"), token inválido/sem configuração (permanece leitura) e snapshot `#s=`.

## Site publicado

**https://llicels.github.io/cloud-infra-roadmap/** — hospedado no GitHub Pages (branch `main`, pasta raiz, sem build). Qualquer `git push` no `main` republica automaticamente em ~1 minuto.

## Publicar (deploy gratuito)

A aplicação é 100% estática. A opção recomendada é o **Cloudflare Pages** (plano gratuito, HTTPS, domínios `.pages.dev`):

### Opção A — Upload direto (mais rápida, ~1 minuto)

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Arraste a pasta do projeto (ou o conteúdo dela) e publique.
3. Endereço final: `https://<nome-do-projeto>.pages.dev`.

### Opção B — Wrangler CLI (script pronto)

```bash
cd cloud-infra-roadmap/
npx wrangler login          # abre o navegador para autorizar (uma vez)
./deploy.sh                 # equivale a: npx wrangler pages deploy . --project-name cloud-infra-roadmap
```

Com CI/token (sem navegador interativo):

```bash
export CLOUDFLARE_API_TOKEN=<seu token>
export CLOUDFLARE_ACCOUNT_ID=<seu account id>
npx wrangler pages deploy . --project-name cloud-infra-roadmap
```

O arquivo `_headers` aplica CSP (incluindo `connect-src` para `api.github.com` e `gist.githubusercontent.com`), `nosniff`, referrer e permissions policies automaticamente no Cloudflare Pages. O GitHub Pages ignora `_headers`.

### Opção C — Vercel

```bash
npx vercel --prod
```

(Nenhuma configuração necessária: detecta site estático.)

### Depois de publicar

- Teste a URL normal em **janela anônima**: você deve ver seu progresso, tudo desabilitado (somente leitura).
- Abra com `#edit=<token>`, marque uma atividade e confirme o indicador "Salvo".
- Valide alguns links de materiais.


## Segurança e privacidade

- Nenhum segredo no código: o token é digitado via `#edit=` e guardado apenas no `localStorage` do seu navegador. O repositório tem só dados públicos (`owner`, `gistUser`, `gistId`).
- O progresso vive no seu **gist** (leitura pública por design) e é atualizado só por quem tem o token. Visitantes apenas leem.
- Em site estático público não há autenticação de servidor: a barreira de escrita é o token do GitHub. Se ele vazar, alguém pode sobrescrever seu progresso — revogue/rotacione o token se isso acontecer.
- Sem analytics, sem cookies, sem scripts de terceiros (só chamadas `fetch` ao GitHub).
- Links externos abrem com `rel="noopener noreferrer"`; apenas URLs `https:` dos dados são renderizadas como link.

## Notas de fidelidade

- O conteúdo segue o **PDF original** nas divergências em relação ao SDD: critérios "Pronto quando" na primeira pessoa ("Consigo…"), objetivos das etapas 1 e 3–7 e frases do "Como utilizar". A tagline da capa foi removida a pedido do dono do roadmap.
- Frases decorativas/infantis do rodapé do PDF foram **omitidas de propósito** (SDD §2.1 exige interface sóbria).
- Um link do PDF (`docs.gns3.com/docs/`, 404) foi corrigido para a raiz oficial `docs.gns3.com`; os demais 21 URLs foram validados (HTTP 200).
- O roadmap não foi alterado: nada foi acrescentado, antecipado ou tornado obrigatório.

## Limitações conhecidas

- Leitura pública usa a API do GitHub (limite ~60 req/h por IP) com fallback para o `raw` (CDN, pode ficar alguns minutos em cache). Para site pessoal é folgado.
- Para editar em outro dispositivo, é preciso abrir `#edit=<token>` uma vez nele (o token fica salvo por navegador).
- Se o gist estiver indisponível, visitantes veem 0% (somente leitura) — nunca editável.
- Sem botão de reset (deliberado, SDD §10) — para zerar, desmarque as atividades ou esvazie o gist.
- `localStorage` indisponível (modo privado restrito): o dono edita só na sessão e o envio ao gist continua funcionando durante ela.
