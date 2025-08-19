import { useState, useEffect } from 'react';
import gutenbergLogo from './assets/pg-logo.png'
import './App.css';

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
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to analyze the book.');
            }
            setResults(data); // { nodes: [...], links: [...] }
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <div>
                <a href="https://www.gutenberg.org/" target="_blank">
                    <img src={gutenbergLogo} alt="Project Gutenberg" />
                </a>
            </div>
            <h1>Book Graph Analyzer</h1>
            <form onSubmit={handleSubmit} className="card">
                <label htmlFor="bookId">Project Gutenberg Book ID</label>
                <input
                    id="bookId"
                    type="text"
                    placeholder="e.g. 1342 for Pride and Prejudice"
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Analyzing…' : 'Analyze'}
                </button>
            </form>

            {error && (
                <div className="card error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {results && (
                <div className="card">
                    <h2>Results</h2>
                    <p>
                        Nodes: <strong>{results.nodes?.length ?? 0}</strong> • Links:{' '}
                        <strong>{results.links?.length ?? 0}</strong>
                    </p>
                    <details>
                        <summary>Show raw JSON</summary>
                        <pre style={{ overflowX: 'auto' }}>
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </main>
    );
}

export default App;
