const {
  useState: useS,
  useEffect: useE,
  useRef: useR,
} = React;

/* custom cursor RAF loop */
function Cursor() {
  const dotRef = useR(null);
  const ringRef = useR(null);

  useE(() => {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let rx = tx, ry = ty;
    let hovering = false;
    let rafId;

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      rx = lerp(rx, tx, 0.14);
      ry = lerp(ry, ty, 0.14);
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMove = ({ clientX: x, clientY: y }) => {
      tx = x; ty = y;
      if (dotRef.current) {
        dotRef.current.style.left = x + 'px';
        dotRef.current.style.top = y + 'px';
      }
    };
    const onOver = e => {
      const t = e.target.closest('button,a,[role="button"],[class*="work-card"],[class*="country"]');
      if (t && !hovering) { hovering = true; document.body.classList.add('cursor-hover'); }
    };
    const onOut = e => {
      const t = e.target.closest('button,a,[role="button"],[class*="work-card"],[class*="country"]');
      if (t) { hovering = false; document.body.classList.remove('cursor-hover'); }
    };
    const onDown = () => document.body.classList.add('cursor-active');
    const onUp = () => document.body.classList.remove('cursor-active');

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mouseout', onOut);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

/* scroll reveal */
function useReveal() {
  const ref = useR(null);
  const [vis, setVis] = useS(false);
  useE(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}

function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const [ref, vis] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal${vis ? ' is-visible' : ''}${className ? ' ' + className : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* corner label */
function BrandMark() {
  return (
    <div className="brand-corner" aria-label="Mapping Self-Representation">
      <span className="bc-sym" aria-hidden="true">⊹</span>
      <div className="bc-text">
        <span className="bc-name">Mapping Self-Representation</span>
        <span className="bc-sub mono tiny">English 1102</span>
      </div>
    </div>
  );
}

/* atlas/map */
function Atlas({ onSelect, activeId }) {
  return (
    <section id="atlas" className="atlas-hero" aria-label="Interactive map of Asia">

      {/* top right instruction */}
      <div className="atlas-callout" aria-hidden="true">
        <p className="atlas-callout-text">
          <br />Select any country<br />
        </p>
      </div>

      <RealAsiaMap onSelect={onSelect} activeId={activeId} />

      <div className="atlas-scroll-prompt" aria-hidden="true">
        <span className="asp-label mono tiny">The Works</span>
        <div className="asp-line"><div className="asp-dot" /></div>
      </div>

    </section>
  );
}

/* works grid */
function Works({ onSelect }) {
  const keys = ['india', 'bangladesh', 'japan', 'korea'];

  const GRADIENTS = {
    india: 'linear-gradient(140deg, #C4914A 0%, #8B4A1A 100%)',
    bangladesh: 'linear-gradient(140deg, #3A8060 0%, #0E3E28 100%)',
    japan: 'linear-gradient(140deg, #4A5E9B 0%, #141E48 100%)',
    korea: 'linear-gradient(140deg, #A84B6A 0%, #521E34 100%)',
  };

  return (
    <section id="works" className="works" aria-label="Cultural works">
      <div className="section-wrap" style={{ marginBottom: 'clamp(40px, 6vh, 72px)' }}>
        <Reveal delay={100} as="h2" className="sec-title">
          Exit West,<br /><em>four exhibits.</em>
        </Reveal>
        <Reveal delay={200} as="p" className="works-intro">
          Asian cultural production in the 21st century is reshaping how Asia is understood globally. Moving away from the Western point of view, these works present perspectives that are grounded in their own contexts and experiences. Ultimately, these works reflect a diverse region that cannot be reduced to a single narrative. 
Explore the works below to see how each work offers a distinct way of understanding Asia.
        </Reveal>
      </div>

      <div className="works-grid">
        {keys.map((k, i) => {
          const c = window.EXHIBIT_CONTENT[k];
          return (
            <Reveal
              key={k}
              delay={i * 80}
              className="work-card"
              onClick={() => onSelect(k)}
              role="button"
              aria-label={`Open ${c.country} — ${c.work}`}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(k)}
            >
              <div className="card-num">№ {String(i + 1).padStart(2, '0')}</div>

              <div className="card-figure">
                <img
                  src={c.image}
                  alt={`${c.country} — ${c.work}`}
                  className="card-image"
                  loading="lazy"
                />
              </div>

              <div className="card-country">
                {c.country}
                <span className="card-script">{c.script}</span>
              </div>
              <div className="card-work">{c.work}</div>
              <div className="card-kind">{c.kind}</div>

              <div className="card-tags">
                {c.tags.map((t, i) => <span key={i} className="card-tag">{t}</span>)}
              </div>

              <div className="card-action">
                <span>Open exhibit</span>
                <span className="card-arrow">→</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* app */
function App() {
  const [active, setActive] = useS(null);

  useE(() => {
    window.__openCountry = id => setActive(id);
  }, []);

  return (
    <div className="app">
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <BrandMark />

      <main>
        <Atlas onSelect={setActive} activeId={active} />
        <Works onSelect={setActive} />
      </main>

      <CountryPanel id={active} onClose={() => setActive(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
