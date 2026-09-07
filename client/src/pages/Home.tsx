import React, { useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Library,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Mic2,
  Moon,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Video,
  WandSparkles,
  X,
} from "lucide-react";

const modes = [
  { id: "blog", label: "Blog post", icon: PenLine, eyebrow: "Long-form" },
  { id: "email", label: "Email", icon: Mail, eyebrow: "Conversion" },
  { id: "code", label: "Code", icon: Code2, eyebrow: "Build" },
  { id: "image", label: "Image", icon: ImageIcon, eyebrow: "Visual" },
  { id: "chat", label: "Chat", icon: MessageSquare, eyebrow: "Explore" },
  { id: "video", label: "Video plan", icon: Video, eyebrow: "Storyboard" },
] as const;

type ModeId = (typeof modes)[number]["id"];

type Draft = {
  title: string;
  kind: string;
  updated: string;
  color: string;
};

const initialDrafts: Draft[] = [
  { title: "A softer internet starts here", kind: "Blog post", updated: "Today, 09:42", color: "#b86446" },
  { title: "Welcome to the new season", kind: "Email", updated: "Yesterday", color: "#647b5a" },
  { title: "Amapiano launch campaign", kind: "Image", updated: "Aug 28", color: "#9e7b43" },
];

const examplePrompts: Record<ModeId, string> = {
  blog: "Write a thoughtful launch story for a South African creative studio. Keep it warm, specific and human.",
  email: "Draft a welcome email for a new Kamvai member. Make it concise, generous and confident.",
  code: "Build a responsive pricing card in React with accessible states and a calm editorial visual language.",
  image: "Create a visual direction for a Johannesburg night market campaign: tactile, cinematic, joyful.",
  chat: "Help me sharpen the idea behind a multilingual content studio made for African creators.",
  video: "Plan a 30-second product film that introduces Kamvai through a creator's first morning.",
};

const sampleOutput: Record<ModeId, string> = {
  blog: "The best tools do not make us louder. They make room for the thought that was already there. Kamvai is built for that kind of work: a calm South African studio for shaping ideas into words, images and code that feel like you.",
  email: "Subject: A better place to begin\n\nHi there,\n\nYour next good idea does not need a blank page. Open Kamvai, bring the rough edges, and let us help you turn them into something clear.\n\nSee you inside,\nThe Kamvai team",
  code: "export function QuietCard({ title, detail }: Props) {\n  return (\n    <article className=\"quiet-card\">\n      <span>{detail}</span>\n      <h3>{title}</h3>\n    </article>\n  );\n}",
  image: "Visual direction ready: sun-warmed terracotta, electric cobalt accents, hand-painted type, soft motion blur and a late-evening Johannesburg street scene. The image should feel lived-in, not polished flat.",
  chat: "Start with the audience's lived reality, not the category. Kamvai can be framed as a generous creative room: multilingual by nature, practical by default, and proudly rooted in the rhythm of the region.",
  video: "01 / The desk before sunrise\n02 / A note becomes a paragraph\n03 / Language, image and code move together\n04 / The finished piece leaves the studio",
};

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeMode, setActiveMode] = useState<ModeId>("blog");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = useMemo(() => modes.find((mode) => mode.id === activeMode) ?? modes[0], [activeMode]);
  const ActiveIcon = active.icon;

  function runGeneration() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setOutput("");
    window.setTimeout(() => {
      setOutput(sampleOutput[activeMode]);
      setIsGenerating(false);
    }, 650);
  }

  function saveDraft() {
    if (!output) return;
    setDrafts((current) => [
      { title: prompt.trim().slice(0, 34) || "Untitled idea", kind: active.label, updated: "Just now", color: activeMode === "blog" ? "#b86446" : activeMode === "image" ? "#9e7b43" : "#647b5a" },
      ...current,
    ]);
  }

  function copyOutput() {
    if (!output) return;
    void navigator.clipboard?.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function choosePrompt() {
    setPrompt(examplePrompts[activeMode]);
    setShowLibrary(false);
  }

  return (
    <div className={darkMode ? "kamvai-shell dark-shell" : "kamvai-shell"}>
      <aside className={showMobileNav ? "sidebar mobile-open" : "sidebar"}>
        <div className="sidebar-top">
          <a className="brand" href="#top" onClick={() => setShowMobileNav(false)}>
            <LogoMark />
            <span>kamvai</span>
          </a>
          <button className="icon-button sidebar-close" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">K</div>
          <div>
            <strong>Kamvai studio</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          <a className="nav-item active" href="#composer"><LayoutGrid size={17} /><span>Overview</span><kbd>⌘ 1</kbd></a>
          <a className="nav-item" href="#library" onClick={() => setShowLibrary(true)}><Library size={17} /><span>Library</span><span className="nav-count">{drafts.length}</span></a>
          <a className="nav-item" href="#prompts" onClick={choosePrompt}><BookOpen size={17} /><span>Prompt library</span></a>
          <span className="nav-label nav-label-spaced">Studio</span>
          {modes.slice(0, 4).map((mode) => {
            const Icon = mode.icon;
            return <button key={mode.id} className={activeMode === mode.id ? "nav-item mode-nav active-mode" : "nav-item mode-nav"} onClick={() => { setActiveMode(mode.id); setShowMobileNav(false); }}><Icon size={17} /><span>{mode.label}</span></button>;
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="credits-card">
            <div className="credits-heading"><span>Free allowance</span><span className="credits-dot" /></div>
            <strong>7 <small>/ 10 generations</small></strong>
            <div className="credits-meter"><span /></div>
            <p>Resets in 18 hours</p>
          </div>
          <a className="nav-item" href="#billing"><CreditCard size={17} /><span>Plans &amp; access</span></a>
          <a className="nav-item" href="#settings"><Settings2 size={17} /><span>Settings</span></a>
          <div className="profile-row">
            <div className="profile-avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "A"}</div>
            <div className="profile-copy"><strong>{user?.name ?? "Anele M."}</strong><span>{isAuthenticated ? "Signed in" : "Demo mode"}</span></div>
            {isAuthenticated ? <button className="icon-button" onClick={() => void logout()} aria-label="Log out"><LogOut size={15} /></button> : <button className="profile-login" onClick={() => startLogin()}>Sign in</button>}
          </div>
        </div>
      </aside>

      <main className="workspace" id="top">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setShowMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="topbar-search"><Search size={16} /><span>Search anything</span><kbd>⌘ K</kbd></button>
            <button className="icon-button" onClick={() => setDarkMode((value) => !value)} aria-label="Toggle theme">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="help-button">Need help?</button>
          </div>
        </header>

        <section className="workspace-content" id="composer">
          <div className="welcome-row">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> Tuesday, 07 September 2026</p>
              <h1>Make something<br /><em>worth keeping.</em></h1>
              <p className="lede">A focused place for the ideas you cannot stop thinking about.</p>
            </div>
            <button className="new-draft-button" onClick={() => { setPrompt(""); setOutput(""); }}><Plus size={17} /> New draft</button>
          </div>

          <div className="studio-grid">
            <section className="composer-card">
              <div className="card-topline"><div className="section-kicker"><ActiveIcon size={15} /><span>{active.eyebrow} / {active.label}</span></div><button className="icon-button subtle" aria-label="More options"><MoreHorizontal size={18} /></button></div>
              <div className="mode-tabs" role="tablist" aria-label="Creation mode">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return <button key={mode.id} className={activeMode === mode.id ? "mode-tab selected" : "mode-tab"} onClick={() => setActiveMode(mode.id)} role="tab" aria-selected={activeMode === mode.id}><Icon size={15} /><span>{mode.label}</span></button>;
                })}
              </div>
              <div className="prompt-area">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={examplePrompts[activeMode]} aria-label="Describe what you want to create" />
                <div className="prompt-tools"><div className="tool-group"><button className="tool-button" onClick={() => setPrompt(examplePrompts[activeMode])}><WandSparkles size={15} /> Inspire me</button><button className="tool-button"><Paperclip size={15} /> Attach</button><button className="tool-button"><Mic2 size={15} /> Voice</button></div><span className="character-count">{prompt.length}/1200</span></div>
              </div>
              <div className="composer-footer"><span className="model-pill"><Sparkles size={14} /> Kamvai / thoughtful <ChevronDown size={13} /></span><button className="generate-button" onClick={runGeneration} disabled={!prompt.trim() || isGenerating}>{isGenerating ? <><span className="button-spinner" /> Shaping...</> : <><span>Generate</span><ArrowUpRight size={16} /></>}</button></div>
            </section>

            <aside className="side-rail">
              <div className="rail-card signal-card"><div className="signal-orb"><span /><span /><span /></div><div><p className="eyebrow">Your creative pulse</p><strong>Keep the rough edges.</strong><p className="rail-copy">The first version is where the interesting questions show up.</p></div></div>
              <div className="rail-card prompt-card" id="prompts"><div className="rail-heading"><span>Prompt library</span><button className="text-button" onClick={() => setShowLibrary(true)}>View all <ArrowUpRight size={14} /></button></div><button className="featured-prompt" onClick={choosePrompt}><span className="prompt-icon"><Sparkles size={16} /></span><span><strong>Find the sharper angle</strong><small>For when the idea is almost there</small></span><ArrowUpRight size={15} /></button><button className="featured-prompt" onClick={() => setPrompt("Give me three distinct directions for this idea, each with a different emotional temperature.")}><span className="prompt-icon muted"><PenLine size={16} /></span><span><strong>Three ways in</strong><small>Open up a stuck first draft</small></span><ArrowUpRight size={15} /></button></div>
              <div className="rail-card quote-card"><span className="quote-mark">“</span><p>Language is not just a tool for communication. It is a way of seeing.</p><small>— Bessie Head</small></div>
            </aside>
          </div>

          <section className="output-section" aria-live="polite">
            <div className="section-heading"><div><p className="eyebrow">The workbench</p><h2>{output ? "A first shape" : "Your next good thing"}</h2></div><div className="heading-actions">{output && <><button className="outline-button" onClick={copyOutput}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button><button className="outline-button" onClick={saveDraft}><Plus size={15} /> Save draft</button></>}</div></div>
            {output ? <div className="output-card"><div className="output-meta"><span className="output-tag"><ActiveIcon size={14} /> {active.label}</span><span>Just now</span></div><div className="output-content">{output.split("\n").map((line, index) => line ? <p key={`${line}-${index}`}>{line}</p> : <br key={`break-${index}`} />)}</div><div className="output-footer"><span><Sparkles size={14} /> Shaped in Kamvai</span><button className="icon-button subtle"><MoreHorizontal size={17} /></button></div></div> : <div className="empty-workbench"><div className="empty-visual"><div className="empty-paper"><span /><span /><span /><span /></div><Sparkles className="empty-spark" size={20} /></div><div><h3>Nothing here yet.</h3><p>Start with a sentence, a feeling, or a question. We will help you find the rest.</p><button className="text-button" onClick={choosePrompt}>Use a prompt from the library <ArrowUpRight size={14} /></button></div></div>}
          </section>

          <section className="recent-section" id="library"><div className="section-heading compact"><div><p className="eyebrow">Recently opened</p><h2>Your little archive</h2></div><button className="text-button" onClick={() => setShowLibrary(true)}>Open library <ArrowUpRight size={14} /></button></div><div className="draft-grid">{drafts.slice(0, 3).map((draft, index) => <button className="draft-card" key={`${draft.title}-${index}`} onClick={() => { setPrompt(`Continue working on: ${draft.title}`); setActiveMode(draft.kind === "Email" ? "email" : draft.kind === "Image" ? "image" : "blog"); }}><div className="draft-art" style={{ background: `linear-gradient(135deg, ${draft.color}, #173f39)` }}><span>{draft.kind === "Blog post" ? "Aa" : draft.kind === "Email" ? "✦" : "◌"}</span></div><div className="draft-info"><span>{draft.kind}</span><strong>{draft.title}</strong><small><Clock3 size={12} /> {draft.updated}</small></div><ArrowUpRight className="draft-arrow" size={16} /></button>)}</div></section>
        </section>

        <footer className="workspace-footer"><span>Made for the work that matters.</span><span className="footer-right"><span>English</span><span>•</span><span>South Africa</span><span>•</span><span>v1.0</span></span></footer>
      </main>

      {showLibrary && <div className="modal-backdrop" onClick={() => setShowLibrary(false)}><div className="library-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">The archive</p><h2>Prompt library</h2></div><button className="icon-button" onClick={() => setShowLibrary(false)} aria-label="Close library"><X size={18} /></button></div><div className="library-search"><Search size={16} /><input placeholder="Search prompts" autoFocus /></div><div className="library-list"><button onClick={choosePrompt}><span className="prompt-icon"><Sparkles size={16} /></span><span><strong>Find the sharper angle</strong><small>For when the idea is almost there</small></span><ArrowUpRight size={15} /></button><button onClick={() => { setPrompt("Turn this rough note into a clear, persuasive idea without losing its personality."); setShowLibrary(false); }}><span className="prompt-icon muted"><PenLine size={16} /></span><span><strong>Keep the personality</strong><small>Clarity without sanding it flat</small></span><ArrowUpRight size={15} /></button><button onClick={() => { setPrompt("Give me a surprising opening that makes this idea feel immediate and alive."); setShowLibrary(false); }}><span className="prompt-icon gold"><BookOpen size={16} /></span><span><strong>Open with a door</strong><small>Find the line that lets people in</small></span><ArrowUpRight size={15} /></button></div></div></div>}
    </div>
  );
}
