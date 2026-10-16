const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dataSrc = fs.readFileSync(path.join(ROOT, 'data/roadmap.js'), 'utf8');
const scriptSrc = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log('FALHOU:', name); }
}

function boot(seed) {
  const dom = new JSDOM(html, { url: 'https://roadmap.local/', runScripts: 'outside-only', pretendToBeVisual: true });
  if (seed) dom.window.localStorage.setItem('cloud-infra-roadmap-v1', seed);
  dom.window.eval(dataSrc);
  dom.window.eval(scriptSrc);
  const evt = dom.window.document.createEvent('Event');
  evt.initEvent('DOMContentLoaded', true, true);
  dom.window.document.dispatchEvent(evt);
  return dom;
}

const dom = boot();
const { window } = dom;
const { document } = window;

// --- render basico ---
t('etapas renderizadas (7)', document.querySelectorAll('section.stage').length === 7);
t('blocos renderizados (30)', document.querySelectorAll('details.block').length === 30);
t('checkboxes de task (69)', document.querySelectorAll('.step input[type=checkbox]').length === 69);
t('notes nao-marcaveis (4)', document.querySelectorAll('.block-steps aside.note').length === 4);
t('checkpoint itens (11)', document.querySelectorAll('#checkpoint-container .ckpt-item').length === 11);
t('materiais (10)', document.querySelectorAll('#materials-list .material').length === 10);
t('links materiais com noopener', document.querySelectorAll('#materials-list a[rel~="noopener"][target="_blank"]').length === 10);
t('links de bloco com noopener', document.querySelectorAll('.block a.material-link[rel*="noopener"][target="_blank"]').length > 0);
t('labels associados a inputs', [...document.querySelectorAll('.step-label')].every(l => l.htmlFor && document.getElementById(l.htmlFor)));
t('nav anchors validos', ['#overview','#etapas','#materiais','#checkpoint'].every(h => document.querySelector(h)));
t('url javascript bloqueada', document.querySelectorAll('a[href^="javascript:"]').length === 0);

// --- hero ---
t('hero existe primeiro no overview', document.querySelector('#overview-content').firstElementChild.classList.contains('hero'));
t('anel svg presente', !!document.querySelector('.hero-ring'));
t('anel role progressbar', document.querySelector('.hero-ring').getAttribute('role') === 'progressbar');
t('7 chips de etapa', document.querySelectorAll('.stage-chips .chip').length === 7);
t('ring 0% inicial', document.querySelector('.ring-label').textContent === '0%');
t('hero-sub inicial 0 de 69', /0 de 69 atividades concluídas/.test(document.querySelector('.hero-sub').textContent));
t('hero-sub etapas 0 de 7', [...document.querySelectorAll('.hero-sub')].some(e => /0 de 7 etapas concluídas/.test(e.textContent)));
t('nav strip 0%', document.querySelector('.nav-progress-text').textContent === '0%');
t('chip 1 status A fazer', document.querySelectorAll('.chip-status')[0].textContent === 'A fazer');

// --- sobre expansivel com introducao completa ---
const about = document.querySelector('details.about');
const aboutText = about.textContent;
t('details Sobre presente', !!about);
t('Sobre contem como utilizar (PDF)', /Não procure o próximo passo/.test(aboutText));
t('Sobre contem frase cansada', /Se estiver cansada, faça só o bloco daquele dia/.test(aboutText));
t('Sobre contem ritmo', /2–3 horas por semana/.test(aboutText));
t('Sobre contem 10 competencias', about.querySelectorAll('.competency').length === 10);
t('hero-intro com meta final', /conhecimento prático em Linux/.test(document.querySelector('.hero-intro').textContent));

// --- marcacoes e progresso ---
function click(id) {
  const cb = document.getElementById(id);
  cb.checked = !cb.checked;
  cb.dispatchEvent(new window.Event('change', { bubbles: true }));
}
click('e1-b1-s1'); click('e1-b1-s2'); click('e2-b1-s1');
t('hero-sub apos 3 marks', /3 de 69 atividades concluídas/.test(document.querySelector('.hero-sub').textContent));
t('ring label 4%', document.querySelector('.ring-label').textContent === '4%');
t('aria-valuenow ring = 3', document.querySelector('.hero-ring').getAttribute('aria-valuenow') === '3');
t('etapa 1 bar "2 de 12"', /2 de 12/.test(document.querySelector('#etapa-1 .stage-progress .progress-text').textContent));
t('step marcado classe done', document.getElementById('e1-b1-s1').closest('.step').classList.contains('done'));
t('badge Concluida visivel', !document.getElementById('e1-b1-s1').closest('.step').querySelector('.badge-done').hidden);
t('nav strip 4%', document.querySelector('.nav-progress-text').textContent === '4%');
t('chip 1 Em andamento', document.querySelectorAll('.chip-status')[0].textContent === 'Em andamento');
t('bloco 1.1 badge-done', document.querySelector('#etapa-1 details.block .block-summary .badge').classList.contains('badge-done'));

// --- proxima acao ---
t('proximo alvo he 1.2', /1\.2 Usuários \+ permissões/.test(document.querySelector('.hero-next .next-label').textContent));
const nextBtn = document.querySelector('.btn-next');
t('botao Ir para a tarefa existe', !!nextBtn);
nextBtn.click();
t('botao abriu details alvo', document.getElementById('e1-b2-s1').closest('details.block').open === true);
t('botao focou checkbox alvo', document.activeElement && document.activeElement.id === 'e1-b2-s1');

// --- checkpoint independente ---
click('ckpt-01');
t('checkpoint nao mexe no geral', /3 de 69 atividades concluídas/.test(document.querySelector('.hero-sub').textContent));
t('ckpt-01 classe done', document.getElementById('ckpt-01').closest('.ckpt-item').classList.contains('done'));
const ls = JSON.parse(window.localStorage.getItem('cloud-infra-roadmap-v1'));
t('storage separa tasks/checkpoint', Object.keys(ls.tasks).length === 3 && Object.keys(ls.checkpoint).length === 1 && ls.version === 1);

// --- persistencia apos recarga ---
const stored = window.localStorage.getItem('cloud-infra-roadmap-v1');
const dom2 = boot(stored);
t('restaura apos recarga', /3 de 69/.test(dom2.window.document.querySelector('.hero-sub').textContent));
t('restaura checkboxes', dom2.window.document.getElementById('e1-b1-s1').checked && dom2.window.document.getElementById('ckpt-01').checked);

// --- storage corrompido ---
const dom3 = boot('{invalid json');
t('json corrompido nao quebra', dom3.window.document.querySelectorAll('section.stage').length === 7);

// --- etapas nunca atrasadas / expansao ---
t('sem classificacao por data', !/atrasad/i.test(document.body.textContent));
t('toggle buttons com classe ghost', document.querySelectorAll('button.btn-ghost').length === 8);

// --- fidelidade pontual ---
t('tagline no header', /conhecimento técnico → prática → confiança/.test(document.getElementById('header-site').textContent));
t('objetivo Etapa 1 do PDF', /não sei nem por onde começar/.test(document.querySelector('#etapa-1 .stage-objective').textContent));
t('pronto quando 1a pessoa do PDF', /Consigo fazer essas operações básicas/.test(document.querySelector('#etapa-1 details.block').textContent));
t('certificacao nota sem checkbox', /Study Guide oficial/.test(document.querySelector('#checkpoint-container').textContent) && document.querySelectorAll('#checkpoint-container aside input').length === 0);
t('frase checkpoint domino', /Não precisa marcar tudo como 'domino'/.test(document.querySelector('#checkpoint-container').textContent));
t('aviso local no footer', /salvo localmente neste navegador/.test(document.getElementById('footer-site').textContent));

console.log(`\nRESULTADO: ${pass} passou, ${fail} falhou`);
process.exit(fail ? 1 : 0);
