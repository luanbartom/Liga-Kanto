import { typeLabel, moveName } from '@/utils/i18n';

export default function MoveLabel({ move }) {
  if (!move) return null;
  const name = moveName(move);
  const type = move && (move.type || move.element) ? String(move.type || move.element) : '';

  return (
    <span>
      {type ? (
        <span
          style={{
            display: 'inline-block',
            padding: '0 6px',
            marginRight: 6,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: '16px',
            color: '#fff',
            backgroundColor: '#888',
            verticalAlign: 'middle',
          }}
        >
          {typeLabel(type)}
        </span>
      ) : null}
      {name}
    </span>
  );
}
