/**
 * Cloud & Infra Roadmap 4.1 — script.js (Agente C)
 * Renderização, checklist, progresso e persistência. Contrato: CONTRACT.md §6.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cloud-infra-roadmap-v1';
  const STORAGE_VERSION = 1;
  const UNAVAILABLE_NOTE = 'Não foi possível salvar localmente neste navegador. O progresso vale apenas nesta sessão.';

  let data = null;
  let index = null;
  let storageAvailable = true;

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

  function save() {
    if (!storageAvailable) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: STORAGE_VERSION,
        tasks: state.tasks,
        checkpoint: state.checkpoint
      }));
    } catch (err) {
      storageAvailable = false;
      updateFooterNote();
    }
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
    if (storageAvailable && data && data.meta && data.meta.localNote) {
      noteEl.textContent = data.meta.localNote;
    } else if (!storageAvailable) {
      noteEl.textContent = UNAVAILABLE_NOTE;
    }
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
      return;
    }
    index = buildIndex();
    hydrate(readStored());
    renderStages();
    renderOverview();
    renderMaterials();
    renderCheckpoint();
    refreshAll();
    updateFooterNote();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
