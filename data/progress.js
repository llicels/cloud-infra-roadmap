/**
 * Configuração do dono do roadmap (progresso em GitHub Gist).
 *
 * Somente dados PÚBLICOS ficam aqui. O token de escrita nunca é commitado.
 *
 * - owner    : nome exibido aos visitantes (opcional).
 * - gistUser : seu usuário do GitHub (dono do gist).
 * - gistId   : ID do gist que guarda o progresso.
 * - gistFile : nome do arquivo dentro do gist (padrão: progress.json).
 *
 * Como funciona:
 * - Visitantes LEEM o gist e veem o progresso em modo somente leitura.
 * - Você abre <site>/#edit=<token> (token fine-grained com "Gists: read and write");
 *   o token fica salvo no seu navegador e cada marcação é enviada ao gist sozinha.
 *
 * Ver o passo a passo no README ("Publicar seu progresso").
 */
window.OWNER_PROGRESS = {
  owner: "",
  gistUser: "llicels",
  gistId: "93e8f232649a05afdbdf1a2910fd9bc2",
  gistFile: "progress.json"
};
