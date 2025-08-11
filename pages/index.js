import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/*
 * Data definitions
 *
 * Update these values to customise your portfolio. The `works.graphics` and `works.video` arrays
 * drive the gallery. Graphics items support multiple images; video items link to external URLs.
 */
const DATA = {
  name: 'Arijit',
  roles: ['Creative Director', 'Designer', 'Animator'],
  about: {
    image: '/profile.jpg',
    text:
      'I am a multidisciplinary creative director with a passion for design, motion, and storytelling. This space is a curated selection of my work across different mediums. Replace this placeholder with your own bio to give visitors insight into your background and approach.',
  },
  works: {
    graphics: [
      {
        id: 'g1',
        title: 'Series One',
        description: 'A series of abstract graphics exploring light and form.',
        tags: ['abstract', 'light'],
        thumbnail: '/work1.jpg',
        images: ['/work1.jpg'],
      },
    ],
    video: [
      {
        id: 'v1',
        title: 'Motion Study',
        description: 'A short video exploring motion and rhythm.',
        tags: ['motion', 'study'],
        thumbnail: '/video1.jpg',
        url: 'https://example.com',
      },
    ],
  },
  email: 'replace@example.com',
  whatsapp: '911234567890',
  resumeURL: '#',
  socials: {
    instagram: '#',
    linkedin: '#',
  },
};

// Stubbed notification function. Integrate this with a serverless function or service of your choice.
function sendImmediatePing(message) {
  // Send a POST request to our API route. In production, this could trigger an email or SMS.
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  }).catch((err) => console.error(err));
}

/*
 * Vector index to help the chatbot find relevant projects and information. It builds a simple
 * vocabulary from all the documents (about text and work descriptions) and then computes
 * bag‑of‑words vectors. For each query, it calculates cosine similarity to recommend relevant
 * sections. This is a small, client‑side approximation of vector search.
 */
function useSiteIndex() {
  const docs = React.useMemo(() => {
    const base = [];
    base.push({ id: 'about', text: `${DATA.name} ${DATA.roles.join(' ')} ${DATA.about.text}` });
    DATA.works.graphics.forEach((g) => base.push({ id: g.id, text: `${g.title} ${g.description} ${g.tags.join(' ')}` }));
    DATA.works.video.forEach((v) => base.push({ id: v.id, text: `${v.title} ${v.description} ${v.tags.join(' ')}` }));
    return base;
  }, []);
  const vocab = React.useMemo(() => {
    const set = new Set();
    docs.forEach((d) => d.text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.forEach((w) => set.add(w)));
    return Array.from(set);
  }, [docs]);
  const matrix = React.useMemo(() => {
    return docs.map((d) => {
      const vec = new Float32Array(vocab.length);
      const counts = {};
      d.text.toLowerCase().match(/\b[a-z]{3,}\b/g)?.forEach((w) => (counts[w] = (counts[w] || 0) + 1));
      vocab.forEach((w, i) => {
        vec[i] = counts[w] ? Math.log(1 + counts[w]) : 0;
      });
      return { id: d.id, vec };
    });
  }, [docs, vocab]);
  return { docs, vocab, matrix };
}

function answerFromCorpus(q, index) {
  const query = q.toLowerCase();
  if (/email|contact|reach|connect/.test(query)) return `You can reach ${DATA.name} at ${DATA.email} or WhatsApp ${DATA.whatsapp}.`;
  if (/resume|cv/.test(query)) return DATA.resumeURL !== '#' ? `Here is the resume: ${DATA.resumeURL}` : 'The resume link will be added soon.';
  if (/role|what do you do|experience|years/.test(query)) return `${DATA.name} works as ${DATA.roles.join(', ')}.`;
  const tokens = query.match(/\b[a-z]{3,}\b/g) || [];
  if (!tokens.length) return 'Ask about projects, roles, resume, or how to contact.';
  const qvec = new Float32Array(index.vocab.length);
  tokens.forEach((t) => {
    const i = index.vocab.indexOf(t);
    if (i !== -1) qvec[i] += 1;
  });
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const qn = norm(qvec) || 1;
  const scored = index.matrix
    .map((row) => {
      const dn = norm(row.vec) || 1;
      return { id: row.id, score: dot(qvec, row.vec) / (qn * dn) };
    })
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).filter((x) => x.score > 0.05);
  if (!top.length) return 'I can answer questions about Arijit, the work on this site, and how to connect.';
  const names = top
    .map((t) => {
      const g = DATA.works.graphics.find((x) => x.id === t.id);
      const v = DATA.works.video.find((x) => x.id === t.id);
      if (g) return `${g.title} (graphics)`;
      if (v) return `${v.title} (video)`;
      return 'About';
    })
    .join(', ');
  return `You might be looking for: ${names}.`;
}

/**
 * Fractal blob component
 *
 * Each blob is a rotating torus knot that pulses in colour when hovered. The material colour
 * transitions to a lighter shade on pointer over and returns to dark when pointer out. Use
 * scale and position props to arrange them in space.
 */
function FractalBlob({ scale = 1, position = [0, 0, 0] }) {
  const meshRef = React.useRef();
  const [hovered, setHovered] = React.useState(false);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.2 * delta;
      meshRef.current.rotation.y += 0.15 * delta;
    }
  });
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* A torus knot provides an abstract, fractal‑inspired form */}
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshStandardMaterial
        color={hovered ? '#6B7280' : '#111827'}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

/**
 * 3D scene component
 *
 * Contains multiple fractal blobs arranged in space. The `frameloop="demand"` prop ensures
 * the canvas only re-renders when necessary, saving GPU resources. Ambient and directional
 * lights provide subtle illumination.
 */
function FractalField() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} className="h-[60vh] w-full" frameloop="demand">
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <FractalBlob scale={1.4} position={[0.2, 0.1, 0]} />
      <FractalBlob scale={0.9} position={[-2.2, -0.6, -1]} />
      <FractalBlob scale={0.8} position={[2.2, 0.6, -1]} />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={(2 * Math.PI) / 3} />
    </Canvas>
  );
}

/**
 * Hero section
 *
 * Displays the site title and a hero 3D scene. Uses an IntersectionObserver to delay loading of
 * the 3D scene until it enters the viewport, improving initial load performance.
 */
function Hero() {
  const containerRef = React.useRef(null);
  const [show3D, setShow3D] = React.useState(false);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setShow3D(true);
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section id="home" className="relative overflow-hidden border-b border-white/10 bg-black text-white" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <div className="text-sm uppercase tracking-widest text-white/60">Portfolio</div>
          <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">
            {DATA.name} — {DATA.roles.join(' · ')}
          </h1>
          <p className="mt-3 max-w-2xl text-white/70">Selected projects across design, motion, and direction.</p>
        </div>
        <div className="relative">
          {show3D ? (
            <FractalField />
          ) : (
            <div className="flex h-[60vh] w-full items-center justify-center">
              <div className="flex items-center gap-2 text-white/60">
                <span className="h-2 w-2 animate-ping rounded-full bg-white/60" />
                <span>Loading interactive scene…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * About section
 */
function About() {
  return (
    <section id="about" className="border-b border-white/10 bg-black px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-3">
        <div className="col-span-1 flex items-start justify-center">
          <img
            src={DATA.about.image}
            alt="Profile"
            className="h-40 w-40 rounded-full object-cover border border-white/20"
          />
        </div>
        <div className="col-span-2 flex flex-col justify-center space-y-4 text-white/80">
          <h2 className="text-2xl font-semibold">About Me</h2>
          <p>{DATA.about.text}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Works section with tabs for graphics and video.
 */
function Works() {
  const [tab, setTab] = React.useState('graphics');
  const [selectedGraphic, setSelectedGraphic] = React.useState(null);
  return (
    <section id="work" className="border-b border-white/10 bg-black px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold mb-6 text-white">My Work</h2>
        <div className="mb-6 flex gap-4">
          <button
            className={`pb-2 ${tab === 'graphics' ? 'border-b-2 border-white text-white' : 'text-white/60'}`}
            onClick={() => setTab('graphics')}
          >
            Graphics
          </button>
          <button
            className={`pb-2 ${tab === 'video' ? 'border-b-2 border-white text-white' : 'text-white/60'}`}
            onClick={() => setTab('video')}
          >
            Video
          </button>
        </div>
        {tab === 'graphics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {DATA.works.graphics.map((item) => (
              <div
                key={item.id}
                className="group relative cursor-pointer overflow-hidden border border-white/10"
                onClick={() => setSelectedGraphic(item)}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-48 object-cover grayscale transition duration-300 ease-in-out group-hover:grayscale-0"
                />
                <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                  <div>
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="text-xs text-white/70">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'video' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {DATA.works.video.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden border border-white/10"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-48 object-cover grayscale transition duration-300 ease-in-out group-hover:grayscale-0"
                />
                <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition duration-300">
                  <div>
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="text-xs text-white/70">{item.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
        {/* Modal for graphics */}
        {selectedGraphic && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedGraphic(null)}
          >
            <div
              className="relative max-h-[90vh] w-[90vw] max-w-3xl overflow-y-auto border border-white/20 bg-black p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedGraphic(null)}
                className="absolute right-2 top-2 text-white/60 hover:text-white"
              >
                ✕
              </button>
              <h3 className="mb-4 text-xl font-semibold text-white">{selectedGraphic.title}</h3>
              <div className="space-y-4">
                {selectedGraphic.images.map((src, idx) => (
                  <img key={idx} src={src} alt={`${selectedGraphic.title} ${idx + 1}`} className="w-full object-contain" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Connect section
 */
function Connect() {
  return (
    <section id="connect" className="bg-black px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="space-y-2 text-white">
          <h2 className="text-2xl font-semibold">Connect with Me</h2>
          <p>Email: <a href={`mailto:${DATA.email}`} className="underline">{DATA.email}</a></p>
          <p>WhatsApp: <a href={`https://wa.me/${DATA.whatsapp}`} className="underline" target="_blank" rel="noopener noreferrer">{DATA.whatsapp}</a></p>
          {DATA.resumeURL !== '#' && (
            <p>
              Resume: <a href={DATA.resumeURL} className="underline" target="_blank" rel="noopener noreferrer">View Resume</a>
            </p>
          )}
        </div>
        <div className="space-y-2 text-white/80">
          <h2 className="text-2xl font-semibold text-white">Socials</h2>
          {Object.entries(DATA.socials).map(([key, url]) => (
            <p key={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}:{' '}
              <a href={url} className="underline" target="_blank" rel="noopener noreferrer">
                {url}
              </a>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Chatbot component
 *
 * Provides a simple conversational interface. Messages are stored in state and rendered in
 * chronological order. When the user asks a question that indicates intent to connect or hire,
 * the `sendImmediatePing` function is triggered to alert the site owner.
 */
function Chatbot() {
  const index = useSiteIndex();
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState([
    { from: 'bot', text: `Hi! I can answer questions about ${DATA.name} and this portfolio.` },
  ]);
  const [draft, setDraft] = React.useState('');

  const ask = () => {
    if (!draft.trim()) return;
    const userMsg = { from: 'user', text: draft.trim() };
    const response = answerFromCorpus(draft.trim(), index);
    const botMsg = { from: 'bot', text: response };
    setLog((l) => [...l, userMsg, botMsg]);
    setDraft('');
    if (/connect|hire|work together|freelance|availability|call|phone|whatsapp|email/i.test(userMsg.text)) {
      sendImmediatePing(`Lead intent from site: "${userMsg.text}"`);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ask();
    }
  };
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          💬
        </button>
      )}
      {open && (
        <div className="relative h-96 w-72 rounded-lg bg-black/90 p-3 text-white shadow-lg">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 text-white/60 hover:text-white"
          >
            ✕
          </button>
          <div className="mb-2 text-sm font-semibold">Ask me anything</div>
          <div className="h-60 overflow-y-auto space-y-2 pr-1">
            {log.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                    msg.from === 'bot' ? 'bg-white/10 text-white/80' : 'bg-white text-black'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded-md border border-white/20 bg-black/50 px-2 py-1 text-sm placeholder-white/40 focus:outline-none"
              placeholder="Type your question…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={ask}
              className="rounded-md bg-white/20 px-2 py-1 text-sm hover:bg-white/30"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <Hero />
      <About />
      <Works />
      <Connect />
      <Chatbot />
    </div>
  );
}