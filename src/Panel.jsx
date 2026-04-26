const { useEffect: pE, useState: pS, useRef: pR } = React;

// country schemes
const VISUALS = {
  india: {
    gradient: 'linear-gradient(140deg, #C4914A 0%, #8B4A1A 55%, #6B2E08 100%)',
    pattern: 'mandala',
    overlay: 'rgba(255,255,255,0.10)',
  },
  bangladesh: {
    gradient: 'linear-gradient(140deg, #3A8060 0%, #1F5E40 55%, #0E3E28 100%)',
    pattern: 'waves',
    overlay: 'rgba(200,240,220,0.10)',
  },
  japan: {
    gradient: 'linear-gradient(140deg, #4A5E9B 0%, #283878 55%, #141E48 100%)',
    pattern: 'circles',
    overlay: 'rgba(200,218,255,0.10)',
  },
  korea: {
    gradient: 'linear-gradient(140deg, #A84B6A 0%, #7A2F4C 55%, #521E34 100%)',
    pattern: 'grid',
    overlay: 'rgba(255,210,225,0.10)',
  }
};

// country svg's
function Pattern({ type, color }) {
  const fill = 'none';
  const op = 0.28;
  if (type === 'mandala') return (
    <g opacity={op}>
      {[70, 130, 195, 265, 338].map((r, i) => (
        <circle key={i} cx="400" cy="252" r={r}
          fill={fill} stroke={color} strokeWidth="0.7"
          strokeDasharray={`${r * 0.25} ${r * 0.08}`} />
      ))}
      {Array.from({ length: 16 }, (_, i) => i * 22.5).map((deg, i) => {
        const a = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={400 + Math.cos(a) * 28} y1={252 + Math.sin(a) * 28}
            x2={400 + Math.cos(a) * 338} y2={252 + Math.sin(a) * 338}
            stroke={color} strokeWidth="0.5" />
        );
      })}
      {[28, 56, 90].map((r, i) => (
        <circle key={`c${i}`} cx="400" cy="252" r={r}
          fill="none" stroke={color} strokeWidth={1.2 - i * 0.3} />
      ))}
    </g>
  );

  if (type === 'waves') return (
    <g opacity={op}>
      {Array.from({ length: 18 }, (_, i) => {
        const y = i * 29;
        const amp = 18 + (i % 3) * 8;
        return (
          <path key={i}
            d={`M 0 ${y} Q 200 ${y - amp} 400 ${y} Q 600 ${y + amp} 800 ${y}`}
            fill={fill} stroke={color} strokeWidth="0.7" />
        );
      })}
    </g>
  );

  if (type === 'circles') return (
    <g opacity={op}>
      {[[180, 180], [520, 260], [720, 130], [120, 380], [640, 400], [350, 440]].map(([cx, cy], i) => (
        [35, 70, 115, 170, 235].map((r, j) => (
          <circle key={`${i}-${j}`} cx={cx} cy={cy} r={r}
            fill={fill} stroke={color} strokeWidth="0.5" />
        ))
      ))}
    </g>
  );

  if (type === 'grid') return (
    <g opacity={op}>
      {Array.from({ length: 26 }, (_, i) => (
        <line key={`v${i}`} x1={i * 32} y1="0" x2={i * 32} y2="505" stroke={color} strokeWidth="0.5" />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 30} x2="800" y2={i * 30} stroke={color} strokeWidth="0.5" />
      ))}
      {[[-300, 0, 500, 505], [-100, 0, 700, 505], [100, 0, 900, 505], [300, 0, 1100, 505]].map(([x1, y1, x2, y2], i) => (
        <line key={`d${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.55" />
      ))}
    </g>
  );

  return null;
}

function PanelFigure({ id, visual }) {
  const data = window.EXHIBIT_CONTENT[id];

  return (
    <div
      className="panel-figure"
      style={!data.image ? { background: visual.gradient } : {}}
    >
      {data.image ? (
        <img
          src={data.image}
          alt={`${data.country} — ${data.work}`}
          className="panel-figure-image"
        />
      ) : (
        <>
          {/* fallback if no image */}
          <svg
            viewBox="0 0 800 450"
            className="panel-figure-svg"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <Pattern type={visual.pattern} color={visual.overlay} />
            <text x="400" y="240" textAnchor="middle" className="figure-watermark">
              {data.work}
            </text>
          </svg>
        </>
      )}

      <div className="panel-figure-caption">
        <span>{data.image ? '[ image ]' : '[ visual placeholder ]'}</span>
        <span>{data.kind}</span>
      </div>
    </div>
  );
}

function CountryPanel({ id, onClose }) {
  const [stage, setStage] = pS('closed');
  const data = id ? window.EXHIBIT_CONTENT[id] : null;
  const visual = id ? VISUALS[id] : null;

  pE(() => {
    if (id) {
      setStage('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => setStage('open')));
    }
  }, [id]);

  const handleClose = () => {
    setStage('leaving');
    setTimeout(() => { setStage('closed'); onClose(); }, 620);
  };

  // esc key & body scroll lock
  pE(() => {
    if (!id) return;
    const onKey = e => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [id]);

  if (stage === 'closed') return null;
  if (!data || !visual) return null;

  const keys = Object.keys(window.EXHIBIT_CONTENT);
  const idx = keys.indexOf(id);
  const others = keys.filter(k => k !== id);

  return (
    <div className={`panel-root panel-${stage}`} role="dialog" aria-modal="true" aria-label={`${data.country} — ${data.work}`}>
      {/* backdrop */}
      <div className="panel-scrim" onClick={handleClose} />

      {/* card */}
      <div className="panel-full">

        {/* body */}
        <div className="panel-body">

          {/* card sidebar */}
          <div className="panel-identity">
            <div className="pi-script" aria-hidden="true">{data.script}</div>
            <h2 className="pi-country">{data.country}</h2>
            <div className="pi-code mono tiny">{data.code} · {data.year}</div>

            <div className="pi-rule" />

            <h3 className="pi-work">{data.work}</h3>
            <div className="pi-kind mono tiny">{data.kind}</div>

            <div className="pi-tags">
              {data.tags.map((t, i) => (
                <span key={i} className="pi-tag">{t}</span>
              ))}
            </div>

            <button className="pi-back" onClick={handleClose}>
              <span className="pi-back-arrow">←</span>
              <span>Back to map</span>
            </button>
          </div>

          {/* content column */}
          <div className="panel-content">
            <PanelFigure id={id} visual={visual} />

            <p className="panel-summary">{data.summary}</p>

            <div className="panel-analysis">
              <div>
                <div className="analysis-label">The Western Lens</div>
                <p className="analysis-text">{data.simplification}</p>
              </div>
              <div>
                <div className="analysis-label">Reclaiming the Narrative</div>
                <p className="analysis-text">{data.actual}</p>
              </div>
            </div>

            <blockquote className="panel-quote">
              <span className="quote-ornament" aria-hidden="true">"</span>
              <p className="quote-text">{data.quote}</p>
              <cite className="quote-attr">{data.quoteAttr}</cite>
            </blockquote>
          </div>

        </div>
      </div>
    </div>
  );
}

window.CountryPanel = CountryPanel;
