const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dataSrc = fs.readFileSync(path.join(ROOT, 'data/roadmap.js'), 'utf8');
const scriptSrc = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log('FALHOU:', name); }
}

const TOKEN = 'token-de-teste-valido';
const GIST_ID = 'gist-abc123';
const GIST_USER = 'tester';
const FILE = 'progress.json';

const PAYLOAD = {
  version: 1,
  tasks: { 'e1-b1-s1': true, 'e1-b1-s2': true, 'e2-b1-s1': true },
  checkpoint: { 'ckpt-01': true },
  updated: '2026-10-01T12:00:00.000Z'
};

function config(extra) {
  return Object.assign({ owner: 'Ana', gistUser: GIST_USER, gistId: GIST_ID, gistFile: FILE }, extra || {});
}
function configScript(cfg) {
  return 'window.OWNER_PROGRESS = ' + JSON.stringify(cfg) + ';';
}

function jsonRes(body) {
  return {
    ok: true,
    status: 200,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)); }
  };
}
function statusRes(status) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    json: function () { return Promise.resolve({}); },
    text: function () { return Promise.resolve(''); }
  };
}

function makeFetch(store) {
  return function (url, opts) {
    opts = opts || {};
    const method = (opts.method || 'GET').toUpperCase();
    const auth = (opts.headers && (opts.headers.Authorization || opts.headers.authorization)) || '';
    const isApi = url.indexOf('https://api.github.com/gists/') === 0;
    const isRaw = url.indexOf('https://gist.githubusercontent.com/') === 0;

    if (method === 'PATCH') {
      if (!store.validToken || auth !== 'Bearer ' + store.validToken) {
        return Promise.resolve(statusRes(401));
      }
      store.pushes.push(JSON.parse(opts.body));
      return Promise.resolve(jsonRes({}));
    }
    if (isApi) {
      if (auth && auth !== 'Bearer ' + store.validToken) {
        return Promise.resolve(statusRes(401));
      }
      if (!store.payload) {
        return Promise.resolve(statusRes(404));
      }
      const files = {};
      files[FILE] = { content: JSON.stringify(store.payload) };
      return Promise.resolve(jsonRes({ files: files }));
    }
    if (isRaw) {
      if (!store.payload) {
        return Promise.resolve(statusRes(404));
      }
      return Promise.resolve(jsonRes(JSON.stringify(store.payload)));
    }
    return Promise.resolve(statusRes(404));
  };
}

function boot(store, hash, cfg, seed) {
  const dom = new JSDOM(html, {
    url: 'https://roadmap.local/' + (hash || ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole()
  });
  Object.keys(seed || {}).forEach(function (k) {
    dom.window.localStorage.setItem(k, seed[k]);
  });
  dom.window.fetch = makeFetch(store);
  dom.window.eval(dataSrc);
  dom.window.eval(configScript(cfg || {}));
  dom.window.eval(scriptSrc);
  const evt = dom.window.document.createEvent('Event');
  evt.initEvent('DOMContentLoaded', true, true);
  dom.window.document.dispatchEvent(evt);
  return Promise.resolve(dom.window.__ROADMAP_READY__).then(function () { return dom; });
}

function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

(async function () {
  /* ================= Visitante: progresso do dono, somente leitura ================= */
  const vStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const vDom = await boot(vStore, '', config());
  const doc = vDom.window.document;

  t('etapas renderizadas (7)', doc.querySelectorAll('section.stage').length === 7);
  t('blocos renderizados (30)', doc.querySelectorAll('details.block').length === 30);
  t('checkboxes de task (69)', doc.querySelectorAll('.step input[type=checkbox]').length === 69);
  t('notes nao-marcaveis (4)', doc.querySelectorAll('.block-steps aside.note').length === 4);
  t('checkpoint itens (11)', doc.querySelectorAll('#checkpoint-container .ckpt-item').length === 11);
  t('materiais (10)', doc.querySelectorAll('#materials-list .material').length === 10);
  t('links materiais com noopener', doc.querySelectorAll('#materials-list a[rel~="noopener"][target="_blank"]').length === 10);
  t('links de bloco com noopener', doc.querySelectorAll('.block a.material-link[rel*="noopener"][target="_blank"]').length > 0);
  t('labels associados a inputs', [...doc.querySelectorAll('.step-label')].every(l => l.htmlFor && doc.getElementById(l.htmlFor)));
  t('nav anchors validos', ['#overview', '#etapas', '#materiais', '#checkpoint'].every(h => doc.querySelector(h)));
  t('url javascript bloqueada', doc.querySelectorAll('a[href^="javascript:"]').length === 0);

  t('hero existe primeiro no overview', doc.querySelector('#overview-content').firstElementChild.classList.contains('hero'));
  t('anel svg presente', !!doc.querySelector('.hero-ring'));
  t('anel role progressbar', doc.querySelector('.hero-ring').getAttribute('role') === 'progressbar');
  t('7 chips de etapa', doc.querySelectorAll('.stage-chips .chip').length === 7);
  t('ring 4% (3/69)', doc.querySelector('.ring-label').textContent === '4%');
  t('hero-sub 3 de 69', /3 de 69 atividades concluídas/.test(doc.querySelector('.hero-sub').textContent));
  t('nav strip 4%', doc.querySelector('.nav-progress-text').textContent === '4%');
  t('step marcado classe done', doc.getElementById('e1-b1-s1').closest('.step').classList.contains('done'));
  t('badge Concluida visivel', !doc.getElementById('e1-b1-s1').closest('.step').querySelector('.badge-done').hidden);
  t('badge oculta em step nao feito', doc.getElementById('e7-b4-s1').closest('.step').querySelector('.badge-done').hasAttribute('hidden'));
  t('etapa 1 bar 2 de 12', /2 de 12/.test(doc.querySelector('#etapa-1 .stage-progress .progress-text').textContent));
  t('checkpoint replicado', doc.getElementById('ckpt-01').checked);
  t('checkpoint nao soma no geral', /3 de 69/.test(doc.querySelector('.hero-sub').textContent));

  t('visitante: todos checkboxes desabilitados', [...doc.querySelectorAll('input[type=checkbox]')].every(cb => cb.disabled));
  t('visitante: banner visivel', !doc.getElementById('share-banner').hidden);
  t('visitante: banner com nome', /Progresso de Ana/.test(doc.getElementById('share-lead').textContent));
  t('visitante: banner com data', /atualizado em \d{2}\/\d{2}\/\d{4}/.test(doc.getElementById('share-date').textContent));
  t('visitante: sem botao share', !doc.querySelector('.btn-share'));
  t('visitante: sem botao sair', !doc.getElementById('share-exit'));
  t('visitante: sem botao proxima acao', !doc.querySelector('.btn-next'));
  t('visitante: nao grava localStorage alheio', vDom.window.localStorage.getItem('cloud-infra-roadmap-v1') === null);
  t('visitante: rodape somente leitura', /somente leitura/.test(doc.getElementById('footer-site').textContent));

  /* ================= Sobre / fidelidade ================= */
  const about = doc.querySelector('details.about');
  t('details Sobre presente', !!about);
  t('Sobre contem como utilizar (PDF)', /Não procure o próximo passo/.test(about.textContent));
  t('Sobre contem frase cansada', /Se estiver cansada, faça só o bloco daquele dia/.test(about.textContent));
  t('Sobre contem ritmo', /2–3 horas por semana/.test(about.textContent));
  t('Sobre contem 10 competencias', about.querySelectorAll('.competency').length === 10);
  t('hero-intro com meta final', /conhecimento prático em Linux/.test(doc.querySelector('.hero-intro').textContent));
  t('objetivo Etapa 1 do PDF', /não sei nem por onde começar/.test(doc.querySelector('#etapa-1 .stage-objective').textContent));
  t('pronto quando 1a pessoa do PDF', /Consigo fazer essas operações básicas/.test(doc.querySelector('#etapa-1 details.block').textContent));
  t('certificacao nota sem checkbox', /Study Guide oficial/.test(doc.querySelector('#checkpoint-container').textContent) && doc.querySelectorAll('#checkpoint-container aside input').length === 0);
  t('frase checkpoint domino', /Não precisa marcar tudo como 'domino'/.test(doc.querySelector('#checkpoint-container').textContent));
  t('sem classificacao por data', !/atrasad/i.test(doc.body.textContent));
  t('toggle buttons com classe ghost', doc.querySelectorAll('#stages-container button.btn-ghost').length === 8);

  /* ================= CSS ================= */
  t('css esconde [hidden]', /\[hidden\][^}]*display:\s*none\s*!important/s.test(cssSrc));
  t('css trava overflow-x na pagina', /overflow-x:\s*clip/.test(cssSrc));
  t('css chips com min-width 0', /\.stage-chips > li\s*\{\s*min-width:\s*0/.test(cssSrc));
  t('css chip-bar com display block', /\.chip-bar\s*\{[^}]*display:\s*block/.test(cssSrc));
  t('nav sem scroll interno', !/\.nav-inner\s*\{[^}]*overflow-x:\s*auto/.test(cssSrc));
  t('html com cache-busting nos assets', /style\.css\?v=/.test(html) && /script\.js\?v=/.test(html));

  /* ================= Edição (dono destravado por token) ================= */
  const eStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const eDom = await boot(eStore, '#edit=' + TOKEN, config());
  const edoc = eDom.window.document;

  t('edit: banner oculto', edoc.getElementById('share-banner').hidden);
  t('edit: checkboxes habilitados', !edoc.getElementById('e1-b1-s1').disabled);
  t('edit: botao share presente', !!edoc.querySelector('.btn-share'));
  t('edit: sem botao publicar', !edoc.querySelector('.btn-publish'));
  t('edit: token lembrado no navegador', eDom.window.localStorage.getItem('cloud-infra-roadmap-token') === TOKEN);
  t('edit: carrega progresso do gist', /3 de 69/.test(edoc.querySelector('.hero-sub').textContent));
  t('edit: rodape sincronizacao', /sincronizado/.test(edoc.getElementById('footer-site').textContent));
  t('edit: banner de edicao ativo', !edoc.getElementById('edit-banner').hidden && /edit-banner--active/.test(edoc.getElementById('edit-banner').className));
  t('edit: botao sair visivel', !edoc.getElementById('edit-exit').hidden);

  const cb = edoc.getElementById('e1-b2-s1');
  cb.checked = true;
  cb.dispatchEvent(new eDom.window.Event('change', { bubbles: true }));
  t('edit: progresso atualiza na hora', /4 de 69/.test(edoc.querySelector('.hero-sub').textContent));
  await delay(1500);
  t('edit: envio ao gist registrado (1)', eStore.pushes.length === 1);
  const pushed = eStore.pushes.length ? JSON.parse(eStore.pushes[0].files[FILE].content) : {};
  t('edit: payload enviado contem a marcacao', pushed.tasks && pushed.tasks['e1-b2-s1'] === true && pushed.tasks['e1-b1-s1'] === true);
  t('edit: payload com version/updated', pushed.version === 1 && typeof pushed.updated === 'string');
  t('edit: status salvo', /Salvo/.test(edoc.querySelector('.action-status').textContent));

  const ck = edoc.getElementById('ckpt-02');
  ck.checked = true;
  ck.dispatchEvent(new eDom.window.Event('change', { bubbles: true }));
  t('edit: checkpoint nao mexe no geral', /4 de 69/.test(edoc.querySelector('.hero-sub').textContent));

  edoc.getElementById('edit-exit').click();
  t('edit: sair remove o token salvo', eDom.window.localStorage.getItem('cloud-infra-roadmap-token') === null);

  /* ================= Token inválido continua somente leitura ================= */
  const badStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const badDom = await boot(badStore, '#edit=errado', config());
  const bdoc = badDom.window.document;
  t('edit: token invalido fica somente leitura', !bdoc.getElementById('share-banner').hidden && bdoc.getElementById('e1-b1-s1').disabled);
  t('edit: token invalido mostra banner de erro', !bdoc.getElementById('edit-banner').hidden && /edit-banner--error/.test(bdoc.getElementById('edit-banner').className));
  t('edit: banner de erro sem botao sair', bdoc.getElementById('edit-exit').hidden);

  /* ================= URL sem #edit: token salvo NÃO destrava ================= */
  const lockedStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const lockedDom = await boot(lockedStore, '', config(), { 'cloud-infra-roadmap-token': TOKEN });
  t('trava: token salvo sem #edit nao edita', lockedDom.window.document.getElementById('e1-b1-s1').disabled);
  t('trava: sem banner de edicao', lockedDom.window.document.getElementById('edit-banner').hidden);

  const semiStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const semiDom = await boot(semiStore, '#edit', config(), { 'cloud-infra-roadmap-token': TOKEN });
  t('destrava: #edit sem token usa o token salvo', !semiDom.window.document.getElementById('e1-b1-s1').disabled);

  const noneDom = await boot({ validToken: TOKEN, pushes: [], payload: PAYLOAD }, '#edit', config(), {});
  t('destrava: #edit sem token nenhum fica leitura', noneDom.window.document.getElementById('e1-b1-s1').disabled);
  t('destrava: erro visivel sem token', /edit-banner--error/.test(noneDom.window.document.getElementById('edit-banner').className));

  /* ================= Sem configuração: padrão somente leitura ================= */
  const uStore = { validToken: null, pushes: [], payload: null };
  const uDom = await boot(uStore, '', {});
  const udoc = uDom.window.document;
  t('sem config: padrao somente leitura', udoc.getElementById('e1-b1-s1').disabled);
  t('sem config: 0 de 69', /0 de 69/.test(udoc.querySelector('.hero-sub').textContent));
  t('sem config: sem botao share', !udoc.querySelector('.btn-share'));

  /* ================= Compartilhar instantâneo (#s=) ================= */
  const shareBtn = edoc.querySelector('.btn-share');
  shareBtn.click();
  const shareUrl = shareBtn.dataset.url || '';
  t('share gera link com hash', /#s=[A-Za-z0-9_-]+$/.test(shareUrl));
  const shareHash = shareUrl.slice(shareUrl.indexOf('#'));

  const sStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const sDom = await boot(sStore, shareHash, config());
  const sdoc = sDom.window.document;
  t('share: banner visivel', !sdoc.getElementById('share-banner').hidden);
  t('share: banner com data', /instantâneo de \d{2}\/\d{2}\/\d{4}/.test(sdoc.getElementById('share-date').textContent));
  t('share: checkboxes desabilitados', [...sdoc.querySelectorAll('input[type=checkbox]')].every(c => c.disabled));
  t('share: replica progresso', /4 de 69/.test(sdoc.querySelector('.hero-sub').textContent));
  t('share: sem botao share', !sdoc.querySelector('.btn-share'));
  t('share: botao sair presente', !!sdoc.getElementById('share-exit'));

  const bsStore = { validToken: TOKEN, pushes: [], payload: PAYLOAD };
  const bsDom = await boot(bsStore, '#s=zz', config());
  t('share invalido cai em leitura', bsDom.window.document.getElementById('e1-b1-s1').disabled);

  console.log(`\nRESULTADO: ${pass} passou, ${fail} falhou`);
  process.exit(fail ? 1 : 0);
})();
