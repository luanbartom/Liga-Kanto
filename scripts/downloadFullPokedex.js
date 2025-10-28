// scripts/downloadFullPokedex.js
import axios from "axios";
import fs from "fs";

const API = axios.create({ baseURL: "https://pokeapi.co/api/v2/" });
const CDN_BASE = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites";

async function getEvolutionStage(poke) {
  try {
    const speciesRes = await API.get(poke.species.url);
    const evoRes = await axios.get(speciesRes.data.evolution_chain.url);
    const chain = evoRes.data.chain;
    let stage = 1;
    function findStage(node, depth = 1) {
      if (node.species.name === poke.name) stage = depth;
      node.evolves_to.forEach((evo) => findStage(evo, depth + 1));
    }
    findStage(chain);
    return stage;
  } catch {
    return 1;
  }
}

async function main() {
  const TOTAL = 386; // até Ruby/Sapphire (Gen 3)
  console.log(`📦 Baixando dados dos ${TOTAL} Pokémon...`);

  const res = await API.get(`pokemon?limit=${TOTAL}`);
  const list = res.data.results;

  const all = [];
  let completed = 0;

  for (const [index, p] of list.entries()) {
    const id = index + 1;
    try {
      const pokeRes = await API.get(`pokemon/${id}`);
      const poke = pokeRes.data;
      const moves = poke.moves.slice(0, 4).map((m) => m.move.name);
      const types = poke.types.map((t) => t.type.name);
      const stats = poke.stats.reduce((a, s) => {
        a[s.stat.name] = s.base_stat;
        return a;
      }, {});
      const evolutionStage = await getEvolutionStage(poke);

      const obj = {
        id,
        name: poke.name,
        types,
        moves,
        evolutionStage,
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        sprite: `${CDN_BASE}/pokemon/${id}.png`,
        animated: `${CDN_BASE}/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
      };
      all.push(obj);

      completed++;
      if (completed % 25 === 0)
        console.log(`✅ ${completed}/${TOTAL} Pokémon baixados...`);
    } catch (err) {
      console.warn(`⚠️ Erro ao carregar #${id} (${p.name}):`, err.message);
    }
  }

  fs.mkdirSync("public/data", { recursive: true });
  fs.writeFileSync("public/data/pokedex.json", JSON.stringify(all, null, 2));

  console.log(`\n🎉 Concluído! ${all.length} Pokémon salvos em public/data/pokedex.json`);
}

main().catch((err) => console.error(err));
