export function deriveStats(result) {
  const nodes = result?.nodes ?? [];
  const links = result?.links ?? [];

  // id -> row accumulator
  const rows = new Map();

  for (const n of nodes) {
    const id = String(n.id);
    const appearances = n.count ?? n.value ?? 0;
    rows.set(id, { id, appearances, interactions: 0, sentSum: 0, sentDenom: 0 });
  }

  // accumulate interactions & sentiment per endpoint, weighted by link.count
  for (const l of links) {
    const a = typeof l.source === 'object' ? l.source.id : l.source;
    const b = typeof l.target === 'object' ? l.target.id : l.target;
    const c = l.count ?? 1;
    const s = typeof l.sentiment_score === 'number' ? l.sentiment_score : null;

    for (const id of [a, b]) {
      if (!rows.has(id)) rows.set(id, { id, appearances: 0, interactions: 0, sentSum: 0, sentDenom: 0 });
      const r = rows.get(id);
      r.interactions += c;
      if (s != null) { r.sentSum += s * c; r.sentDenom += c; }
    }
  }

  // finalize
  const list = Array.from(rows.values()).map(r => ({
    id: r.id,
    appearances: r.appearances,
    interactions: r.interactions,
    avgSentiment: r.sentDenom ? (r.sentSum / r.sentDenom) : null
  }));

  // quick lookups for components
  const interactionsMap = new Map(list.map(r => [r.id, r.interactions]));
  const avgSentimentMap = new Map(list.map(r => [r.id, r.avgSentiment]));

  return { rows: list, interactionsMap, avgSentimentMap };
}
