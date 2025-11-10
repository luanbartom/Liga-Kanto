// ========================================================
// i18n helpers (versão sem tradução - usa valores originais)
// ========================================================

// Sem mapas de tradução: retorna os valores originais (EN)

export function typeLabel(type) {
  if (type == null) return '';
  return typeof type === 'string' ? type : String(type);
}

export function statusLabel(status) {
  if (status == null) return '';
  return typeof status === 'string' ? status : String(status);
}

// Nomes de golpes sempre originais (já era assim)
export function moveName(move) {
  if (!move) return '';
  if (typeof move === 'string') return move;
  return move.display || move.name || move.move || move.id || '';
}

// Rótulo para UI: mantém chip de tipo usando valor original
export default { typeLabel, statusLabel, moveName };
// Helpers sem tradução: usa valores originais (EN)
