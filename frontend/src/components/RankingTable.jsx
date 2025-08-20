import { useMemo } from 'react';

function SentimentBadge({ value }) {
    if (value == null) return <span className="px-2 py-0.5 rounded bg-neutral-700/40">—</span>;
    const tag = value > 0.33 ? 'pos' : value < -0.33 ? 'neg' : 'neu';
    const bg =
        tag === 'pos' ? 'bg-green-600/30' :
            tag === 'neg' ? 'bg-red-600/30' :
                'bg-gray-500/30';
    return (
        <span className={`px-2 py-0.5 rounded ${bg}`}>
            {value.toFixed(2)} {tag}
        </span>
    );
}

export default function RankingTable({ rows }) {
    // rows: [{ id, appearances, interactions, avgSentiment }]
    const sorted = useMemo(
        () => [...(rows || [])].sort((a, b) => (b.interactions ?? 0) - (a.interactions ?? 0)),
        [rows]
    );

    return (
        <div className="w-full overflow-auto rounded border">
            <table className="min-w-full text-sm">
                <thead className="bg-neutral-900 sticky top-0">
                    <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Character</th>
                        <th className="text-right px-3 py-2">Appearances</th>
                        <th className="text-right px-3 py-2">Interactions</th>
                        <th className="text-right px-3 py-2">Avg sentiment</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((r, i) => (
                        <tr key={r.id} className="odd:bg-neutral-900/40">
                            <td className="px-3 py-2">{i + 1}</td>
                            <td className="px-3 py-2">{r.id}</td>
                            <td className="px-3 py-2 text-right">{r.appearances ?? 0}</td>
                            <td className="px-3 py-2 text-right">{r.interactions ?? 0}</td>
                            <td className="px-3 py-2 text-right"><SentimentBadge value={r.avgSentiment} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
