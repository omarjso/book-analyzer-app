import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function GraphView({ data, className = '' }) {
    const ref = useRef(null);
    const fgRef = useRef();
    const [size, setSize] = useState({ w: 0, h: 0 });

    // Read CSS vars once per render (fast) with safe fallbacks
    const cssVar = useCallback((name, fallback) => {
        try {
            const v = getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim();
            return v || fallback;
        } catch {
            return fallback;
        }
    }, []);

    const theme = useMemo(
        () => ({
            graphBg: cssVar('--graph-bg', '#1f283b'),
            nodeFill: cssVar('--ring', '#f87171'),
            stroke: cssVar('--card-brd', '#7f1d1d'),
            text: cssVar('--fg', 'rgba(255, 255, 255, .87)'),
        }),
        [cssVar]
    );

    // Track container size
    useEffect(() => {
        if (!ref.current) return;
        const ro = new ResizeObserver(([entry]) => {
            const cr = entry.contentRect;
            setSize({ w: cr.width, h: cr.height });
        });
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);

    const handleResetView = useCallback(() => {
        if (fgRef.current) fgRef.current.zoomToFit(400, 50); // duration(ms), padding(px)
    }, []);

    // After physics stop (post-warmup), fit the camera once
    const handleEngineStop = useCallback(() => {
        if (!fgRef.current) return;
        requestAnimationFrame(() => {
            if (!fgRef.current) return;
            handleResetView();
        });
    }, [handleResetView]);

    // helper: rounded rect
    const roundRect = (ctx, x, y, w, h, r) => {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    };

    return (
        <div
            ref={ref}
            className={`relative w-full h-96 overflow-hidden rounded border ${className}`}
        >
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                width={size.w || undefined}
                height={size.h || undefined}

                // Cancel initial animation: pre-run offscreen & freeze
                warmupTicks={120}
                cooldownTicks={0}
                cooldownTime={0}
                onEngineStop={handleEngineStop}

                // Visuals (from CSS vars)
                backgroundColor={theme.graphBg}
                nodeLabel={(n) => String(n.val ?? n.id)}
                linkColor={(l) => l.color || theme.stroke}
                linkWidth={(l) => l.width ?? 2}

                // Replace default node with a labeled rounded rectangle
                nodeCanvasObjectMode={() => 'replace'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = String(node.id);
                    const fontSize = Math.max(6, 14 / globalScale);
                    ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;

                    const textWidth = ctx.measureText(label).width;

                    // base sizes (bigger nodes)
                    const padX = 12;
                    const padY = 8;
                    const minW = 90;
                    const minH = 32;

                    const w = Math.max(minW, textWidth + padX * 2);
                    const h = Math.max(minH, fontSize + padY * 2);
                    const x = node.x - w / 2;
                    const y = node.y - h / 2;

                    const fill = node.color || theme.nodeFill;
                    const stroke = theme.stroke;

                    // draw rounded rect
                    roundRect(ctx, x, y, w, h, 6);
                    ctx.fillStyle = fill;
                    ctx.fill();
                    ctx.lineWidth = Math.max(1, 1.2 / globalScale);
                    ctx.strokeStyle = stroke;
                    ctx.stroke();

                    // draw text
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = theme.text;
                    ctx.fillText(label, node.x, node.y);

                    // store for pointer interactions
                    node.__bckgDimensions = { w, h };
                }}

                // Make pointer area match the rectangle (so hover/click is accurate)
                nodePointerAreaPaint={(node, color, ctx) => {
                    const dims = node.__bckgDimensions;
                    if (!dims) return;
                    const { w, h } = dims;
                    const x = node.x - w / 2;
                    const y = node.y - h / 2;
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, w, h);
                }}
            />

            {/* Reset button overlay */}
            <button
                onClick={handleResetView}
                className="absolute top-2 right-2 btn text-xs px-2 py-1"
            >
                Reset View
            </button>
        </div>
    );
}
