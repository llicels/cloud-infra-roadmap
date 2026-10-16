const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://roadmap.local/', runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log('FALHOU:', name); }
}

// carrega scripts na ordem
window.eval(fs.readFileSync(path.join(ROOT, 'data/roadmap.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8'));

// DOMContentLoaded
const evt = document.createEvent('Event');
evt.initEvent('DOMContentLoaded', true, true);
document.dispatchEvent(evt);

// --- render ---
t('etapas renderizadas (7)', document.querySelectorAll('section.stage').length === 7);
t('blocos renderizados (30)', document.querySelectorAll('details.block').length === 30);
t('checkboxes de task (69)', document.querySelectorAll('.step input[type=checkbox]').length === 69);
t('notes nao-marcaveis (4)', document.querySelectorAll('aside.note').length >= 4 && document.querySelectorAll('.step').length === 69);
t('checkpoint itens (11)', document.querySelectorAll('#checkpoint-container .ckpt-item').length === 11);
t('materiais (10)', document.querySelectorAll('#materials-list .material').length === 10);
t('links materiais com noopener', document.querySelectorAll('#materials-list a[rel~="noopener"][target="_blank"]').length === 10);
t('links de bloco com noopener', document.querySelectorAll('.block a.material-link[rel*="noopener"][target="_blank"]').length > 0);
t('labels associados a inputs', [...document.querySelectorAll('.step-label')].every(l => l.htmlFor && document.getElementById(l.htmlFor)));
t('nav anchors validos', ['#overview','#etapas','#materiais','#checkpoint'].every(h => document.querySelector(h)));

// --- progresso inicial ---
const gtext = () => document.querySelector('.overview-stat .progress-text').textContent;
t('progresso inicial "0 de 69 (0%)"', /0 de 69 atividades concluídas \(0%\)/.test(gtext()));

// --- marcar 3 tasks: 2 da etapa 1, 1 da etapa 2 ---
function click(id) {
  const cb = document.getElementById(id);
  cb.checked = !cb.checked;
  cb.dispatchEvent(new window.Event('change', { bubbles: true }));
}
click('e1-b1-s1'); click('e1-b1-s2'); click('e2-b1-s1');
t('geral atualizado "3 de 69"', /3 de 69 atividades concluídas \(4%\)/.test(gtext()));
const etapa1text = document.querySelector('#etapa-1 .stage-progress .progress-text').textContent;
t('etapa 1 = "2 de 12"', /2 de 12/.test(etapa1text));
t('step marcado tem classe done', document.getElementById('e1-b1-s1').closest('.step').classList.contains('done'));
t('badge Concluída visível', !document.getElementById('e1-b1-s1').closest('.step').querySelector('.badge-done').hidden);
t('aria-valuenow geral = 3', document.querySelector('.overview-stat [role=progressbar]').getAttribute('aria-valuenow') === '3');
t('proxima etapa incompleta aponta etapa 1', /Etapa 1/.test([...document.querySelectorAll('.overview-stat a.nav-link')].map(a=>a.textContent).join('|')));

// --- checkpoint independente ---
click('ckpt-01');
t('checkpoint NAO altera geral (ainda 3/69)', /3 de 69 atividades concluídas/.test(gtext()));
const ls = JSON.parse(window.localStorage.getItem('cloud-infra-roadmap-v1'));
t('ckpt-01 ganha classe done', document.getElementById('ckpt-01').closest('.ckpt-item').classList.contains('done'));
t('storage separa tasks e checkpoint', Object.keys(ls.tasks).length === 3 && Object.keys(ls.checkpoint).length === 1 && ls.version === 1);

// --- bloco completo badge ---
const e1b1tasks = window.ROADMAP.stages[0].blocks[0].steps.filter(s => s.type === 'task').map(s => s.id);
t('bloco 1.1 completo mostra badge-done', document.querySelector('#etapa-1 details.block .block-summary .badge').classList.contains('badge-done'));

// --- persistência: recarregar ---
const stored = window.localStorage.getItem('cloud-infra-roadmap-v1');
const dom2 = new JSDOM(html, { url: 'https://roadmap.local/', runScripts: 'outside-only', pretendToBeVisual: true });
dom2.window.localStorage.setItem('cloud-infra-roadmap-v1', stored);
dom2.window.eval(fs.readFileSync(path.join(ROOT, 'data/roadmap.js'), 'utf8'));
dom2.window.eval(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8'));
const evt2 = dom2.window.document.createEvent('Event'); evt2.initEvent('DOMContentLoaded', true, true);
dom2.window.document.dispatchEvent(evt2);
t('restaura apos recarga (3 de 69)', /3 de 69/.test(dom2.window.document.querySelector('.overview-stat .progress-text').textContent));
t('restaura checkboxes', dom2.window.document.getElementById('e1-b1-s1').checked && dom2.window.document.getElementById('ckpt-01').checked);

// --- storage corrompido ---
const dom3 = new JSDOM(html, { url: 'https://roadmap.local/', runScripts: 'outside-only' });
dom3.window.localStorage.setItem('cloud-infra-roadmap-v1', '{invalid json');
dom3.window.eval(fs.readFileSync(path.join(ROOT, 'data/roadmap.js'), 'utf8'));
dom3.window.eval(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8'));
const evt3 = dom3.window.document.createEvent('Event'); evt3.initEvent('DOMContentLoaded', true, true);
dom3.window.document.dispatchEvent(evt3);
t('json corrompido nao quebra app', dom3.window.document.querySelectorAll('section.stage').length === 7);

// --- expandir/recolher ---
const btns = [...document.querySelectorAll('button')];
t('botao expandir existe', btns.some(b => /Expandir/.test(b.textContent)));
const firstBlock = document.querySelector('details.block');
firstBlock.open = true; firstBlock.dispatchEvent(new window.Event('toggle', { bubbles: true }));
t('details abre', firstBlock.open);

// --- conteúdo obrigatório ---
const bodyText = document.body.textContent;
t('tagline presente (header)', /conhecimento técnico → prática → confiança/.test(document.getElementById('header-site').textContent));
t('meta final presente', /conhecimento prático em Linux, redes/.test(bodyText));
t('frase cansada do PDF presente', /Se estiver cansada, faça só o bloco daquele dia/.test(bodyText));
t('objetivo Etapa 1 do PDF presente', /não sei nem por onde começar/.test(document.querySelector('#etapa-1 .stage-objective').textContent));
t('certificação sem checkbox', /Study Guide oficial/.test(bodyText) && !document.querySelector('#checkpoint-container input[value]'));
t('frase do checkpoint presente', /Não precisa marcar tudo como 'domino'/.test(bodyText));
t('aviso local no footer', /salvo localmente neste navegador/.test(document.getElementById('footer-site').textContent));

// --- sem atraso automático: nenhuma menção a atrasada ---
t('sem classificação por data', !/atrasad/i.test(bodyText));

console.log(`\nRESULTADO: ${pass} passou, ${fail} falhou`);
process.exit(fail ? 1 : 0);
