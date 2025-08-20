import { useMemo, useState, useRef } from 'react';
import gutenbergLogo from './assets/pg-logo.png';
import GraphView from './components/GraphView.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import RankingTable from './components/RankingTable.jsx';
import { deriveStats } from './lib/deriveStats.js';

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
    const [bookId, setBookId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState({ nodes: [], links: [] });
    const stats = useMemo(() => (results ? deriveStats(results) : null), [results]);
    const abortRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults({ nodes: [], links: [] });

        const id = (bookId || '').trim();
        if (!id || !/^\d+$/.test(id)) {
            setError('Please enter a valid numeric Project Gutenberg book ID.');
            return;
        }

        try {
            setLoading(true);
            const controller = new AbortController();
            abortRef.current = controller;
            const res = await fetch(`${API_BASE}/api/analyze/${id}`, { signal: controller.signal });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Failed to analyze the book.');

            if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
                throw new Error('Analysis failed: The server returned an invalid data format.');
            }

            setResults(data); // { nodes: [...], links: [...] }
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const cancel = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setLoading(false);
    };

    return (
        <main className="mx-auto max-w-xl p-6 space-y-6">
            <ThemeToggle />
            <div className="text-center">
                <a href="https://www.gutenberg.org/" target="_blank" rel="noreferrer">
                    <img src={gutenbergLogo} alt="Project Gutenberg" className="w-1/2 inline-block" />
                </a>
            </div>

            <h1 className="text-xl font-semibold text-center">Book Graph Analyzer</h1>

            <form onSubmit={handleSubmit} className="card space-y-3">
                <label htmlFor="bookId" className="block font-medium">
                    Project Gutenberg Book ID
                </label>

                <input
                    id="bookId"
                    type="text"
                    placeholder="e.g. 1342 for Pride and Prejudice"
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    disabled={loading}
                    className="input"
                />

                <div className="flex gap-2 justify-center">
                    <button type="submit" disabled={loading} className="btn">
                        {loading ? 'Analyzing…' : 'Analyze'}
                    </button>
                    {loading && (
                        <button type="button" onClick={cancel} className="btn btn-ghost">
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {loading && (
                <div className="flex items-center gap-2 text-sm opacity-80">
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>Running analysis…</span>
                </div>
            )}

            {error && (
                <div className="rounded border p-3">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {results && results.nodes.length > 0 && (
                <div className="card space-y-4">
                    <p>
                        Nodes: <strong>{results.nodes?.length ?? 0}</strong> • Links:{' '}
                        <strong>{results.links?.length ?? 0}</strong>
                    </p>

                    <div className="graph-shell p-0">
                        <GraphView data={results} stats={stats} className="rounded-none border-0" />
                    </div>

                    {stats && (
                        <div className="space-y-2">
                            <h2 className="text-base font-semibold">Character rankings</h2>
                            <RankingTable rows={stats.rows} />
                        </div>
                    )}

                    <details>
                        <summary className="cursor-pointer">Show raw JSON</summary>
                        <pre className="max-h-[50vh] overflow-auto text-sm">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </main>
    );
}

export default App;
