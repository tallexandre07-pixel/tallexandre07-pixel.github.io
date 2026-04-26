const { useState: mS, useEffect: mE, useMemo: mM, useRef: mR } = React;

const INTERACTIVE = {
  IN: { id: 'india', label: 'India', subLabel: 'The White Tiger' },
  BD: { id: 'bangladesh', label: 'Bangladesh', subLabel: 'Coke Studio Bangladesh' },
  JP: { id: 'japan', label: 'Japan', subLabel: 'Studio Ghibli' },
  KR: { id: 'korea', label: 'South Korea', subLabel: 'Crash Landing on You' }
};

const PIN_COORDS = {
  IN: [78.9, 22.0],
  BD: [90.4, 23.7],
  JP: [138.0, 36.5],
  KR: [127.8, 36.5]
};

const LABEL_OFFSETS = {
  IN: [150, -150],
  BD: [100, -60],
  JP: [-98, -75],
  KR: [-98, -42]
};

function mercator(lon, lat) {
  const x = lon;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * (180 / Math.PI);
  return [x, y];
}

function toPath(geom, project) {
  if (!geom) return '';
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      });
      d += 'Z';
    }
  }
  return d;
}

function RealAsiaMap({ onSelect, activeId }) {
  const [geo, setGeo] = mS(null);
  const [hover, setHover] = mS(null);
  const [mapReady, setMapReady] = mS(false);
  const [scanning, setScanning] = mS(false);
  const [coords, setCoords] = mS(null);

  mE(() => {
    let dead = false;
    fetch('https://cdn.amcharts.com/lib/5/geodata/json/worldLow.json')
      .then(r => r.json())
      .then(data => { if (!dead) setGeo(data); })
      .catch(e => console.warn('Map load failed', e));
    return () => { dead = true; };
  }, []);

  mE(() => {
    if (!geo) return;
    setTimeout(() => {
      setMapReady(true);
      setScanning(true);
      setTimeout(() => setScanning(false), 2300);
    }, 80);
  }, [geo]);

  const { features, interactive, viewBox, project, unproject } = mM(() => {
    if (!geo) return {
      features: [], interactive: [],
      viewBox: '0 0 1200 680',
      project: mercator,
      unproject: () => [0, 0],
    };

    const LON_MIN = 40, LON_MAX = 152, LAT_MIN = -12, LAT_MAX = 56;
    const [mx0, yTop] = mercator(LON_MIN, LAT_MAX);
    const [mx1, yBot] = mercator(LON_MAX, LAT_MIN);
    const srcW = mx1 - mx0;
    const srcH = yTop - yBot;
    const dstW = 1200;
    const dstH = dstW * (srcH / srcW);

    const project = (lon, lat) => {
      const [mx, my] = mercator(lon, lat);
      return [
        ((mx - mx0) / srcW) * dstW,
        ((yTop - my) / srcH) * dstH,
      ];
    };

    const unproject = (px, py) => {
      const lon = mx0 + (px / dstW) * srcW;
      const my = yTop - (py / dstH) * srcH;
      const lat = 2 * (Math.atan(Math.exp(my * Math.PI / 180)) - Math.PI / 4) * (180 / Math.PI);
      return [lon, lat];
    };

    const features = [];
    const interactive = [];
    for (const f of geo.features) {
      const iso = f.properties?.id || f.id;
      if (INTERACTIVE[iso]) interactive.push(f);
      else features.push(f);
    }

    return { features, interactive, viewBox: `0 0 ${dstW} ${dstH.toFixed(0)}`, project, unproject };
  }, [geo]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbParts = viewBox.split(' ').map(Number);
    const px = ((e.clientX - rect.left) / rect.width) * vbParts[2];
    const py = ((e.clientY - rect.top) / rect.height) * vbParts[3];
    const [lon, lat] = unproject(px, py);
    if (lon >= 40 && lon <= 152 && lat >= -12 && lat <= 56) {
      setCoords({ lon, lat });
    } else {
      setCoords(null);
    }
  };

  if (!geo) {
    return (
      <div className="map-wrap">
        <div className="map-loading">
          <div className="map-loading-dot" />
          <span>Loading cartography</span>
        </div>
      </div>
    );
  }

  const bgOpacity = { opacity: mapReady ? 1 : 0, transition: 'opacity 1.2s ease' };

  return (
    <div className="map-wrap">
      <svg
        viewBox={viewBox}
        className="asia-map"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Interactive map of Asia"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCoords(null)}
      >
        <defs>
          <filter id="pinGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* other countries */}
        <g style={bgOpacity}>
          {features.map((f, i) => {
            const d = toPath(f.geometry, project);
            return d ? <path key={i} d={d} className="bg-land" vectorEffect="non-scaling-stroke" /> : null;
          })}
        </g>

        {/* main countries w/ 3d wrapper */}
        <g>
          {interactive.map((f, i) => {
            const iso = f.properties?.id || f.id;
            const meta = INTERACTIVE[iso];
            if (!meta) return null;
            const d = toPath(f.geometry, project);
            if (!d) return null;
            const isHover = hover === iso;
            const isActive = activeId === meta.id;
            return (
              <g
                key={i}
                className={`country-lift${isHover ? ' is-hover' : ''}${isActive ? ' is-active' : ''}`}
                style={{
                  animationDelay: `${0.35 + i * 0.2}s`,
                  animationPlayState: mapReady ? 'running' : 'paused',
                }}
              >
                <path
                  d={d}
                  className="country-shape"
                  onMouseEnter={() => setHover(iso)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(meta.id)}
                  vectorEffect="non-scaling-stroke"
                  aria-label={`${meta.label} — click to explore`}
                  role="button"
                />
              </g>
            );
          })}
        </g>

        {/* pins */}
        <g style={{ opacity: mapReady ? 1 : 0, transition: 'opacity 0.6s ease 1.6s' }}>
          {Object.entries(PIN_COORDS).map(([iso, [lon, lat]]) => {
            const [cx, cy] = project(lon, lat);
            const meta = INTERACTIVE[iso];
            const isHover = hover === iso;
            const isActive = activeId === meta.id;
            const lit = isHover || isActive;
            return (
              <g key={iso} style={{ pointerEvents: 'none' }} className={`pin-group${lit ? ' is-lit' : ''}`}>
                {/* ripple */}
                <circle cx={cx} cy={cy} r="5" fill="var(--accent)" className="pin-ripple-1" />
                <circle cx={cx} cy={cy} r="5" fill="var(--accent)" className="pin-ripple-2" />
                {lit && <circle cx={cx} cy={cy} r="5" fill="var(--accent)" className="pin-ripple-3" />}
                {/* halo */}
                <circle
                  cx={cx} cy={cy}
                  r={lit ? 14 : 8}
                  className="pin-halo"
                />
                {/* dot */}
                <circle
                  cx={cx} cy={cy}
                  r={lit ? 5.5 : 3.5}
                  className="pin-dot"
                  filter={lit ? 'url(#pinGlow)' : undefined}
                />
              </g>
            );
          })}
        </g>

        {/* hover tooltip */}
        {hover && PIN_COORDS[hover] && (() => {
          const [lon, lat] = PIN_COORDS[hover];
          const [px, py] = project(lon, lat);
          const meta = INTERACTIVE[hover];
          const [ox, oy] = LABEL_OFFSETS[hover];
          const lx = px + ox;
          const ly = py + oy;
          const anchor = ox > 0 ? 'start' : 'end';
          const tx = lx + (ox > 0 ? 10 : -10);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={px} y1={py} x2={lx} y2={ly}
                stroke="var(--accent)" strokeWidth="0.8"
                opacity="0.5" strokeDasharray="4 3"
              />
              <circle cx={lx} cy={ly} r="2.5" fill="var(--accent)" opacity="0.7" />
              <text x={tx} y={ly + 4} textAnchor={anchor} className="hover-label-text">
                {meta.label}
              </text>
              <text x={tx} y={ly + 20} textAnchor={anchor} className="hover-label-sub">
                {meta.subLabel}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

window.RealAsiaMap = RealAsiaMap;
