import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const isLight = theme === 'light';
    const targetBg = isLight ? 'var(--bg-dark)' : 'var(--bg-light)';

    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            title={isLight ? 'Switch to dark' : 'Switch to light'}
            style={{ background: targetBg }}
            className="fixed bottom-4 right-4 z-50 rounded-full px-3 py-2 text-sm shadow
                       text-[--card-fg] hover:opacity-90 transition"
        >
            {isLight ? '🌙' : '☀️'}
        </button>
    );
}
