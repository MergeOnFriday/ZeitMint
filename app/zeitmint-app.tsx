"use client";

import { FormEvent, useMemo, useState } from "react";

type Mode = "Now" | "Throwback" | "Hybrid";

type Concept = {
  name: string;
  ticker: string;
  score: number;
  lane: string;
  hook: string;
  description: string;
  palette: string;
};

const concepts: Record<Mode, Concept[]> = {
  Now: [
    {
      name: "Sunday Scaries",
      ticker: "SCARY",
      score: 94,
      lane: "Work culture",
      hook: "The weekend is down only.",
      description:
        "A weekly internet ritual turned into a self-aware coin for everyone watching Monday approach.",
      palette: "violet",
    },
    {
      name: "Scroll Tax",
      ticker: "SCROLL",
      score: 91,
      lane: "Internet life",
      hook: "You looked. You owe.",
      description:
        "A coin for the invisible fee we all pay every time five minutes becomes fifty.",
      palette: "blue",
    },
    {
      name: "Main Character",
      ticker: "PLOT",
      score: 89,
      lane: "Social culture",
      hook: "The timeline revolves around you.",
      description:
        "A playful salute to main-character energy, plot twists and posting through it.",
      palette: "coral",
    },
  ],
  Throwback: [
    {
      name: "Dial Up Dog",
      ticker: "MODEM",
      score: 92,
      lane: "Internet nostalgia",
      hook: "Connected eventually.",
      description:
        "A pixel-era pup for everyone who remembers when going online had a soundtrack.",
      palette: "blue",
    },
    {
      name: "Rage Quit Kid",
      ticker: "RAGE",
      score: 90,
      lane: "Gaming nostalgia",
      hook: "Alt. F4. Repeat.",
      description:
        "A loving callback to early reaction memes, broken keyboards and glorious overreactions.",
      palette: "coral",
    },
    {
      name: "Forum Legend",
      ticker: "OP",
      score: 87,
      lane: "Web 1.0",
      hook: "First post. Last word.",
      description:
        "For avatars, signatures, flame wars and the people who were online before it was content.",
      palette: "violet",
    },
  ],
  Hybrid: [
    {
      name: "Artificial Doge",
      ticker: "AIDOGE",
      score: 97,
      lane: "AI × 2021 nostalgia",
      hook: "Much model. Very synthetic.",
      description:
        "The original internet-dog grammar meets the age of agents, prompts and synthetic everything.",
      palette: "lime",
    },
    {
      name: "Pepe Has Logged On",
      ticker: "ONLINE",
      score: 95,
      lane: "Classic meme × now",
      hook: "The timeline felt it.",
      description:
        "A fresh, original amphibian archetype for the permanently online—not a copy of an existing project.",
      palette: "blue",
    },
    {
      name: "Bonk To The Future",
      ticker: "BTTF",
      score: 93,
      lane: "Solana × retro future",
      hook: "Where we’re going, we still need memes.",
      description:
        "A retro-futurist wink to the Solana cycle with chrome type, laser grids and zero promises.",
      palette: "violet",
    },
  ],
};

const pulseItems = [
  ["AI AGENTS", "+84%"],
  ["THROWBACK TECH", "+37%"],
  ["SUNDAY SCARIES", "+122%"],
  ["SOLANA MEMES", "+46%"],
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      ZM
    </span>
  );
}

export default function ZeitMintApp() {
  const [mode, setMode] = useState<Mode>("Hybrid");
  const [generatedMode, setGeneratedMode] = useState<Mode>("Hybrid");
  const [selected, setSelected] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [launchReserved, setLaunchReserved] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState("");

  const activeConcepts = concepts[generatedMode];
  const activeConcept = activeConcepts[selected];

  const socialPosts = useMemo(
    () => [
      `${activeConcept.name} ($${activeConcept.ticker}) is entering the timeline.`,
      activeConcept.hook,
      "Created with ZeitMint · Built on EmblemAI",
    ],
    [activeConcept],
  );

  function generate() {
    setIsGenerating(true);
    setLaunchReserved(false);
    window.setTimeout(() => {
      setGeneratedMode(mode);
      setSelected(0);
      setIsGenerating(false);
      document
        .getElementById("concept-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 650);
  }

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    if (!email.includes("@")) {
      setWaitlistMessage("Enter a valid email to join.");
      return;
    }
    setWaitlistMessage("You’re on the founding list. We’ll be in touch.");
    event.currentTarget.reset();
  }

  return (
    <main>
      <nav className="nav-shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="ZeitMint home">
          <BrandMark />
          <span>ZeitMint</span>
        </a>
        <div className="nav-links">
          <a href="#studio">Studio</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a className="button button-small button-ghost" href="#studio">
          Open studio <span>↗</span>
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> Culture moves fast. Mint faster.
          </div>
          <h1>
            Mint the
            <br />
            <span>moment.</span>
          </h1>
          <p>
            ZeitMint turns today’s trends and yesterday’s internet lore into
            original, launch-ready memecoins—before the moment moves on.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#studio">
              Create a coin <span>↗</span>
            </a>
            <a className="text-link" href="#how">
              See how it works <span>↓</span>
            </a>
          </div>
          <div className="trust-row">
            <span>Powered by</span>
            <strong>EmblemAI</strong>
            <i />
            <span>Launching on</span>
            <strong>Solana</strong>
          </div>
        </div>

        <div className="hero-card-wrap" aria-label="Example ZeitMint concept">
          <div className="signal-card">
            <div className="signal-card-top">
              <span>ZEIT SIGNAL / 08.02</span>
              <span className="signal-badge">97 HOT</span>
            </div>
            <div className="coin-art coin-art-lime">
              <span className="coin-face">◉</span>
              <span className="coin-spark spark-a">✦</span>
              <span className="coin-spark spark-b">✦</span>
              <span className="coin-ring" />
            </div>
            <div className="signal-card-copy">
              <span>HYBRID CONCEPT</span>
              <h2>Artificial Doge</h2>
              <p>$AIDOGE · Much model. Very synthetic.</p>
            </div>
            <div className="signal-bars" aria-label="Concept signal score 97 out of 100">
              <span style={{ width: "97%" }} />
            </div>
          </div>
          <div className="float-tag float-tag-one">Originality: clear</div>
          <div className="float-tag float-tag-two">Trend velocity ↑</div>
        </div>
      </section>

      <div className="pulse-strip" aria-label="Trending signals">
        <span className="pulse-label">LIVE PULSE</span>
        <div className="pulse-items">
          {pulseItems.map(([label, value]) => (
            <span key={label}>
              {label} <em>{value}</em>
            </span>
          ))}
        </div>
      </div>

      <section className="studio section-shell" id="studio">
        <div className="section-heading">
          <div>
            <span className="section-index">01 / THE STUDIO</span>
            <h2>What kind of moment are we minting?</h2>
          </div>
          <p>
            Pick a signal lane. ZeitMint develops the concept, checks it for
            obvious conflicts and builds the launch kit.
          </p>
        </div>

        <div className="mode-picker" role="radiogroup" aria-label="Concept mode">
          {(["Now", "Throwback", "Hybrid"] as Mode[]).map((item) => (
            <button
              className={mode === item ? "mode-card active" : "mode-card"}
              key={item}
              onClick={() => setMode(item)}
              role="radio"
              aria-checked={mode === item}
            >
              <span>{item === "Now" ? "◷" : item === "Throwback" ? "↶" : "✦"}</span>
              <strong>{item}</strong>
              <small>
                {item === "Now"
                  ? "What the internet is talking about today."
                  : item === "Throwback"
                    ? "A fresh wink to an earlier meme era."
                    : "Current energy with nostalgic internet DNA."}
              </small>
            </button>
          ))}
        </div>

        <div className="studio-controls">
          <label>
            CULTURE LANE
            <select defaultValue="Internet culture" aria-label="Culture lane">
              <option>Internet culture</option>
              <option>Crypto culture</option>
              <option>Entertainment</option>
              <option>Gaming</option>
              <option>Work & daily life</option>
            </select>
          </label>
          <label>
            ENERGY
            <select defaultValue="Clever, self-aware" aria-label="Concept energy">
              <option>Clever, self-aware</option>
              <option>Chaotic, absurd</option>
              <option>Cute, collectible</option>
              <option>Retro, cultish</option>
            </select>
          </label>
          <button className="button button-primary generate-button" onClick={generate}>
            {isGenerating ? "Reading the moment…" : "Generate concepts"}
            <span>{isGenerating ? "◌" : "✦"}</span>
          </button>
        </div>

        <div className="concept-results" id="concept-results">
          <div className="results-header">
            <div>
              <span className="status-dot" /> SIGNAL SCAN COMPLETE
            </div>
            <span>3 strongest concepts · {generatedMode} mode</span>
          </div>
          <div className="concept-grid">
            {activeConcepts.map((concept, index) => (
              <button
                className={selected === index ? "concept-card selected" : "concept-card"}
                key={concept.name}
                onClick={() => {
                  setSelected(index);
                  setLaunchReserved(false);
                }}
                aria-pressed={selected === index}
              >
                <div className={`mini-art ${concept.palette}`}>
                  <span>{concept.ticker.slice(0, 2)}</span>
                  <i>✦</i>
                </div>
                <div className="concept-meta">
                  <span>{concept.lane}</span>
                  <strong>{concept.score}</strong>
                </div>
                <h3>{concept.name}</h3>
                <p className="ticker">${concept.ticker}</p>
                <p>{concept.hook}</p>
                <span className="select-label">
                  {selected === index ? "Selected ✓" : "Select concept"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="launch-builder">
          <div className="launch-preview">
            <span className="section-index">SELECTED CONCEPT</span>
            <div className={`large-art ${activeConcept.palette}`}>
              <span>{activeConcept.ticker.slice(0, 2)}</span>
              <i>✦</i>
              <b>{activeConcept.score}</b>
            </div>
            <div className="launch-title">
              <div>
                <h3>{activeConcept.name}</h3>
                <span>${activeConcept.ticker}</span>
              </div>
              <span className="clear-badge">CLEAR</span>
            </div>
            <p>{activeConcept.description}</p>
          </div>

          <div className="launch-kit">
            <span className="section-index">YOUR $49 LAUNCH KIT</span>
            <h3>Ready for the timeline.</h3>
            <ul>
              <li><span>01</span> Original square artwork</li>
              <li><span>02</span> Name, ticker, lore and description</li>
              <li><span>03</span> Basic conflict and safety scan</li>
              <li><span>04</span> EmblemAI launch preparation</li>
              <li><span>05</span> Three social launch posts</li>
            </ul>
            <div className="social-draft">
              {socialPosts.map((post) => (
                <p key={post}>{post}</p>
              ))}
            </div>
          </div>

          <div className="checkout-card">
            <span className="section-index">LAUNCH REVIEW</span>
            <div className="price-row">
              <div>
                <strong>$49</strong>
                <span>one-time</span>
              </div>
              <span>Network fees separate</span>
            </div>
            <div className="checkout-line">
              <span>Launch pack</span>
              <strong>$49.00</strong>
            </div>
            <div className="checkout-line muted">
              <span>Developer buy</span>
              <strong>None</strong>
            </div>
            <button
              className={walletConnected ? "button button-connected" : "button button-dark"}
              onClick={() => setWalletConnected(true)}
            >
              {walletConnected ? "Demo wallet connected ✓" : "Connect Emblem wallet"}
            </button>
            <button
              className="button button-primary"
              disabled={!walletConnected}
              onClick={() => setLaunchReserved(true)}
            >
              Reserve founding launch <span>↗</span>
            </button>
            {launchReserved && (
              <p className="success-message">
                Launch reserved. Live payment and signing activate when the
                founding release opens.
              </p>
            )}
            <small>
              Nothing launches without your final approval. ZeitMint never
              stores your private keys.
            </small>
          </div>
        </div>
      </section>

      <section className="how section-shell" id="how">
        <div className="section-heading light-heading">
          <div>
            <span className="section-index">02 / HOW IT WORKS</span>
            <h2>From cultural signal to coin in three clean moves.</h2>
          </div>
          <p>Creative speed without giving up review, originality or control.</p>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <div className="step-icon">⌁</div>
            <h3>Catch the signal</h3>
            <p>
              ZeitMint scans current conversations and past meme cycles, then
              surfaces the strongest creative openings.
            </p>
          </article>
          <article>
            <span>02</span>
            <div className="step-icon">✦</div>
            <h3>Shape the coin</h3>
            <p>
              Choose a direction and receive original naming, artwork, lore and
              a launch-ready social kit.
            </p>
          </article>
          <article>
            <span>03</span>
            <div className="step-icon">↗</div>
            <h3>Approve the mint</h3>
            <p>
              Connect your wallet, review every detail and approve the EmblemAI
              launch yourself. You stay in control.
            </p>
          </article>
        </div>
      </section>

      <section className="principles section-shell">
        <div className="principle-copy">
          <span className="section-index">THE ZEITMINT STANDARD</span>
          <h2>Memes move fast. Trust should last.</h2>
          <p>
            ZeitMint is designed as creative launch software—not a promise of
            profit. Every launch is reviewed, attributed and signed by its
            creator.
          </p>
        </div>
        <div className="principle-list">
          <div><span>01</span><strong>Original by default</strong><p>No copied logos, cloned projects or confusing impersonation.</p></div>
          <div><span>02</span><strong>Creator controlled</strong><p>Your wallet, your approval and transparent developer-buy settings.</p></div>
          <div><span>03</span><strong>No fake promises</strong><p>No guaranteed returns, manufactured volume or hidden promotion.</p></div>
        </div>
      </section>

      <section className="pricing section-shell" id="pricing">
        <div className="pricing-copy">
          <span className="section-index">FOUNDING RELEASE</span>
          <h2>One moment.<br />One complete launch.</h2>
          <p>
            No subscription. No percentage of your creator fees. Start with one
            carefully made coin and keep everything ZeitMint creates for you.
          </p>
        </div>
        <div className="price-card">
          <div className="price-card-top">
            <span>LAUNCH PACK</span>
            <span>FOUNDING PRICE</span>
          </div>
          <strong className="price">$49</strong>
          <span className="price-note">one-time · network fees separate</span>
          <ul>
            <li>12+ original concepts</li>
            <li>Trend and nostalgia research</li>
            <li>Artwork and launch copy</li>
            <li>Safety and similarity scan</li>
            <li>EmblemAI launch preparation</li>
          </ul>
          <a className="button button-primary" href="#studio">
            Build my coin <span>↗</span>
          </a>
        </div>
      </section>

      <section className="waitlist">
        <div>
          <span className="section-index">EARLY ACCESS</span>
          <h2>Be there when the moment opens.</h2>
        </div>
        <form onSubmit={submitWaitlist} noValidate>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" placeholder="you@theinternet.xyz" />
          <button className="button button-dark" type="submit">Join the founding list ↗</button>
          {waitlistMessage && <p aria-live="polite">{waitlistMessage}</p>}
        </form>
      </section>

      <footer>
        <a className="brand" href="#top">
          <BrandMark />
          <span>ZeitMint</span>
        </a>
        <p>Mint the moment. Keep the keys.</p>
        <div>
          <a href="#studio">Studio</a>
          <a href="#how">Principles</a>
          <a href="mailto:hello@zeitmint.example">Contact</a>
        </div>
        <span>© 2026 ZeitMint · Built with EmblemAI</span>
      </footer>
    </main>
  );
}
