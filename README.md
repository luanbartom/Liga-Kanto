KANTO LEAGUE — Projeto Acadêmico (Next.js)
==================================================

Aviso importante
- Este é um projeto estritamente acadêmico/educacional.
- Não possui, não teve e nunca terá fins lucrativos.
- “Pokémon” e demais marcas/ativos visuais são de seus respectivos detentores. Este repositório não é afiliado, endossado ou patrocinado por quaisquer detentores dessas marcas. Os assets são utilizados exclusivamente para estudo.

Visão geral
- Aplicação web que simula uma experiência simplificada de batalhas Pokémon com seleção de treinador(a), escolha de equipe e combate por turnos.
- Totalmente client-side, usando dados locais (pokedex.json e sprites em `public/`, dados extraídos da PokeApi).
- Regras didáticas: equipe com 3 Pokémon (um de cada estágio 1/2/3), rounds temáticos de tipos e fase Boss.

Stack técnica
- Next.js 15 + React 19
- CSS Modules
- Dados locais: `public/pokedex.json` e sprites estáticos/animados em `public/sprites/`

Requisitos
- Node.js 20+ (recomendado LTS) e npm 10+ (ou pnpm/yarn/bun, se preferir)

Como rodar localmente
1) Instale as dependências:
   - npm: `npm install`
   - ou pnpm: `pnpm install`
   - ou yarn: `yarn`
2) Inicie o servidor de desenvolvimento: `npm run dev`
3) Acesse: http://localhost:3000

Scripts disponíveis
- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build de produção
- `npm run start`: inicia o servidor após o build
- `npm run lint`: executa o ESLint

Fluxo de uso (jogando)
1) Home (`/`)
   - Escolha o(a) treinador(a) e defina um nome. Essas informações são salvas em `localStorage`.
2) Seleção de Pokémon (`/select-pokemon`)
   - Filtre por nome/tipo/estágio.
   - Regra: selecione exatamente 3 Pokémon contendo 1 de cada estágio (1, 2 e 3).
   - Pokémon marcados como Boss aparecem bloqueados (cinza) se não estiverem desbloqueados.
   - A barra superior mostra seu ícone e um botão de “Conquistas”.
3) Seleção de inicial/ordem (`/select-team`)
   - Visualize seu trio e a prévia do time inimigo do round atual.
   - Escolha com qual Pokémon iniciar a batalha.
4) Batalha (`/battle`)
   - Batalha por turnos com cálculo de dano, efetividade, STAB e possíveis efeitos de status.
   - Ao derrotar os oponentes, pode haver fase Boss em rounds específicos.

Regras principais do jogo
- Equipe do(a) jogador(a): exatamente 3 Pokémon, um de cada estágio (1, 2 e 3) — validado ao confirmar.
- Rounds/Tipos (em `src/pages/select-team.js` → `TYPE_RULES`):
  - Round 1: fighting, rock, ground
  - Round 2: water, ice
  - Round 3: ghost, poison (força a presença de Gengar)
  - Round 4: dragon
  - Boss: escolhe aleatoriamente um Boss dentre os disponíveis
- Inimigos por batalha: 3 (ajustável no código)
- Boss: usa parâmetros diferenciados de nível/ataque/defesa/HP

Dados e fontes
- Pokédex local: `public/pokedex.json` (lido por `src/utils/api.js`)
- Sprites locais: `public/sprites/static/{id}.png` e `public/sprites/gif/{id}.gif`
- Arenas/fundos e ícones: `public/*.png`

Persistência (localStorage)
- `trainerName`: nome do(a) treinador(a)
- `selectedTrainer`: id do treinador(a) escolhido
- `selectedTeam`: JSON com os 3 Pokémon selecionados
- `starterIndex`: índice do Pokémon que inicia a batalha
- `enemyTeam`: JSON com o time inimigo gerado
- `battleProgressRound`: round atual da progressão (controle de UI)
- `unlockedBosses`: array de IDs de Boss desbloqueados (usado na UI de conquistas)

Arquitetura e pontos de customização
- Páginas
  - `src/pages/index.js`: Home/seleção de treinador(a)
  - `src/pages/select-pokemon.js`: filtros/regra 1-2-3 e seleção
  - `src/pages/select-team.js`: geração de inimigos por round e escolha do inicial
  - `src/pages/battle.js`: motor da batalha (cálculo de dano, turnos, status)
- Componentes
  - `src/components/HPBar.js` e `ConditionBar.js`: HUD do HP e status
  - `src/components/ui/AttackMenu.jsx`: menu de golpes com tooltip
  - `src/components/ui/ConfirmButton.jsx`: botão de ação
- Utilitários
  - `src/utils/api.js`: leitura da pokédex e helpers (`getAllPokemons`, `getPokemon`, `getMove`)
  - `src/utils/moves.js`: efeitos de estágios, descrição de golpes e tabela de efetividade
  - `src/utils/boss.js`: identificação de Boss por id/nome
- Estilos
  - `src/styles/*.module.css`: estilos isolados por página/componente
  - `src/styles/globals.css`: base global e backgrounds por tela

Balanço e regras (ajustes rápidos)
- Parâmetros de batalha: `src/pages/battle.js` → objeto `TUNING` (nível, STAB, crítico, escalas de HP, buffs de Boss/jogador).
- Regras de rounds: `src/pages/select-team.js` → `TYPE_RULES`.
- Efeitos de golpes (estágios/status): `src/utils/moves.js` → `STAGE_MOVES` e helpers.

Limitações conhecidas
- O conjunto de golpes e metadados é simplificado e, quando necessário, inferido do dataset local.
- Nem todos os comportamentos oficiais da franquia estão modelados.
- A interface e textos priorizam clareza didática ao invés de fidelidade total.

Privacidade
- Não há backend obrigatório para o funcionamento básico.
- Dados salvos apenas no navegador (localStorage) para conveniência do usuário.

Contribuição
- Pull Requests e sugestões são bem-vindos, desde que mantenham o foco acadêmico/educacional.
- Evite adicionar materiais não compatíveis com uso livre acadêmico.

Licença e uso de marca
- Repositório para estudo/demonstração. Não licenciado para uso comercial.
- “Pokémon” e todos os nomes/logos relacionados são marcas registradas de seus respectivos proprietários.

Anexo
- Esboço do projeto no Excalidraw: https://excalidraw.com/#json=mZmnVSHnSAvlVC1l2mtan,jU-CqUw81FNPTI7WA8DEEA

Créditos
- Principais colboradores do projeto:
- Luan Bartom Silva e Silva (https://github.com/luanbartom)
- Ivan Lucas Miorandi (https://github.com/ivanlucasmiorandi)

- Agradecimentos especiais ao professor Matheus Pedro Rebeschini Grolli que nos orientou e nos deu todo o suporte para finalizar o projeto.