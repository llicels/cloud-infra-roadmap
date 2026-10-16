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
├── script.js         # renderização, checklists, progresso, persistência
├── data/
│   └── roadmap.js    # conteúdo integral estruturado (7 etapas, 30 blocos, 69 atividades)
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

- **Checklists interativas**: 69 atividades marcáveis (itens "Faça" dos blocos). Os 4 itens de restrição do roadmap aparecem como *Observação* não-marcável.
- **Progresso geral e por etapa**: atualizado imediatamente ao marcar/desmarcar.
- **Blocos expansíveis** (`details`/`summary`) com botões "Expandir/recolher todos" (global e por etapa).
- **Checkpoint final independente**: 11 competências com estado próprio — marcar o checkpoint não afeta as atividades semanais, e vice-versa.
- **Persistência** em `localStorage` (chave `cloud-infra-roadmap-v1`), com recuperação após recarregar ou reabrir.
- **Materiais**: links para as páginas oficiais embutidas no PDF original, validados.

### Regra de cálculo do progresso (SDD §8.5)

- **Progresso geral** = atividades (`type:"task"`) concluídas ÷ total de atividades do roadmap (69), exibido como `X de 69 atividades concluídas (P%)` com `P = floor(done/total*100)`.
- O **checkpoint final é excluído** do cálculo geral (evita dupla contagem) e os itens de observação **nunca** contam.
- **Progresso por etapa** considera apenas as atividades da própria etapa; uma etapa está concluída quando todas as atividades dela estão marcadas.
- Nenhuma etapa é classificada como "atrasada" com base na data — datas são apenas informativas.

## Testes

```bash
cd cloud-infra-roadmap/
npm install
npm test        # node tests/test-app.js — 34 asserções em jsdom
```

O harness cobre: contagens (7 etapas / 30 blocos / 69 atividades + 4 observações / 11 checkpoint / 10 materiais), cálculo de progresso geral/etapa/bloco, classe `done` + badge "Concluída", persistência e restauração via `localStorage`, tolerância a JSON corrompido, `rel="noopener noreferrer"` em links externos, labels associados aos checkboxes e conteúdo obrigatório do roadmap.

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

O arquivo `_headers` aplica CSP, `nosniff`, referrer e permissions policies automaticamente no Cloudflare Pages.

### Opção C — Vercel

```bash
npx vercel --prod
```

(Nenhuma configuração necessária: detecta site estático.)

### Depois de publicar

- Teste em **janela anônima**.
- Marque uma atividade, **recarregue** e confirme a persistência (o progresso é por dispositivo/navegador).
- Valide alguns links de materiais.

## Segurança e privacidade

- Nenhum segredo, credencial ou dado pessoal no código.
- O progresso fica **somente no navegador** do usuário (localStorage), não é sincronizado nem visível para outras pessoas — mesmo no site publicado.
- Sem analytics, sem scripts de terceiros, sem cookies.
- Links externos abrem com `rel="noopener noreferrer"`; apenas URLs `https:` dos dados são renderizadas como link.

## Notas de fidelidade

- O conteúdo segue o **PDF original** nas divergências em relação ao SDD: critérios "Pronto quando" na primeira pessoa ("Consigo…"), tagline da capa, objetivos das etapas 1 e 3–7 e frases do "Como utilizar".
- Frases decorativas/infantis do rodapé do PDF foram **omitidas de propósito** (SDD §2.1 exige interface sóbria).
- Um link do PDF (`docs.gns3.com/docs/`, 404) foi corrigido para a raiz oficial `docs.gns3.com`; os demais 21 URLs foram validados (HTTP 200).
- O roadmap não foi alterado: nada foi acrescentado, antecipado ou tornado obrigatório.

## Limitações conhecidas

- Persistência local por navegador: trocar de dispositivo/navegador zera o progresso aparente.
- Sem botão de reset (deliberado, SDD §10) — para zerar, limpe os dados do site no navegador.
- `localStorage` indisponível (modo privado restrito): o app funciona na sessão e avisa discretamente no rodapé.
