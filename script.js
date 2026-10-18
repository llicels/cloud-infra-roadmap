/**
 * Cloud & Infra Roadmap 4.1 — script.js (Agente C)
 * Renderização, checklist, progresso e persistência. Contrato: CONTRACT.md §6.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cloud-infra-roadmap-v1';
  const TOKEN_KEY = 'cloud-infra-roadmap-token';
  const STORAGE_VERSION = 1;
  const UNAVAILABLE_NOTE = 'Não foi possível salvar localmente neste navegador. O progresso vale apenas nesta sessão.';
  const GIST_API = 'https://api.github.com/gists/';
  const GIST_RAW = 'https://gist.githubusercontent.com/';

  /**
   * Modos de exibição:
   * - 'edit'  : editável — dono destravado (token no #edit= ou salvo no navegador).
   * - 'share' : instantâneo avulso via #s=… — somente leitura.
   * - 'owner' : progresso lido do GitHub Gist — somente leitura (padrão p/ visitantes).
   * A URL pública é SEMPRE somente leitura; editar só com o token do dono.
   */
  let mode = 'owner';

  let data = null;
  let index = null;
  let storageAvailable = true;
  let viewMode = true; // modo somente leitura ('share' ou 'owner') — não persiste
  let token = null;     // token do gist (só quando destravado)
  let pushTimer = null; // debounce do envio ao gist
  let statusEl = null;  // indicador "salvando/salvo" no modo edição

  const state = { tasks: {}, checkpoint: {} };

  const ui = {
    steps: {},
    blocks: [],
    stages: [],
    chips: [],
    nextBox: null,
    ring: null,
    heroSub: null,
    heroStages: null,
    navFill: null,
    navText: null,
    toggleLabels: []
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;

  /**
   * Regra de cálculo de progresso (SDD §8.5 — requisito de documentação):
   *
   * 1. PROGRESSO GERAL = somente steps com type:"task" concluídos, sobre o total de tasks
   *    do roadmap (69). O checkpoint final é EXCLUÍDO do total geral (estado totalmente
   *    independente, IDs ckpt-* — evita dupla contagem) e os steps type:"note" NUNCA contam
   *    como atividade (são observações não marcáveis).
   * 2. PROGRESSO POR ETAPA = apenas as tasks daquela etapa (isolado). Etapa concluída =
   *    todas as tasks dela concluídas.
   * 3. PROGRESSO POR BLOCO = tasks do bloco; o badge do resumo mostra "n/total".
   *    Um bloco só é concluído pelas próprias tasks, nunca por marcar itens de outros blocos.
   * 4. PORCENTAGEM = Math.floor(done / total * 100).
   * 5. Uma etapa NUNCA é classificada como atrasada com base na data — datas são só
   *    informação textual (SDD §8.2/§8.5).
   */
  function progressOf(taskIds) {
    const total = taskIds.length;
    let done = 0;
    for (let i = 0; i < total; i += 1) {
      if (state.tasks[taskIds[i]] === true) {
        done += 1;
      }
    }
    const pct = total === 0 ? 0 : Math.floor((done / total) * 100);
    return { done: done, total: total, pct: pct };
  }

  /** Cria um elemento. Texto SEMPRE via textContent/createTextNode (nunca innerHTML com dados). */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        const value = attrs[key];
        if (value === null || value === undefined || value === false) {
          return;
        }
        if (key === 'class') {
          node.className = value;
        } else if (key === 'text') {
          node.textContent = String(value);
        } else {
          node.setAttribute(key, value === true ? '' : String(value));
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) {
        return;
      }
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Sanitiza URL de dados: aceita apenas https absoluto (defesa contra javascript:/data:). */
  function safeUrl(u) {
    return typeof u === 'string' && /^https:\/\//i.test(u) && !/^https:\/\/\/|\s/.test(u) ? u : null;
  }

  function blockField(labelText, contentNode) {    if (!contentNode) {
      return null;
    }
    return el('div', { class: 'block-field' }, [
      el('span', { class: 'block-field-label', text: labelText }),
      contentNode
    ]);
  }

  function makeProgressBar(label, max) {
    const fill = el('div', { class: 'progress-fill' });
    const bar = el('div', {
      class: 'progress-bar',
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': 0
    }, [fill]);
    return { node: bar, fill: fill };
  }

  function setProgress(barNode, fillNode, p) {
    barNode.setAttribute('aria-valuenow', String(p.done));
    barNode.setAttribute('aria-valuetext', p.done + ' de ' + p.total);
    fillNode.style.width = p.pct + '%';
  }

  /** Anel de progresso (SVG puro, sem dependências). */
  function makeRing(max) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'hero-ring');
    svg.setAttribute('role', 'progressbar');
    svg.setAttribute('aria-label', 'Progresso geral das atividades');
    svg.setAttribute('aria-valuemin', '0');
    svg.setAttribute('aria-valuemax', String(max));
    svg.setAttribute('aria-valuenow', '0');
    const track = document.createElementNS(SVG_NS, 'circle');
    track.setAttribute('class', 'ring-track');
    track.setAttribute('cx', '60');
    track.setAttribute('cy', '60');
    track.setAttribute('r', String(RING_R));
    const arc = document.createElementNS(SVG_NS, 'circle');
    arc.setAttribute('class', 'ring-arc');
    arc.setAttribute('cx', '60');
    arc.setAttribute('cy', '60');
    arc.setAttribute('r', String(RING_R));
    arc.setAttribute('stroke-dasharray', String(RING_C));
    arc.setAttribute('stroke-dashoffset', String(RING_C));
    arc.setAttribute('transform', 'rotate(-90 60 60)');
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'ring-label');
    label.setAttribute('x', '60');
    label.setAttribute('y', '60');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.textContent = '0%';
    svg.appendChild(track);
    svg.appendChild(arc);
    svg.appendChild(label);
    return { node: svg, arc: arc, label: label };
  }

  function setRing(ring, p) {
    ring.node.setAttribute('aria-valuenow', String(p.done));
    ring.node.setAttribute('aria-valuetext', p.done + ' de ' + p.total + ' atividades');
    ring.arc.setAttribute('stroke-dashoffset', String(RING_C * (1 - p.done / (p.total || 1))));
    ring.label.textContent = p.pct + '%';
  }

  /* ---------------- Persistência (CONTRACT.md §6) ---------------- */

  function readStored() {
    if (!storageAvailable) {
      return null;
    }
    let raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      storageAvailable = false;
      return null;
    }
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null; // JSON inválido: começar do zero, sem quebrar
    }
  }

  /** Monta o payload persistido (cache local e conteúdo do gist). */
  function buildPayload() {
    return {
      version: STORAGE_VERSION,
      tasks: state.tasks,
      checkpoint: state.checkpoint,
      updated: new Date().toISOString()
    };
  }

  /** Grava o cache local e agenda o envio ao gist (só no modo edição). */
  function save() {
    if (mode !== 'edit') {
      return; // visitante nunca persiste
    }
    const payload = buildPayload();
    if (storageAvailable) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        storageAvailable = false;
        updateFooterNote();
      }
    }
    schedulePush();
  }

  function hydrate(stored) {
    if (!stored || stored.version !== STORAGE_VERSION || typeof stored !== 'object') {
      return;
    }
    const storedTasks = stored.tasks && typeof stored.tasks === 'object' ? stored.tasks : {};
    Object.keys(storedTasks).forEach(function (id) {
      if (index.taskIds[id] === true && storedTasks[id] === true) {
        state.tasks[id] = true; // IDs inexistentes nos dados são ignorados
      }
    });
    const storedCkpt = stored.checkpoint && typeof stored.checkpoint === 'object' ? stored.checkpoint : {};
    Object.keys(storedCkpt).forEach(function (id) {
      if (index.ckptIds[id] === true && storedCkpt[id] === true) {
        state.checkpoint[id] = true;
      }
    });
  }

  function updateFooterNote() {
    const noteEl = document.getElementById('local-note');
    if (!noteEl) {
      return;
    }
    if (mode === 'owner') {
      noteEl.textContent = 'Progresso publicado pelo dono do roadmap — somente leitura, não editável.';
    } else if (mode === 'share') {
      noteEl.textContent = 'Instantâneo compartilhado — somente leitura, não editável.';
    } else if (storageAvailable && data && data.meta && data.meta.localNote) {
      noteEl.textContent = 'Progresso salvo no seu navegador e sincronizado com o GitHub Gist.';
    } else if (!storageAvailable) {
      noteEl.textContent = UNAVAILABLE_NOTE;
    }
  }

  /* ---------------- Dono: edição e sincronização via GitHub Gist ----------------
   * A URL pública é sempre somente leitura. Para editar, abra
   *   <site>/#edit=<token>
   * com um token fine-grained do GitHub ("Gists: read and write"). O token é
   * validado e guardado no seu navegador; cada marcação é enviada ao gist.
   * Só o token do dono escreve; visitantes apenas leem. */

  function ownerConfig() {
    const p = window.OWNER_PROGRESS;
    return p && typeof p === 'object' ? p : {};
  }

  function gistOwner() {
    const u = ownerConfig().owner;
    return typeof u === 'string' ? u.trim() : '';
  }

  function gistUser() {
    const u = ownerConfig().gistUser;
    return typeof u === 'string' ? u.trim() : '';
  }

  function gistId() {
    const id = ownerConfig().gistId;
    return typeof id === 'string' ? id.trim() : '';
  }

  function gistFile() {
    const f = ownerConfig().gistFile;
    return typeof f === 'string' && f.trim() ? f.trim() : 'progress.json';
  }

  function configured() {
    return Boolean(gistId() && gistUser());
  }

  function readEditToken() {
    const m = /[#&]edit=([A-Za-z0-9_-]+)/.exec(window.location.hash || '');
    return m ? m[1] : null;
  }

  function hasShareHash() {
    return /[#&]s=([A-Za-z0-9_-]+)/.test(window.location.hash || '');
  }

  /** true se a URL pede o modo edição (#edit, com ou sem token). */
  function hasEditHash() {
    return /[#&]edit(=|&|$)/.test(window.location.hash || '');
  }

  function storedToken() {
    try {
      return window.localStorage.getItem(TOKEN_KEY) || null;
    } catch (err) {
      return null;
    }
  }

  function rememberToken(value) {
    try {
      window.localStorage.setItem(TOKEN_KEY, value);
    } catch (err) {
      /* localStorage indisponível: o desbloqueio dura só a sessão */
    }
  }

  /** Botão "Sair do modo edição": limpa o token salvo e volta ao somente leitura. */
  function clearOwner() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      /* sem localStorage: basta sair recarregando sem o #edit */
    }
    window.location.hash = '';
    window.location.reload();
  }

  /** Mostra o banner de estado do modo edição (ativo/erro). */
  function showEditBanner(kind, message) {
    const banner = document.getElementById('edit-banner');
    if (!banner) {
      return;
    }
    const label = document.getElementById('edit-message');
    if (label) {
      label.textContent = message;
    }
    banner.className = 'edit-banner edit-banner--' + kind;
    banner.removeAttribute('hidden');
    const exit = document.getElementById('edit-exit');
    if (exit) {
      exit.hidden = kind !== 'active';
      if (kind === 'active') {
        exit.addEventListener('click', clearOwner);
      }
    }
  }

  function rawUrl() {
    if (!gistUser() || !gistId()) {
      return '';
    }
    return GIST_RAW + gistUser() + '/' + gistId() + '/raw/' + gistFile();
  }

  function apiUrl() {
    return gistId() ? GIST_API + gistId() : '';
  }

  function setStatus(kind, message) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.className = 'action-status action-status-' + kind;
  }

  /** Valida o token com uma leitura autenticada do gist. */
  function verifyToken(value) {
    if (!value || !gistId()) {
      return Promise.resolve(false);
    }
    return window.fetch(apiUrl(), {
      cache: 'no-store',
      headers: { Authorization: 'Bearer ' + value, Accept: 'application/vnd.github+json' }
    }).then(function (res) {
      return res.ok;
    }).catch(function () {
      return false;
    });
  }

  /** Extrai o payload do progresso da resposta da API (ou do próprio JSON do raw). */
  function gistPayloadFromJson(json) {
    if (!json || typeof json !== 'object') {
      return null;
    }
    if (json.files) {
      const file = json.files[gistFile()];
      if (!file || typeof file.content !== 'string') {
        return null;
      }
      try {
        return JSON.parse(file.content);
      } catch (err) {
        return null;
      }
    }
    return json; // veio do /raw: já é o objeto do arquivo
  }

  /** Lê o progresso publicado (público). Dono usa a API (fresca); visitante usa o raw. */
  function loadFromGist() {
    if (!configured()) {
      return Promise.resolve(null);
    }
    const fromRaw = function () {
      const raw = rawUrl();
      if (!raw) {
        return Promise.reject(new Error('sem raw'));
      }
      return window.fetch(raw + '?_=' + Date.now(), { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          return res.text();
        })
        .then(function (txt) { return txt ? JSON.parse(txt) : null; })
        .then(gistPayloadFromJson);
    };
    const fromApi = function () {
      const api = apiUrl();
      if (!api) {
        return Promise.reject(new Error('sem gist'));
      }
      const headers = token ? { Authorization: 'Bearer ' + token } : {};
      return window.fetch(api + '?nocache=' + Date.now(), { cache: 'no-store', headers: headers })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          return res.json();
        })
        .then(gistPayloadFromJson);
    };
    const first = token ? fromApi : fromRaw;
    const second = token ? fromRaw : fromApi;
    return first().catch(second).catch(function () { return null; });
  }

  /** Agenda o envio ao gist (debounce) — só no modo edição. */
  function schedulePush() {
    if (mode !== 'edit' || !token || !gistId()) {
      return;
    }
    setStatus('saving', 'Salvando…');
    if (pushTimer) {
      window.clearTimeout(pushTimer);
    }
    pushTimer = window.setTimeout(pushToGist, 1200);
  }

  function pushToGist() {
    pushTimer = null;
    if (!token || !gistId()) {
      return;
    }
    const files = {};
    files[gistFile()] = { content: JSON.stringify(buildPayload(), null, 2) };
    window.fetch(apiUrl(), {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: files })
    }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      setStatus('saved', 'Salvo ' + new Date().toLocaleTimeString('pt-BR'));
    }).catch(function (err) {
      const hint = /40[13]/.test(err.message)
        ? ' — verifique se o token tem "Gists: read and write".'
        : '.';
      setStatus('error', 'Falha ao salvar (' + err.message + ')' + hint);
    });
  }

  /* ---------------- Compartilhar: instantâneo via #s= (sem backend) ----------------
   * Formato: base64url( bits das tasks | bits do checkpoint | 4 bytes dias-epoch ).
   * Quem abre o link vê o progresso codificado em modo somente-leitura; nada é
   * gravado no localStorage de quem recebe. */

  let shareDate = null;
  let ownerDate = null;

  function packBits(bits) {
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j += 1) {
        b = (b << 1) | (bits[i + j] ? 1 : 0);
      }
      bytes.push(b);
    }
    return bytes;
  }

  function unpackBits(bytes, count) {
    const bits = [];
    for (let i = 0; i < count; i += 1) {
      bits.push((bytes[i >> 3] >> (7 - (i % 8))) & 1);
    }
    return bits;
  }

  function b64urlEncode(bytes) {
    let bin = '';
    bytes.forEach(function (x) { bin += String.fromCharCode(x); });
    return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(str) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = window.atob(b64 + '==='.slice((b64.length + 3) % 4));
    const bytes = [];
    for (let i = 0; i < bin.length; i += 1) {
      bytes.push(bin.charCodeAt(i));
    }
    return bytes;
  }

  function encodeShare() {
    const tBits = packBits(index.allTaskIds.map(function (id) { return state.tasks[id] === true ? 1 : 0; }));
    const cBits = packBits(data.checkpoint.items.map(function (it) { return state.checkpoint[it.id] === true ? 1 : 0; }));
    const days = Math.floor(Date.now() / 86400000);
    return tBits.concat(cBits, [(days >> 24) & 255, (days >> 16) & 255, (days >> 8) & 255, days & 255]);
  }

  function decodeShare(raw) {
    try {
      const bytes = b64urlDecode(raw);
      const nTasks = index.allTaskIds.length;
      const nCk = data.checkpoint.items.length;
      const tLen = Math.ceil(nTasks / 8);
      const cLen = Math.ceil(nCk / 8);
      if (bytes.length < tLen + cLen + 4) {
        return null;
      }
      let days = 0;
      for (let i = 0; i < 4; i += 1) {
        days = days * 256 + bytes[tLen + cLen + i];
      }
      const ts = new Date(days * 86400000);
      if (isNaN(ts.getTime())) {
        return null;
      }
      return {
        tasks: unpackBits(bytes.slice(0, tLen), nTasks),
        checkpoint: unpackBits(bytes.slice(tLen, tLen + cLen), nCk),
        date: ts
      };
    } catch (e) {
      return null;
    }
  }

  /** Aplica um snapshot decodificado ao estado (somente leitura). */
  function applySnapshot(snap) {
    snap.tasks.forEach(function (bit, i) {
      if (bit) {
        state.tasks[index.allTaskIds[i]] = true;
      }
    });
    snap.checkpoint.forEach(function (bit, i) {
      if (bit) {
        state.checkpoint[data.checkpoint.items[i].id] = true;
      }
    });
  }

  /** Instantâneo avulso no hash (#s=). Retorna true se aplicado. */
  function applyShare() {
    const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(window.location.hash || '');
    if (!m) {
      return false;
    }
    const snap = decodeShare(m[1]);
    if (!snap) {
      return false;
    }
    shareDate = snap.date;
    applySnapshot(snap);
    return true;
  }

  /** Aplica um payload carregado do gist (ou do cache local). */
  function applyLoaded(payload) {
    if (payload && typeof payload === 'object') {
      if (mode === 'edit' && storageAvailable) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (err) {
          storageAvailable = false;
        }
      }
      if (payload.updated) {
        const d = new Date(payload.updated);
        if (!isNaN(d.getTime())) {
          ownerDate = d;
        }
      }
      hydrate(payload);
      return true;
    }
    const cached = readStored();
    if (cached) {
      if (cached.updated) {
        const d = new Date(cached.updated);
        if (!isNaN(d.getTime())) {
          ownerDate = d;
        }
      }
      hydrate(cached);
    }
    return false;
  }

  function enterViewModeUi() {
    const banner = document.getElementById('share-banner');
    if (!banner) {
      return;
    }
    banner.removeAttribute('hidden');
    const lead = document.getElementById('share-lead');
    const label = document.getElementById('share-date');
    const exit = document.getElementById('share-exit');

    if (mode === 'owner') {
      if (lead) {
        const name = gistOwner();
        lead.textContent = name ? 'Progresso de ' + name : 'Progresso publicado';
      }
      if (label) {
        label.textContent = ownerDate
          ? 'atualizado em ' + ownerDate.toLocaleDateString('pt-BR')
          : 'somente leitura';
      }
      if (exit) {
        exit.remove(); // visitante não tem "próprio progresso" para ver
      }
    } else {
      if (label && shareDate) {
        label.textContent = 'instantâneo de ' + shareDate.toLocaleDateString('pt-BR');
      }
      if (exit) {
        exit.addEventListener('click', function () {
          window.location.hash = '';
          window.location.reload();
        });
      }
    }

    document.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
      cb.disabled = true;
    });
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
      nextBtn.remove();
    }
  }

  function copyText(text, btn) {
    const original = btn.textContent;
    btn.dataset.url = text;
    const ok = function () { btn.textContent = 'Copiado!'; };
    const fail = function () { btn.textContent = 'Não foi possível copiar'; };
    if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
      window.navigator.clipboard.writeText(text).then(ok, fail);
    } else {
      fail();
    }
    window.setTimeout(function () { btn.textContent = original; }, 3000);
  }

  /* ---------------- Estado -> ações ---------------- */

  function setTask(id, checked) {
    if (checked) {
      state.tasks[id] = true;
    } else {
      delete state.tasks[id];
    }
    save();
    refreshAll();
  }

  function setCkpt(id, checked) {
    if (checked) {
      state.checkpoint[id] = true;
    } else {
      delete state.checkpoint[id];
    }
    save(); // Checkpoint não afeta o progresso geral (regra §8.5)
  }

  /* ---------------- Índice dos dados ---------------- */

  function buildIndex() {
    const idx = { taskIds: {}, ckptIds: {}, allTaskIds: [] };
    data.stages.forEach(function (stage) {
      (stage.blocks || []).forEach(function (block) {
        (block.steps || []).forEach(function (step) {
          if (step.type === 'task') {
            idx.taskIds[step.id] = true;
            idx.allTaskIds.push(step.id);
          }
        });
      });
    });
    if (data.checkpoint && Array.isArray(data.checkpoint.items)) {
      data.checkpoint.items.forEach(function (item) {
        idx.ckptIds[item.id] = true;
      });
    }
    return idx;
  }

  /* ---------------- Render: etapas ---------------- */

  function taskItem(step, stepRefs) {
    const checkbox = el('input', { type: 'checkbox', id: step.id });
    checkbox.checked = state.tasks[step.id] === true;
    checkbox.addEventListener('change', function () {
      setTask(step.id, checkbox.checked);
    });
    const badge = el('span', { class: 'badge badge-done', text: 'Concluída', hidden: true });
    const li = el('li', { class: 'step' }, [
      checkbox,
      el('label', { class: 'step-label', for: step.id, text: step.text }),
      badge
    ]);
    stepRefs.push({ id: step.id, el: li, badge: badge, cb: checkbox, text: step.text });
    return li;
  }

  function noteItem(step) {
    return el('li', null, [
      el('aside', { class: 'note' }, [
        el('span', { class: 'block-field-label', text: 'Observação' }),
        ' ' + step.text
      ])
    ]);
  }

  function learnNode(block) {
    const href = safeUrl(block.url);
    if (href) {
      return el('a', {
        class: 'material-link',
        href: href,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: block.learn
      });
    }
    return block.learn ? el('span', { text: block.learn }) : null;
  }

  function renderBlock(block) {
    const steps = Array.isArray(block.steps) ? block.steps : [];
    const taskIds = steps.filter(function (s) { return s.type === 'task'; }).map(function (s) { return s.id; });
    const badge = el('span', { class: 'badge' });
    const details = el('details', { class: 'block' });
    details.addEventListener('toggle', refreshToggleLabels);
    const summary = el('summary', { class: 'block-summary' }, [
      el('span', { class: 'block-title' }, [el('code', { text: block.code }), ' ' + block.title]),
      block.period ? el('span', { class: 'block-meta', text: block.period }) : null,
      badge
    ]);
    const stepRefs = [];
    const list = el('ul', { class: 'block-steps' });
    steps.forEach(function (step) {
      list.appendChild(step.type === 'note' ? noteItem(step) : taskItem(step, stepRefs));
    });
    const fields = [
      blockField('Aprenda', learnNode(block)),
      blockField('Objetivo', block.objective ? el('p', { text: block.objective }) : null),
      blockField('Faça', list),
      blockField('Pronto quando', block.readyWhen ? el('p', { text: block.readyWhen }) : null),
      blockField('Tempo estimado', block.estimate ? el('p', { text: block.estimate }) : null)
    ];
    details.appendChild(summary);
    fields.forEach(function (field) {
      if (field) {
        details.appendChild(field);
      }
    });
    return {
      node: details,
      details: details,
      ref: { badge: badge, steps: stepRefs, taskIds: taskIds, code: block.code, title: block.title }
    };
  }

  function makeToggleButton(targets) {
    const btn = el('button', { type: 'button', class: 'btn-ghost' });
    function updateLabel() {
      const anyClosed = targets.some(function (d) { return !d.open; });
      btn.textContent = anyClosed ? 'Expandir todos' : 'Recolher todos';
    }
    btn.addEventListener('click', function () {
      const expand = targets.some(function (d) { return !d.open; });
      targets.forEach(function (d) { d.open = expand; });
      updateLabel();
    });
    ui.toggleLabels.push(updateLabel);
    updateLabel();
    return btn;
  }

  function renderStages() {
    const mount = document.getElementById('stages-container');
    if (!mount) {
      return;
    }
    const allDetails = [];
    data.stages.forEach(function (stage) {
      const stageTaskIds = [];
      const stageDetails = [];
      const blockNodes = [];
      (stage.blocks || []).forEach(function (block) {
        const rendered = renderBlock(block);
        blockNodes.push(rendered.node);
        stageDetails.push(rendered.details);
        allDetails.push(rendered.details);
        stageTaskIds.push.apply(stageTaskIds, rendered.ref.taskIds);
        rendered.ref.details = rendered.details;
        rendered.ref.stageNumber = stage.number;
        ui.blocks.push(rendered.ref);
      });
      const bar = makeProgressBar('Progresso da etapa ' + stage.number, stageTaskIds.length);
      const text = el('p', { class: 'progress-text' });
      const header = el('div', { class: 'stage-header' }, [
        el('h3', { text: 'Etapa ' + stage.number + ' — ' + stage.title }),
        makeToggleButton(stageDetails)
      ]);
      const section = el('section', {
        class: 'stage ' + (stage.number % 2 === 1 ? 'stage-musgo' : 'stage-terra'),
        id: 'etapa-' + stage.number
      }, [
        header,
        stage.period ? el('p', { class: 'stage-period', text: stage.period }) : null,
        stage.objective ? el('p', { class: 'stage-objective', text: stage.objective }) : null,
        el('div', { class: 'stage-progress' }, [bar.node, text])
      ].concat(blockNodes));
      mount.appendChild(section);
      ui.stages.push({
        number: stage.number,
        title: stage.title,
        period: stage.period || '',
        bar: bar.node,
        fill: bar.fill,
        text: text,
        taskIds: stageTaskIds
      });
    });
    const globalBtn = makeToggleButton(allDetails);
    if (mount.firstChild) {
      mount.insertBefore(globalBtn, mount.firstChild);
    } else {
      mount.appendChild(globalBtn);
    }
  }

  /* ---------------- Render: visão geral ---------------- */

  function renderCompetencies(mount) {
    if (!Array.isArray(data.competencies) || data.competencies.length === 0) {
      return;
    }
    const dl = el('dl', { class: 'competency-list' });
    data.competencies.forEach(function (c) {
      dl.appendChild(el('div', { class: 'competency' }, [
        el('dt', { class: 'competency-area', text: c.area }),
        el('dd', { class: 'competency-expected', text: c.expected })
      ]));
    });
    mount.appendChild(el('h4', { text: 'Competências esperadas' }));
    mount.appendChild(dl);
  }

  function renderOverview() {
    const mount = document.getElementById('overview-content');
    if (!mount) {
      return;
    }
    const meta = data.meta || {};
    const total = index.allTaskIds.length;

    ui.ring = makeRing(total);
    ui.heroSub = el('p', { class: 'hero-sub' });
    ui.heroStages = el('p', { class: 'hero-sub' });
    ui.nextBox = el('div', { class: 'hero-next' });
    const statsCol = el('div', { class: 'hero-stats', 'aria-live': 'polite' }, [
      ui.heroSub,
      ui.heroStages,
      ui.nextBox
    ]);
    if (!viewMode) {
      const shareBtn = el('button', { type: 'button', class: 'btn-ghost btn-share', text: 'Compartilhar meu progresso' });
      shareBtn.addEventListener('click', function () {
        copyText(window.location.origin + window.location.pathname + '#s=' + b64urlEncode(encodeShare()), shareBtn);
      });
      statusEl = el('span', { class: 'action-status', role: 'status', 'aria-live': 'polite' });
      statsCol.appendChild(el('div', { class: 'hero-actions' }, [shareBtn, statusEl]));
    }

    const chips = el('ul', { class: 'stage-chips' });
    ui.stages.forEach(function (st) {
      const fill = el('span', { class: 'chip-fill' });
      const status = el('span', { class: 'chip-status' });
      chips.appendChild(el('li', null, [
        el('a', { class: 'chip', href: '#etapa-' + st.number }, [
          el('span', { class: 'chip-head' }, [
            el('span', { class: 'chip-num', text: String(st.number) }),
            el('span', { class: 'chip-title', text: st.number + '. ' + st.title })
          ]),
          el('span', { class: 'chip-bar' }, [fill]),
          status
        ])
      ]));
      ui.chips.push({ fill: fill, status: status });
    });

    mount.appendChild(el('div', { class: 'hero' }, [
      el('div', { class: 'hero-top' }, [ui.ring.node, statsCol]),
      meta.goal ? el('p', { class: 'hero-intro', text: meta.goal }) : null,
      chips
    ]));

    const about = el('details', { class: 'about' });
    about.appendChild(el('summary', { class: 'about-summary', text: 'Sobre este roadmap' }));
    const aboutBody = el('div', { class: 'about-body' });
    if (meta.goalNote) {
      aboutBody.appendChild(el('aside', { class: 'note' }, [
        el('span', { class: 'block-field-label', text: 'Nota' }),
        ' ' + meta.goalNote
      ]));
    }
    const howTo = Array.isArray(meta.howToUse) && meta.howToUse.length
      ? blockField('Como utilizar', el('ul', null, meta.howToUse.map(function (t) { return el('li', { text: t }); })))
      : null;
    if (howTo) {
      aboutBody.appendChild(howTo);
    }
    const paceField = blockField('Ritmo', meta.pace ? el('p', { text: meta.pace }) : null);
    if (paceField) {
      aboutBody.appendChild(paceField);
    }
    renderCompetencies(aboutBody);
    about.appendChild(aboutBody);
    mount.appendChild(about);

    ui.navFill = document.querySelector('.nav-progress-fill');
    ui.navText = document.querySelector('.nav-progress-text');
  }

  /* ---------------- Render: materiais e checkpoint ---------------- */

  function renderMaterials() {
    const mount = document.getElementById('materials-list');
    if (!mount || !Array.isArray(data.materials)) {
      return;
    }
    const list = el('ul', null);
    data.materials.forEach(function (m) {
      const li = el('li', { class: 'material' });
      const href = safeUrl(m.url);
      if (href) {
        li.appendChild(el('a', {
          class: 'material-link',
          href: href,
          target: '_blank',
          rel: 'noopener noreferrer',
          text: m.name
        }));
      } else {
        li.appendChild(el('span', { text: m.name }));
      }
      list.appendChild(li);
    });
    mount.appendChild(list);
  }

  function renderCheckpoint() {
    const mount = document.getElementById('checkpoint-container');
    if (!mount) {
      return;
    }
    const cp = data.checkpoint || {};
    if (cp.intro) {
      mount.appendChild(el('p', { text: cp.intro }));
    }
    if (Array.isArray(cp.items)) {
      const list = el('ul', null);
      cp.items.forEach(function (item) {
        const checkbox = el('input', { type: 'checkbox', id: item.id });
        checkbox.checked = state.checkpoint[item.id] === true;
        const li = el('li', { class: 'ckpt-item' }, [
          checkbox,
          el('label', { class: 'step-label', for: item.id }, [
            el('strong', { text: item.area }),
            ': ' + item.text
          ])
        ]);
        li.classList.toggle('done', checkbox.checked);
        checkbox.addEventListener('change', function () {
          setCkpt(item.id, checkbox.checked);
          li.classList.toggle('done', checkbox.checked);
        });
        list.appendChild(li);
      });
      mount.appendChild(list);
    }
    if (cp.certification) {
      // Orientação futura, sem checkbox nem status (SDD §5.1)
      mount.appendChild(el('aside', { class: 'note' }, [
        el('span', { class: 'block-field-label', text: 'Certificação' }),
        ' ' + cp.certification
      ]));
    }
  }

  /* ---------------- Atualização de indicadores ---------------- */

  function renderNextAction() {
    if (!ui.nextBox) {
      return;
    }
    ui.nextBox.textContent = '';
    for (let b = 0; b < ui.blocks.length; b += 1) {
      const ref = ui.blocks[b];
      for (let s = 0; s < ref.steps.length; s += 1) {
        const step = ref.steps[s];
        if (state.tasks[step.id] !== true) {
          ui.nextBox.appendChild(el('p', { class: 'next-task' }, [
            el('span', { class: 'next-label', text: 'Próxima ação · ' + ref.code + ' ' + ref.title }),
            el('br'),
            step.text
          ]));
          const btn = el('button', { type: 'button', class: 'btn-next', text: 'Ir para a tarefa' });
          btn.addEventListener('click', function () {
            ref.details.open = true;
            if (typeof ref.details.scrollIntoView === 'function') {
              ref.details.scrollIntoView({ block: 'center' });
            }
            step.cb.focus();
          });
          ui.nextBox.appendChild(btn);
          return;
        }
      }
    }
    ui.nextBox.appendChild(el('p', { class: 'next-task' }, [
      'Todas as ' + index.allTaskIds.length + ' atividades estão concluídas. ',
      el('a', { class: 'nav-link', href: '#checkpoint', text: 'Revise o checkpoint final.' })
    ]));
  }

  function refreshAll() {
    ui.blocks.forEach(function (ref) {
      const p = progressOf(ref.taskIds);
      ref.badge.textContent = p.done + '/' + p.total;
      ref.badge.classList.toggle('badge-done', p.total > 0 && p.done === p.total);
      ref.steps.forEach(function (s) {
        const done = state.tasks[s.id] === true;
        s.el.classList.toggle('done', done);
        s.badge.hidden = !done;
      });
    });

    const stageProgress = ui.stages.map(function (st) { return progressOf(st.taskIds); });
    stageProgress.forEach(function (p, i) {
      const st = ui.stages[i];
      setProgress(st.bar, st.fill, p);
      st.text.textContent = p.done + ' de ' + p.total + ' atividades';
      const chip = ui.chips[i];
      if (chip) {
        chip.fill.style.width = p.pct + '%';
        chip.status.textContent = p.total > 0 && p.done === p.total
          ? 'Concluída'
          : (p.done > 0 ? 'Em andamento' : 'A fazer');
      }
    });

    const g = progressOf(index.allTaskIds);
    setRing(ui.ring, g);
    ui.heroSub.textContent = g.done + ' de ' + g.total + ' atividades concluídas';
    const finished = stageProgress.filter(function (p) { return p.total > 0 && p.done === p.total; }).length;
    ui.heroStages.textContent = finished + ' de ' + ui.stages.length + ' etapas concluídas';

    if (ui.navFill) {
      ui.navFill.style.width = g.pct + '%';
    }
    if (ui.navText) {
      ui.navText.textContent = g.pct + '%';
    }
    renderNextAction();
  }

  function refreshToggleLabels() {
    ui.toggleLabels.forEach(function (fn) { fn(); });
  }

  /* ---------------- Inicialização ---------------- */

  function showDataError() {
    const mount = document.getElementById('overview-content');
    if (mount) {
      mount.appendChild(el('p', { text: 'Não foi possível carregar os dados do roadmap.' }));
    }
  }

  function init() {
    data = window.ROADMAP;
    if (!data || !Array.isArray(data.stages) || data.stages.length === 0) {
      showDataError();
      return Promise.resolve();
    }
    index = buildIndex();

    const hashToken = readEditToken();
    const editRequested = hashToken !== null || hasEditHash();
    // O token salvo só vale quando a URL pede #edit: a URL pública fica sempre travada.
    const candidate = hashToken || (editRequested ? storedToken() : null);
    const unlock = (candidate && gistId())
      ? verifyToken(candidate).then(function (ok) {
          if (!ok) {
            return null;
          }
          if (hashToken) {
            rememberToken(hashToken);
          }
          return candidate;
        })
      : Promise.resolve(null);

    return unlock.then(function (t) {
      token = t || null;
      mode = hasShareHash() ? 'share' : (token ? 'edit' : 'owner');

      if (mode === 'share' && applyShare()) {
        viewMode = true;
        return null;
      }
      if (mode === 'share') {
        mode = 'owner'; // hash inválido → leitura
      }
      viewMode = mode !== 'edit';
      return loadFromGist().then(applyLoaded);
    }).then(function () {
      renderStages();
      renderOverview();
      renderMaterials();
      renderCheckpoint();
      refreshAll();
      updateFooterNote();
      if (viewMode) {
        enterViewModeUi();
      }
      if (mode === 'edit') {
        showEditBanner('active', 'Modo edição ativo — suas marcações são salvas no GitHub Gist.');
      } else if (editRequested && mode !== 'share') {
        showEditBanner('error', 'Token inválido ou sem permissão. Verifique se ele tem "Gists: read and write".');
      }
    });
  }

  let readyPromise = null;
  function start() {
    if (!readyPromise) {
      readyPromise = init();
    }
    return readyPromise;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.__ROADMAP_READY__ = start();
    });
  } else {
    window.__ROADMAP_READY__ = start();
  }
})();
