import { useState } from 'react';
import gutenbergLogo from './assets/pg-logo.png';

function App() {
    const [bookId, setBookId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResults(null);

        const id = (bookId || '').trim();
        if (!id || !/^\d+$/.test(id)) {
            setError('Please enter a valid numeric Project Gutenberg book ID.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`http://127.0.0.1:5001/api/analyze/${id}`);
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Failed to analyze the book.');
            setResults(data); // { nodes: [...], links: [...] }
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-xl p-6 space-y-6">
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

                <button
                    type="submit"
                    disabled={loading}
                    className="btn mx-auto block"
                >
                    {loading ? 'Analyzing…' : 'Analyze'}
                </button>
            </form>

            {error && (
                <div className="rounded border p-3">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {results && (
                <div className="card space-y-4">
                    <p>
                        Nodes: <strong>{results.nodes?.length ?? 0}</strong> • Links:{' '}
                        <strong>{results.links?.length ?? 0}</strong>
                    </p>
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
