import requests
import json
import time

# Arquivo final
OUTPUT_FILE = "moves.json"

# Lista de tipos principais
TYPES = [
    "normal","fire","water","electric","grass","ice","fighting","poison",
    "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
]

# Signature moves importantes
SIGNATURE_MOVES = [
    "frenzy-plant","blast-burn","hydro-cannon","v-create","blue-flare","fusion-bolt","fusion-flare",
    "bolt-strike","doom-desire","psystrike","origin-pulse","precipice-blades","dragon-ascent",
    "sacred-fire","aeroblast","luster-purge","mist-ball","roar-of-time","spacial-rend",
    "seed-flare","judgment","psycho-boost"
]

# Função para buscar moves por tipo
def get_moves_by_type(type_name):
    print(f"🔍 Buscando golpes do tipo {type_name}...")
    url = f"https://pokeapi.co/api/v2/type/{type_name}"
    r = requests.get(url)
    if r.status_code != 200:
        print(f"❌ Erro ao buscar tipo {type_name}")
        return []

    type_data = r.json()
    moves = type_data["moves"]
    details = []

    # Buscar detalhes de cada move
    for mv in moves:
        mv_name = mv["name"]
        mv_data = requests.get(f"https://pokeapi.co/api/v2/move/{mv_name}")
        if mv_data.status_code != 200:
            continue
        m = mv_data.json()

        power = m["power"] or 0
        # Ignora moves sem power
        if power == 0:
            continue

        details.append({
            "name": m["name"],
            "type": m["type"]["name"],
            "power": power,
            "accuracy": m["accuracy"],
            "damage_class": m["damage_class"]["name"] if m["damage_class"] else None,
            "priority": m["priority"],
            "effect": m["effect_entries"][0]["short_effect"] if m["effect_entries"] else None,
            "meta": {
                "crit_rate": m["meta"]["crit_rate"] if m["meta"] else 0,
                "drain": m["meta"]["drain"] if m["meta"] else 0,
                "healing": m["meta"]["healing"] if m["meta"] else 0,
                "min_hits": m["meta"]["min_hits"] if m["meta"] else None,
                "max_hits": m["meta"]["max_hits"] if m["meta"] else None
            }
        })
        time.sleep(0.15)  # evita flood da API

    # Ordena pelos mais fortes
    details.sort(key=lambda x: x["power"] or 0, reverse=True)
    return details[:10]  # top 10


# Gera o dicionário completo
moves_data = {}
for t in TYPES:
    moves_data[t] = get_moves_by_type(t)

# Adiciona signatures separadamente
print("✨ Adicionando signature moves...")
sig_moves = []
for mv in SIGNATURE_MOVES:
    url = f"https://pokeapi.co/api/v2/move/{mv}"
    r = requests.get(url)
    if r.status_code != 200:
        print(f"⚠️ Falhou {mv}")
        continue
    m = r.json()
    sig_moves.append({
        "name": m["name"],
        "type": m["type"]["name"],
        "power": m["power"],
        "accuracy": m["accuracy"],
        "damage_class": m["damage_class"]["name"] if m["damage_class"] else None,
        "priority": m["priority"],
        "effect": m["effect_entries"][0]["short_effect"] if m["effect_entries"] else None,
        "meta": {
            "crit_rate": m["meta"]["crit_rate"] if m["meta"] else 0,
            "drain": m["meta"]["drain"] if m["meta"] else 0,
            "healing": m["meta"]["healing"] if m["meta"] else 0,
            "min_hits": m["meta"]["min_hits"] if m["meta"] else None,
            "max_hits": m["meta"]["max_hits"] if m["meta"] else None
        }
    })
    time.sleep(0.15)

moves_data["signature"] = sig_moves

# Salvar JSON final
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(moves_data, f, ensure_ascii=False, indent=2)

print(f"✅ Arquivo '{OUTPUT_FILE}' gerado com sucesso!")
