import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force-3d';

export default function GraphView({ data, stats, className = '' }) {
    const ref = useRef(null);
    const fgRef = useRef();
    const [size, setSize] = useState({ w: 0, h: 0 });
    const [hoverNode, setHoverNode] = useState(null);
    const [hoverLink, setHoverLink] = useState(null);

    // helper for id extraction
    const idOf = useCallback((x) => (typeof x === 'object' ? x.id : x), []);

    // sentiment palette: red (neg) → gray (neu) → green (pos)
    const sentimentColor = useCallback((s) => {
        if (s == null) return '#9ca3af';
        if (s > 0.2) return '#22c55e';
        if (s < -0.2) return '#ef4444';
        return '#a3a3a3';
    }, []);

    // Node-level average sentiment (for node-only hover) — computed from incident links
    const nodeAvgSentiment = useMemo(() => stats?.avgSentimentMap ?? new Map(), [stats]);
    const nodeInteractions = useMemo(() => stats?.interactionsMap ?? new Map(), [stats]);

    // Is this link currently highlighted?
    const isLinkHighlighted = useCallback((l) => {
        if (!l) return false;
        if (hoverLink === l) return true;
        if (hoverNode) {
            const s = idOf(l.source), t = idOf(l.target);
            return s === hoverNode.id || t === hoverNode.id;
        }
        return false;
    }, [hoverLink, hoverNode, idOf]);

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

    // ---- Physics tuning incl. collision (to avoid node overlap)
    useEffect(() => {
        const g = fgRef.current;
        if (!g || !data) return;

        const charW = 7;
        const minW = 120;
        const padX = 12;
        const minH = 50;
        const padY = 8;

        // Space links based on label sizes
        g.d3Force('link').distance((l) => {
            const sLen = String(l.source?.id ?? '').length;
            const tLen = String(l.target?.id ?? '').length;
            const sW = Math.max(minW, sLen * charW + padX * 2);
            const tW = Math.max(minW, tLen * charW + padX * 2);
            const base = 120;
            const extra = 0.25 * (sW + tW);
            return base + extra;
        });

        // Repel a bit
        g.d3Force('charge').strength(-350).distanceMax(400);

        // Collision radius ~ half-diagonal of rounded-rect + small margin
        const rectRadius = (n) => {
            const w = Math.max(minW, String(n.id).length * charW + padX * 2);
            const h = Math.max(minH, 14 + padY * 2); // ~FONT_BASE + pads
            return Math.hypot(w, h) / 2 + 8;
        };
        g.d3Force('collide', forceCollide().radius(rectRadius).iterations(1).strength(1));

        g.d3ReheatSimulation();
    }, [data]);

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
            <div className="pointer-events-none absolute top-2 left-2 text-xs opacity-80 px-2 py-1 rounded bg-black/40 text-white">
                Hint: hover nodes/links to see sentiment • drag to pan
            </div>
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                width={size.w || undefined}
                height={size.h || undefined}

                // Cancel initial animation: pre-run offscreen & freeze
                warmupTicks={150}
                cooldownTicks={0}
                cooldownTime={0}
                onEngineStop={handleEngineStop}

                // Visuals (from CSS vars)
                backgroundColor={'--graph-bg'}
                nodeLabel={(n) => {
                    const id = String(n.id);
                    const total = nodeInteractions.get(id) ?? 0;
                    const s = nodeAvgSentiment.get(id);
                    const tag = s == null ? 'unknown' : (s > 0.33 ? 'pos' : s < -0.33 ? 'neg' : 'neu');
                    const sText = s == null ? tag : `${s.toFixed(2)} ${tag}`;
                    return `${id} • ${total} interaction${total === 1 ? '' : 's'} • ${sText}`;
                }}

                // Sentiment-aware highlighting for links
                linkColor={(l) => (isLinkHighlighted(l) ? sentimentColor(l.sentiment_score) : theme.stroke)}
                linkWidth={(l) => 1 + Math.log2(1 + (l.count ?? 1)) * 2}
                linkLabel={(l) => {
                    const s = typeof l.sentiment_score === 'number' ? l.sentiment_score : null;
                    const sText = s == null ? 'unknown' : `${s.toFixed(2)} ${s > 0.2 ? '(pos)' : s < -0.2 ? '(neg)' : '(neu)'}`;
                    return `${l.count ?? 1} interactions • sentiment: ${sText}`;
                }}

                // Replace node drawing; add sentiment-colored outline on highlight
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

                    // Is this node part of the current highlight context?
                    const nodeHighlighted =
                        (hoverNode && hoverNode === node) ||
                        (hoverLink && (idOf(hoverLink.source) === node.id || idOf(hoverLink.target) === node.id));

                    // choose outline color: hovered link sentiment when available, else node avg
                    const outlineSent =
                        hoverLink && (idOf(hoverLink.source) === node.id || idOf(hoverLink.target) === node.id)
                            ? hoverLink.sentiment_score
                            : nodeAvgSentiment.get(node.id);
                    const outlineColor = sentimentColor(outlineSent);

                    // draw rounded rect body
                    roundRect(ctx, x, y, w, h, 6);
                    ctx.fillStyle = node.color || theme.nodeFill;
                    ctx.fill();
                    ctx.lineWidth = Math.max(1, 1.2 / globalScale);
                    ctx.strokeStyle = theme.stroke;
                    ctx.stroke();

                    // extra sentiment outline on highlight
                    if (nodeHighlighted) {
                        ctx.save();
                        ctx.lineWidth = Math.max(2, 2.5 / globalScale);
                        ctx.strokeStyle = outlineColor;
                        // soft glow
                        ctx.shadowColor = outlineColor;
                        ctx.shadowBlur = 10;
                        roundRect(ctx, x, y, w, h, 6);
                        ctx.stroke();
                        ctx.restore();
                    }

                    // label
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

                // Hover handlers
                onNodeHover={(n) => { setHoverNode(n || null); if (n) setHoverLink(null); }}
                onLinkHover={(l) => { setHoverLink(l || null); if (l) setHoverNode(null); }}
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
