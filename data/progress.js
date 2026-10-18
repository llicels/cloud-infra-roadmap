/**
 * Configuração do dono do roadmap.
 *
 * Este é o ÚNICO arquivo que você atualiza para publicar seu progresso.
 *
 * - owner    : nome exibido aos visitantes (opcional).
 * - updated  : data ISO (AAAA-MM-DD) do último snapshot publicado (opcional).
 * - snapshot : seu progresso codificado. Abra o site com #edit=<token>, marque
 *              as atividades e clique em "Copiar progresso para publicar";
 *              cole aqui a string gerada (aceita também a URL inteira com #s=).
 *              Enquanto estiver vazio, o site cai no modo normal.
 * - editHash : SHA-256 (hex) do seu token secreto de edição. Gere com
 *              `npm run owner-token`. Enquanto estiver vazio, o modo de
 *              edição por token fica desativado.
 *
 * Nada aqui é seguro por si só: o progresso publicado só muda com git push.
 */
window.OWNER_PROGRESS = {
  owner: "",
  updated: "",
  snapshot: "",
  editHash: "2f3979590b7dd357ac5b4efa1779f58a6545d3fa2638b3cadaf7ed588b6db47a"
};
