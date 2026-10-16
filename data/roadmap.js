window.ROADMAP = {
  meta: {
    title: "Cloud & Infra Roadmap",
    version: "4.1",
    period: "21/09/2026 — 31/03/2027",
    goal: "Ter conhecimento prático em Linux, redes, Cisco Packet Tracer, GNS3, Docker, Kubernetes, Azure, IaC, CI/CD e observabilidade — com capacidade de explicar o que está fazendo e reproduzir tarefas comuns.",
    goalNote: "Certificações ficam em segundo plano. O foco do roadmap é conhecimento demonstrável.",
    howToUse: [
      "Cada bloco segue a sequência Aprenda → Faça → Pronto quando.",
      "O material indicado em cada bloco é a referência para a execução. O estudo pode ser dividido em sessões curtas, de acordo com o tempo disponível.",
      "Não procure o próximo passo: o link indicado em cada bloco é o material que você deve usar.",
      "Se estiver cansada, faça só o bloco daquele dia."
    ],
    pace: "Ritmo previsto: 2–3 horas por semana, em sessões de 30–60 minutos. O desafio complementar é opcional; o aprendizado guiado é obrigatório.",
    localNote: "Progresso salvo localmente neste navegador — não é sincronizado entre dispositivos."
  },
  competencies: [
    { "area": "Linux", "expected": "Utilizar CLI, usuários e grupos, permissões, processos, serviços, logs e SSH." },
    { "area": "Redes", "expected": "Explicar TCP/IP, DNS, portas, IP/subnetting, VLANs e troubleshooting." },
    { "area": "Cisco Packet Tracer", "expected": "Montar e testar redes pequenas." },
    { "area": "GNS3", "expected": "Instalar, montar uma topologia simples e investigar conectividade." },
    { "area": "Docker", "expected": "Criar imagens, executar containers, utilizar volumes, redes e Compose." },
    { "area": "Kubernetes", "expected": "Explicar Pod, Deployment e Service e realizar deploy, scale e update guiados." },
    { "area": "Azure", "expected": "Trabalhar com compute, storage, networking, identidade, RBAC e monitoramento." },
    { "area": "IaC", "expected": "Utilizar Terraform/OpenTofu com variables, outputs, state e ciclo plan/apply." },
    { "area": "CI/CD", "expected": "Criar workflow no GitHub Actions e automatizar validação, build e deploy." },
    { "area": "Observabilidade", "expected": "Diferenciar logs, métricas e traces e fazer consultas KQL básicas." }
  ],
  stages: [
    {
      "id": "etapa-1",
      "number": 1,
      "title": "Setembro: Linux + Git",
      "period": "21/09/2026 – 30/09/2026",
      "objective": "Parar de sentir que o terminal é um lugar onde \"não sei nem por onde começar\".",
      "blocks": [
        {
          "id": "e1-b1",
          "code": "1.1",
          "title": "Linux básico",
          "period": "21–23/09/2026",
          "objective": "Navegar no terminal e manipular arquivos sem medo.",
          "learn": "Ubuntu — The Linux command line for beginners.",
          "url": "https://ubuntu.com/tutorials/command-line-for-beginners",
          "steps": [
            { "id": "e1-b1-s1", "type": "task", "text": "Seguir o tutorial inteiro." },
            { "id": "e1-b1-s2", "type": "task", "text": "Repetir sem copiar do tutorial os comandos: pwd, ls, cd, mkdir, cp, mv, rm, cat e pipes." }
          ],
          "readyWhen": "Consigo fazer essas operações básicas sem consultar o tutorial.",
          "estimate": "45–60 minutos"
        },
        {
          "id": "e1-b2",
          "code": "1.2",
          "title": "Usuários + permissões",
          "period": "24–26/09/2026",
          "objective": "Criar usuários/grupos e entender rwx.",
          "learn": "Ubuntu — User management + Welcome to the terminal.",
          "url": "https://ubuntu.com/server/docs/how-to/security/user-management/",
          "steps": [
            { "id": "e1-b2-s1", "type": "task", "text": "No Ubuntu/WSL, seguir os comandos da seção de gerenciamento de usuários para criar um usuário de laboratório e um grupo." },
            { "id": "e1-b2-s2", "type": "task", "text": "Seguir a seção de permissões do tutorial de terminal." },
            { "id": "e1-b2-s3", "type": "task", "text": "Criar uma pasta." },
            { "id": "e1-b2-s4", "type": "task", "text": "Alterar owner/group." },
            { "id": "e1-b2-s5", "type": "task", "text": "Utilizar chmod." }
          ],
          "readyWhen": "Consigo criar usuário/grupo, adicionar usuário ao grupo e explicar chmod 644 e chmod 755.",
          "estimate": "60–90 minutos"
        },
        {
          "id": "e1-b3",
          "code": "1.3",
          "title": "Serviços + logs",
          "period": "27–28/09/2026",
          "objective": "Entender processo, serviço e log.",
          "learn": "Ubuntu Server — documentação de segurança e administração.",
          "url": "https://ubuntu.com/server/docs/",
          "steps": [
            { "id": "e1-b3-s1", "type": "task", "text": "Ler a parte de system basics." },
            { "id": "e1-b3-s2", "type": "task", "text": "Procurar, no próprio Ubuntu, por systemctl, journalctl e logs." },
            { "id": "e1-b3-s3", "type": "note", "text": "Se o WSL não tiver systemd habilitado, marque apenas a parte conceitual; não gaste tempo configurando isso agora." }
          ],
          "readyWhen": "Consigo dizer onde procuraria o status e os logs de um serviço Linux.",
          "estimate": "30–45 minutos"
        },
        {
          "id": "e1-b4",
          "code": "1.4",
          "title": "Git",
          "period": "29–30/09/2026",
          "objective": "Usar Git no dia a dia.",
          "learn": "GitHub Skills — Introduction to GitHub.",
          "url": "https://skills.github.com/",
          "steps": [
            { "id": "e1-b4-s1", "type": "task", "text": "Concluir o curso Introduction to GitHub." },
            { "id": "e1-b4-s2", "type": "task", "text": "Criar uma branch no repositório do roadmap." },
            { "id": "e1-b4-s3", "type": "task", "text": "Abrir um pull request (PR)." }
          ],
          "readyWhen": "Tenho um PR feito por mim e consigo explicar branch/commit/merge.",
          "estimate": "60 minutos"
        }
      ]
    },
    {
      "id": "etapa-2",
      "number": 2,
      "title": "Outubro: Redes + Cisco Packet Tracer",
      "period": "01/10/2026 – 31/10/2026",
      "objective": "Construir a base de redes antes de levar esses conceitos para Azure.",
      "blocks": [
        {
          "id": "e2-b1",
          "code": "2.1",
          "title": "Fundamentos",
          "period": "01–05/10/2026",
          "objective": "Entender como uma máquina chega a outra.",
          "learn": "Microsoft Learn — Network Fundamentals.",
          "url": "https://learn.microsoft.com/pt-br/training/modules/network-fundamentals/",
          "steps": [
            { "id": "e2-b1-s1", "type": "task", "text": "Concluir o módulo inteiro." },
            { "id": "e2-b1-s2", "type": "task", "text": "Anotar apenas cinco conceitos: IP, MAC, DNS, porta e gateway." }
          ],
          "readyWhen": "Consigo explicar esses 5 conceitos com um exemplo real.",
          "estimate": "60–90 minutos"
        },
        {
          "id": "e2-b2",
          "code": "2.2",
          "title": "Packet Tracer — primeiros passos",
          "period": "06–12/10/2026",
          "objective": "Aprender a usar o simulador.",
          "learn": "Cisco Networking Academy — Getting Started with Cisco Packet Tracer.",
          "url": "https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000",
          "steps": [
            { "id": "e2-b2-s1", "type": "task", "text": "Concluir o curso introdutório." },
            { "id": "e2-b2-s2", "type": "task", "text": "Realizar o primeiro exercício de criação de rede." }
          ],
          "readyWhen": "Tenho um arquivo .pkt com uma rede funcionando.",
          "estimate": "1,5–2 horas"
        },
        {
          "id": "e2-b3",
          "code": "2.3",
          "title": "IP + subnetting",
          "period": "13–19/10/2026",
          "objective": "Configurar IP e entender subnets.",
          "learn": "Cisco Packet Tracer — continuação do curso introdutório + Network Fundamentals.",
          "url": "https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000",
          "steps": [
            { "id": "e2-b3-s1", "type": "task", "text": "Reproduzir o exercício de rede no Packet Tracer." },
            { "id": "e2-b3-s2", "type": "task", "text": "Utilizar o modo Simulation para observar os pacotes." },
            { "id": "e2-b3-s3", "type": "task", "text": "Fazer cinco exercícios simples de subnetting." }
          ],
          "readyWhen": "Consigo determinar rede/host em exemplos simples e testar conectividade.",
          "estimate": "2–3 horas"
        },
        {
          "id": "e2-b4",
          "code": "2.4",
          "title": "VLAN + routing",
          "period": "20–26/10/2026",
          "objective": "Entender segmentação e roteamento.",
          "learn": "Cisco Networking Academy — catálogo de cursos.",
          "url": "https://www.netacad.com/pt/",
          "steps": [
            { "id": "e2-b4-s1", "type": "task", "text": "Dentro do catálogo, seguir o conteúdo introdutório de switching/routing." },
            { "id": "e2-b4-s2", "type": "task", "text": "Reproduzir a topologia no Packet Tracer." },
            { "id": "e2-b4-s3", "type": "note", "text": "Não avançar para o CCNA inteiro." }
          ],
          "readyWhen": "Tenho uma topologia com duas redes/VLANs e consigo explicar por que o tráfego precisa ser roteado.",
          "estimate": "2–3 horas"
        },
        {
          "id": "e2-b5",
          "code": "2.5",
          "title": "Troubleshooting",
          "period": "27–31/10/2026",
          "objective": "Investigar em vez de apenas configurar.",
          "learn": "Cisco Packet Tracer — modo Simulation.",
          "url": "https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000",
          "steps": [
            { "id": "e2-b5-s1", "type": "task", "text": "Utilizar sua própria topologia." },
            { "id": "e2-b5-s2", "type": "task", "text": "Introduzir três problemas: IP, gateway e conexão." },
            { "id": "e2-b5-s3", "type": "task", "text": "Utilizar ping e Simulation para descobrir cada erro." }
          ],
          "readyWhen": "README com: problema → evidência → causa → correção.",
          "estimate": "60–90 minutos"
        }
      ]
    },
    {
      "id": "etapa-3",
      "number": 3,
      "title": "Novembro: GNS3",
      "period": "01/11/2026 – 15/11/2026",
      "objective": "Conhecer o segundo simulador sem transformar isso em uma segunda formação em redes.",
      "blocks": [
        {
          "id": "e3-b1",
          "code": "3.1",
          "title": "Instalação",
          "period": "01–03/11/2026",
          "objective": "Instalar e abrir seu primeiro projeto.",
          "learn": "GNS3 — Windows Installation.",
          "url": "https://docs.gns3.com/docs/getting-started/installation/windows",
          "steps": [
            { "id": "e3-b1-s1", "type": "task", "text": "Seguir a documentação oficial de instalação." },
            { "id": "e3-b1-s2", "type": "task", "text": "Abrir o GNS3." },
            { "id": "e3-b1-s3", "type": "task", "text": "Criar um projeto vazio." }
          ],
          "readyWhen": "GNS3 abre e você consegue criar/salvar um projeto.",
          "estimate": "30–60 minutos"
        },
        {
          "id": "e3-b2",
          "code": "3.2",
          "title": "Primeira topologia",
          "period": "04–08/11/2026",
          "objective": "Reproduzir uma rede pequena.",
          "learn": "GNS3 — Getting Started.",
          "url": "https://docs.gns3.com/",
          "steps": [
            { "id": "e3-b2-s1", "type": "task", "text": "Seguir o Getting Started." },
            { "id": "e3-b2-s2", "type": "task", "text": "Montar uma topologia simples." },
            { "id": "e3-b2-s3", "type": "note", "text": "Se o dispositivo ou IOS exigir uma imagem que você não possui, não procure imagem ilegal: utilize os dispositivos disponíveis no tutorial." }
          ],
          "readyWhen": "Projeto salvo + topologia documentada.",
          "estimate": "1,5–2 horas"
        },
        {
          "id": "e3-b3",
          "code": "3.3",
          "title": "Troubleshooting",
          "period": "09–15/11/2026",
          "objective": "Aplicar o raciocínio de redes em outra ferramenta.",
          "learn": "GNS3 — Documentation.",
          "url": "https://docs.gns3.com/",
          "steps": [
            { "id": "e3-b3-s1", "type": "task", "text": "Introduzir um erro simples na topologia." },
            { "id": "e3-b3-s2", "type": "task", "text": "Investigar a causa utilizando as ferramentas do GNS3." }
          ],
          "readyWhen": "Consigo explicar a diferença prática entre Packet Tracer e GNS3.",
          "estimate": "60–90 minutos"
        }
      ]
    },
    {
      "id": "etapa-4",
      "number": 4,
      "title": "Novembro e dezembro: Docker + Kubernetes",
      "period": "16/11/2026 – 15/12/2026",
      "objective": "Entender containers antes de entender orquestração.",
      "blocks": [
        {
          "id": "e4-b1",
          "code": "4.1",
          "title": "Docker — fundamentos",
          "period": "16–22/11/2026",
          "objective": "Entender imagem × container.",
          "learn": "Docker Docs — Get Started.",
          "url": "https://docs.docker.com/get-started/",
          "steps": [
            { "id": "e4-b1-s1", "type": "task", "text": "Seguir o tutorial Getting Started." },
            { "id": "e4-b1-s2", "type": "task", "text": "Executar um container." },
            { "id": "e4-b1-s3", "type": "task", "text": "Consultar logs." },
            { "id": "e4-b1-s4", "type": "task", "text": "Parar e remover o container." },
            { "id": "e4-b1-s5", "type": "task", "text": "Executá-lo novamente." }
          ],
          "readyWhen": "Consigo executar e explicar o ciclo de vida básico de um container.",
          "estimate": "1–2 horas"
        },
        {
          "id": "e4-b2",
          "code": "4.2",
          "title": "Dockerfile + Compose",
          "period": "23–30/11/2026",
          "objective": "Containerizar uma aplicação.",
          "learn": "Docker Docs — Get Started / Part 2: Containerize an application.",
          "url": "https://docs.docker.com/get-started/",
          "steps": [
            { "id": "e4-b2-s1", "type": "task", "text": "Seguir o tutorial oficial para criar uma imagem." },
            { "id": "e4-b2-s2", "type": "task", "text": "Avançar para a parte de múltiplos containers/Compose." }
          ],
          "readyWhen": "Repositório com Dockerfile + Compose funcionando.",
          "estimate": "2–3 horas"
        },
        {
          "id": "e4-b3",
          "code": "4.3",
          "title": "Kubernetes — conceitos",
          "period": "01–07/12/2026",
          "objective": "Entender Pod, Deployment e Service.",
          "learn": "Kubernetes — Learn Kubernetes Basics.",
          "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
          "steps": [
            { "id": "e4-b3-s1", "type": "task", "text": "Realizar os módulos 1–3 no navegador." },
            { "id": "e4-b3-s2", "type": "note", "text": "Não instalar nada localmente." }
          ],
          "readyWhen": "Consigo explicar Pod, Deployment e Service.",
          "estimate": "60–90 minutos"
        },
        {
          "id": "e4-b4",
          "code": "4.4",
          "title": "Kubernetes — prática",
          "period": "08–15/12/2026",
          "objective": "Fazer deploy, expor, escalar e atualizar.",
          "learn": "Kubernetes — Learn Kubernetes Basics.",
          "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
          "steps": [
            { "id": "e4-b4-s1", "type": "task", "text": "Realizar os módulos 4–6 do tutorial interativo." },
            { "id": "e4-b4-s2", "type": "task", "text": "Utilizar o ambiente de prática fornecido pelo próprio tutorial." }
          ],
          "readyWhen": "Complete deploy → expose → scale → update → debug.",
          "estimate": "1,5–2 horas"
        }
      ]
    },
    {
      "id": "etapa-5",
      "number": 5,
      "title": "Dezembro e janeiro: Azure",
      "period": "16/12/2026 – 31/01/2027",
      "objective": "Conectar redes, containers e identidade com o ambiente cloud que você usa no trabalho.",
      "blocks": [
        {
          "id": "e5-b1",
          "code": "5.1",
          "title": "Azure base",
          "period": "16–20/12/2026",
          "objective": "Entender resource group, resource, subscription e region.",
          "learn": "Microsoft Learn — AZ-104 prerequisites.",
          "url": "https://learn.microsoft.com/en-us/training/paths/az-104-administrator-prerequisites/",
          "steps": [
            { "id": "e5-b1-s1", "type": "task", "text": "Realizar os módulos iniciais." },
            { "id": "e5-b1-s2", "type": "task", "text": "Explorar o portal e o Cloud Shell." }
          ],
          "readyWhen": "Consigo explicar a hierarquia básica do Azure.",
          "estimate": "60–90 minutos"
        },
        {
          "id": "e5-b2",
          "code": "5.2",
          "title": "Compute",
          "period": "21–28/12/2026",
          "objective": "Entender VM, App Service e containers.",
          "learn": "Microsoft Learn — Manage Azure compute resources.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-manage-compute-resources/",
          "steps": [
            { "id": "e5-b2-s1", "type": "task", "text": "Seguir o learning path até completar os exercícios principais." }
          ],
          "readyWhen": "Consigo escolher uma opção de compute para 3 cenários simples.",
          "estimate": "2 horas"
        },
        {
          "id": "e5-b3",
          "code": "5.3",
          "title": "Storage",
          "period": "29/12/2026–05/01/2027",
          "objective": "Entender Blob, Files, tiers e redundância.",
          "learn": "Microsoft Learn — Manage Azure Storage.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-manage-storage/",
          "steps": [
            { "id": "e5-b3-s1", "type": "task", "text": "Realizar os módulos de Storage Account e Blob." },
            { "id": "e5-b3-s2", "type": "task", "text": "Completar os exercícios associados." }
          ],
          "readyWhen": "Consigo diferenciar Blob e Files e explicar tier/redundância.",
          "estimate": "2 horas"
        },
        {
          "id": "e5-b4",
          "code": "5.4",
          "title": "Networking",
          "period": "06–15/01/2027",
          "objective": "Levar networking para Azure.",
          "learn": "Microsoft Learn — Manage virtual networking.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-manage-virtual-networks/",
          "steps": [
            { "id": "e5-b4-s1", "type": "task", "text": "Seguir os módulos de VNet, subnet, IP e NSG." },
            { "id": "e5-b4-s2", "type": "task", "text": "Realizar os exercícios." }
          ],
          "readyWhen": "Consigo desenhar uma VNet com subnets e explicar o NSG.",
          "estimate": "2–3 horas"
        },
        {
          "id": "e5-b5",
          "code": "5.5",
          "title": "Identity",
          "period": "16–23/01/2027",
          "objective": "Entender Entra ID e RBAC.",
          "learn": "Microsoft Learn — Manage identities and governance.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-manage-identities-governance/",
          "steps": [
            { "id": "e5-b5-s1", "type": "task", "text": "Realizar os módulos de Entra ID, RBAC e governance." }
          ],
          "readyWhen": "Consigo explicar autenticação × autorização e RBAC.",
          "estimate": "2 horas"
        },
        {
          "id": "e5-b6",
          "code": "5.6",
          "title": "Monitoramento",
          "period": "24–31/01/2027",
          "objective": "Entender monitoramento e logs.",
          "learn": "Microsoft Learn — Monitor and back up Azure resources.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-monitor-backup-resources/",
          "steps": [
            { "id": "e5-b6-s1", "type": "task", "text": "Realizar os módulos de Azure Monitor e Log Analytics." }
          ],
          "readyWhen": "Consigo dizer que dado procuraria em logs vs métricas.",
          "estimate": "1,5–2 horas"
        }
      ]
    },
    {
      "id": "etapa-6",
      "number": 6,
      "title": "Fevereiro: IaC + CI/CD",
      "period": "01/02/2027 – 28/02/2027",
      "objective": "Parar de depender do portal para tudo e automatizar o caminho até deploy.",
      "blocks": [
        {
          "id": "e6-b1",
          "code": "6.1",
          "title": "Terraform — primeiro projeto",
          "period": "01–07/02/2027",
          "objective": "Entender provider, resource, state, plan e apply.",
          "learn": "HashiCorp — Get Started Azure.",
          "url": "https://developer.hashicorp.com/terraform/tutorials/azure-get-started",
          "steps": [
            { "id": "e6-b1-s1", "type": "task", "text": "Realizar Build → Change → Destroy exatamente como no tutorial." }
          ],
          "readyWhen": "Consigo explicar init → plan → apply → destroy.",
          "estimate": "2–3 horas"
        },
        {
          "id": "e6-b2",
          "code": "6.2",
          "title": "Variables + outputs",
          "period": "08–14/02/2027",
          "objective": "Deixar o código reutilizável.",
          "learn": "HashiCorp — Get Started Azure.",
          "url": "https://developer.hashicorp.com/terraform/tutorials/azure-get-started",
          "steps": [
            { "id": "e6-b2-s1", "type": "task", "text": "Continuar o tutorial." },
            { "id": "e6-b2-s2", "type": "task", "text": "Transformar valores fixos em variables." },
            { "id": "e6-b2-s3", "type": "task", "text": "Adicionar outputs." }
          ],
          "readyWhen": "Meu projeto usa variables e outputs.",
          "estimate": "1,5–2 horas"
        },
        {
          "id": "e6-b3",
          "code": "6.3",
          "title": "OpenTofu",
          "period": "15–18/02/2027",
          "objective": "Conhecer a alternativa open-source compatível com Terraform.",
          "learn": "OpenTofu — Getting Started.",
          "url": "https://opentofu.org/docs/",
          "steps": [
            { "id": "e6-b3-s1", "type": "task", "text": "Ler o Getting Started." },
            { "id": "e6-b3-s2", "type": "task", "text": "Comparar o fluxo com o Terraform estudado anteriormente." }
          ],
          "readyWhen": "Consigo explicar a relação entre Terraform e OpenTofu.",
          "estimate": "45–60 minutos"
        },
        {
          "id": "e6-b4",
          "code": "6.4",
          "title": "GitHub Actions",
          "period": "19–28/02/2027",
          "objective": "Criar um pipeline básico.",
          "learn": "GitHub Actions — Quickstart.",
          "url": "https://docs.github.com/pt/actions/get-started/quickstart",
          "steps": [
            { "id": "e6-b4-s1", "type": "task", "text": "Seguir o Quickstart." },
            { "id": "e6-b4-s2", "type": "task", "text": "Fazer o workflow executar em um push." },
            { "id": "e6-b4-s3", "type": "task", "text": "Fazer o workflow produzir um artefato." }
          ],
          "readyWhen": "Tenho um workflow funcionando no GitHub.",
          "estimate": "1,5–2 horas"
        }
      ]
    },
    {
      "id": "etapa-7",
      "number": 7,
      "title": "Março: Observabilidade + arquitetura + projeto",
      "period": "01/03/2027 – 31/03/2027",
      "objective": "Juntar tudo e começar a raciocinar em termos de solução.",
      "blocks": [
        {
          "id": "e7-b1",
          "code": "7.1",
          "title": "Logs + métricas",
          "period": "01–07/03/2027",
          "objective": "Diferenciar logs, métricas e traces.",
          "learn": "Microsoft Learn — Monitor and back up Azure resources.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-monitor-backup-resources/",
          "steps": [
            { "id": "e7-b1-s1", "type": "task", "text": "Realizar os módulos de Azure Monitor." },
            { "id": "e7-b1-s2", "type": "task", "text": "Observar uma métrica ou um log de laboratório." }
          ],
          "readyWhen": "Consigo escolher qual tipo de dado usaria para investigar 3 problemas.",
          "estimate": "1,5–2 horas"
        },
        {
          "id": "e7-b2",
          "code": "7.2",
          "title": "KQL",
          "period": "08–14/03/2027",
          "objective": "Fazer consultas básicas.",
          "learn": "Microsoft Learn — Azure Monitor / Log Analytics.",
          "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-monitor-backup-resources/",
          "steps": [
            { "id": "e7-b2-s1", "type": "task", "text": "Utilizar o conteúdo de Log Analytics." },
            { "id": "e7-b2-s2", "type": "task", "text": "Realizar cinco queries simples." },
            { "id": "e7-b2-s3", "type": "task", "text": "Salvar as queries no arquivo queries.kql." }
          ],
          "readyWhen": "Tenho 5 queries comentadas.",
          "estimate": "1,5–2 horas"
        },
        {
          "id": "e7-b3",
          "code": "7.3",
          "title": "Arquitetura",
          "period": "15–21/03/2027",
          "objective": "Justificar escolhas técnicas.",
          "learn": "Azure Well-Architected Framework.",
          "url": "https://learn.microsoft.com/azure/well-architected/",
          "steps": [
            { "id": "e7-b3-s1", "type": "task", "text": "Ler os pilares relevantes." },
            { "id": "e7-b3-s2", "type": "task", "text": "Desenhar a arquitetura do projeto final." },
            { "id": "e7-b3-s3", "type": "task", "text": "Escrever cinco decisões técnicas e seus trade-offs." }
          ],
          "readyWhen": "Tenho diagrama + 5 decisões justificadas.",
          "estimate": "2 horas"
        },
        {
          "id": "e7-b4",
          "code": "7.4",
          "title": "Projeto final",
          "period": "22–31/03/2027",
          "objective": "Integrar o roadmap.",
          "learn": "Azure Architecture Center.",
          "url": "https://learn.microsoft.com/azure/architecture/",
          "steps": [
            { "id": "e7-b4-s1", "type": "task", "text": "Montar uma aplicação pequena que integre container, Azure, rede, identidade, IaC, CI/CD e monitoramento." },
            { "id": "e7-b4-s2", "type": "task", "text": "Reutilizar os tutoriais já estudados quando necessário." }
          ],
          "readyWhen": "GitHub com código, Dockerfile, IaC, workflow, README, diagrama e decisões.",
          "estimate": "4–6 horas"
        }
      ]
    }
  ],
  materials: [
    { "name": "Ubuntu — command line", "url": "https://ubuntu.com/tutorials/command-line-for-beginners" },
    { "name": "Ubuntu — user management", "url": "https://ubuntu.com/server/docs/how-to/security/user-management/" },
    { "name": "Microsoft Learn — Network Fundamentals", "url": "https://learn.microsoft.com/pt-br/training/modules/network-fundamentals/" },
    { "name": "Cisco Packet Tracer", "url": "https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000" },
    { "name": "GNS3 Docs", "url": "https://docs.gns3.com/" },
    { "name": "Docker Get Started", "url": "https://docs.docker.com/get-started/" },
    { "name": "Kubernetes Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
    { "name": "Azure Networking", "url": "https://learn.microsoft.com/pt-br/training/paths/az-104-manage-virtual-networks/" },
    { "name": "Terraform Azure", "url": "https://developer.hashicorp.com/terraform/tutorials/azure-get-started" },
    { "name": "GitHub Actions", "url": "https://docs.github.com/pt/actions/get-started/quickstart" }
  ],
  checkpoint: {
    "intro": "Não precisa marcar tudo como 'domino'. A meta é terminar março com uma base que você consegue demonstrar.",
    "items": [
      { "id": "ckpt-01", "area": "Linux", "text": "CLI, usuários, permissões, processos, serviços e logs." },
      { "id": "ckpt-02", "area": "Redes", "text": "TCP/IP, DNS, portas, IP/subnetting e troubleshooting." },
      { "id": "ckpt-03", "area": "Packet Tracer", "text": "rede pequena funcional + troubleshooting." },
      { "id": "ckpt-04", "area": "GNS3", "text": "instalação + topologia simples." },
      { "id": "ckpt-05", "area": "Docker", "text": "imagem, container, Dockerfile e Compose." },
      { "id": "ckpt-06", "area": "Kubernetes", "text": "Pod, Deployment, Service + deploy/scale/update." },
      { "id": "ckpt-07", "area": "Azure", "text": "compute, storage, VNet, NSG, Entra ID, RBAC e Monitor." },
      { "id": "ckpt-08", "area": "Terraform/OpenTofu", "text": "variables, outputs, state e ciclo básico." },
      { "id": "ckpt-09", "area": "GitHub Actions", "text": "workflow básico." },
      { "id": "ckpt-10", "area": "Observabilidade", "text": "logs, métricas e KQL." },
      { "id": "ckpt-11", "area": "Projeto final", "text": "projeto documentado." }
    ],
    "certification": "Depois do roadmap, você pode olhar para a AZ-104 usando o Study Guide oficial como checklist de cobertura. A certificação não é o critério de sucesso deste plano."
  }
};
