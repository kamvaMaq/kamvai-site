import React, { useEffect, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
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
  Star,
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

type PromptTemplate = {
  id: string;
  title: string;
  description: string;
  category: "Strategy" | "Writing" | "Campaigns" | "Build" | "Visual";
  mode: ModeId;
  text: string;
};

type LibraryFilter = PromptTemplate["category"] | "All" | "Favorites";

const STORAGE_KEYS = {
  customPrompts: "kamvai.custom-prompts",
  recentTemplates: "kamvai.recent-templates",
  favorites: "kamvai.favorite-prompts",
} as const;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

const promptTemplates: PromptTemplate[] = [
  { id: "sharper-angle", title: "Find the sharper angle", description: "For when the idea is almost there", category: "Strategy", mode: "blog", text: "Take this idea and find the sharper angle: make the tension clear, the audience specific, and the reason to care immediate." },
  { id: "keep-personality", title: "Keep the personality", description: "Clarity without sanding it flat", category: "Writing", mode: "blog", text: "Turn this rough note into a clear, persuasive idea without losing its personality, texture, or point of view." },
  { id: "open-with-door", title: "Open with a door", description: "Find the line that lets people in", category: "Writing", mode: "blog", text: "Give me three surprising opening lines that make this idea feel immediate and alive, without using a cliché." },
  { id: "launch-map", title: "Map the launch", description: "A campaign with a clear rhythm", category: "Campaigns", mode: "email", text: "Build a warm three-part launch campaign for this idea: tease the tension, reveal the value, and invite a clear next step." },
  { id: "welcome-sequence", title: "Welcome with intention", description: "Make the first email feel human", category: "Campaigns", mode: "email", text: "Draft a short welcome email that makes a new member feel seen, gives them one useful first step, and sounds distinctly human." },
  { id: "quiet-interface", title: "Build the quiet interface", description: "A component with room to breathe", category: "Build", mode: "code", text: "Build a responsive React component for this idea with accessible states, calm hierarchy, and clear empty, loading, and error states." },
  { id: "visual-world", title: "Find the visual world", description: "Turn a feeling into a direction", category: "Visual", mode: "image", text: "Create a visual direction for this idea with palette, texture, light, composition, and three specific references to guide the image." },
  { id: "film-beats", title: "Storyboard the feeling", description: "A short film with a human pulse", category: "Visual", mode: "video", text: "Plan a 30-second product film for this idea with four beats, camera movement, sound, and one memorable closing image." },
  { id: "friendly-critic", title: "Be the useful critic", description: "Make the next revision obvious", category: "Strategy", mode: "chat", text: "Read this idea like a generous creative director. Name what is working, what is blurry, and the single revision that would make it stronger." },
];

function templateMatches(template: PromptTemplate, input: string) {
  const query = input.trim().toLowerCase();
  if (!query) return true;
  return `${template.title} ${template.description} ${template.category} ${template.text}`.toLowerCase().includes(query);
}

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
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<LibraryFilter>("All");
  const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>(() => readStored(STORAGE_KEYS.customPrompts, []));
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>(() => readStored(STORAGE_KEYS.recentTemplates, []));
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStored(STORAGE_KEYS.favorites, []));
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [serverHydrated, setServerHydrated] = useState(false);
  const promptStateQuery = trpc.promptState.list.useQuery(undefined, { enabled: isAuthenticated });
  const promptStateSync = trpc.promptState.sync.useMutation();

  const active = useMemo(() => modes.find((mode) => mode.id === activeMode) ?? modes[0], [activeMode]);
  const ActiveIcon = active.icon;
  const allTemplates = useMemo(() => [...customPrompts, ...promptTemplates], [customPrompts]);
  const contextualSuggestions = useMemo(() => {
    const current = prompt.trim();
    const sameMode = allTemplates.filter((template) => template.mode === activeMode);
    const matching = current.length > 2 ? sameMode.filter((template) => templateMatches(template, current)) : [];
    return (matching.length ? matching : sameMode).slice(0, 3);
  }, [activeMode, allTemplates, prompt]);
  const filteredTemplates = useMemo(() => allTemplates.filter((template) => {
    const matchesCategory = libraryCategory === "All" || libraryCategory === "Favorites" ? libraryCategory === "All" || favoriteIds.includes(template.id) : template.category === libraryCategory;
    return matchesCategory && templateMatches(template, libraryQuery);
  }), [allTemplates, favoriteIds, libraryCategory, libraryQuery]);
  const recentTemplates = useMemo(() => recentTemplateIds.map((id) => allTemplates.find((template) => template.id === id)).filter((template): template is PromptTemplate => Boolean(template)), [allTemplates, recentTemplateIds]);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEYS.customPrompts, JSON.stringify(customPrompts)); }, [customPrompts]);
  useEffect(() => { window.localStorage.setItem(STORAGE_KEYS.recentTemplates, JSON.stringify(recentTemplateIds)); }, [recentTemplateIds]);
  useEffect(() => { window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favoriteIds)); }, [favoriteIds]);
  useEffect(() => { setSuggestionIndex(0); setSuggestionsDismissed(false); }, [activeMode, prompt]);
  useEffect(() => {
    if (!isAuthenticated) {
      setServerHydrated(false);
      return;
    }
    if (serverHydrated || !promptStateQuery.data) return;
    const serverCustom = promptStateQuery.data.filter((item) => item.isCustom).map((item) => ({
      id: item.promptId,
      title: item.title,
      description: item.description,
      category: item.category,
      mode: item.mode,
      text: item.body,
    } satisfies PromptTemplate));
    const serverFavorites = promptStateQuery.data.filter((item) => item.isFavorite).sort((a, b) => a.favoritePosition - b.favoritePosition).map((item) => item.promptId);
    const serverRecents = promptStateQuery.data.filter((item) => item.recentPosition >= 0).sort((a, b) => a.recentPosition - b.recentPosition).map((item) => item.promptId).slice(0, 8);
    setCustomPrompts(serverCustom);
    setFavoriteIds(serverFavorites);
    setRecentTemplateIds(serverRecents);
    setServerHydrated(true);
  }, [isAuthenticated, promptStateQuery.data, serverHydrated]);
  useEffect(() => {
    if (!isAuthenticated || !serverHydrated || promptStateSync.isPending) return;
    const storedIds = Array.from(new Set([...customPrompts.map((item) => item.id), ...favoriteIds, ...recentTemplateIds]));
    const states = storedIds.map((id) => {
      const template = allTemplates.find((item) => item.id === id);
      if (!template) return null;
      const favoritePosition = favoriteIds.indexOf(id);
      const recentPosition = recentTemplateIds.indexOf(id);
      return {
        id: `${user?.id ?? "anonymous"}-${id}`,
        promptId: id,
        title: template.title,
        description: template.description,
        category: template.category,
        mode: template.mode,
        body: template.text,
        isCustom: template.id.startsWith("custom-"),
        isFavorite: favoritePosition >= 0,
        favoritePosition: favoritePosition >= 0 ? favoritePosition : 999,
        recentPosition: recentPosition >= 0 ? recentPosition : 999,
        lastUsedAt: recentPosition === 0 ? Date.now() : null,
      };
    }).filter((state): state is NonNullable<typeof state> => Boolean(state));
    if (states.length === 0) return;
    const timeout = window.setTimeout(() => { promptStateSync.mutate({ states }); }, 250);
    return () => window.clearTimeout(timeout);
  }, [allTemplates, customPrompts, favoriteIds, isAuthenticated, recentTemplateIds, serverHydrated, promptStateSync, user?.id]);

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

  function applyTemplate(template: PromptTemplate) {
    setActiveMode(template.mode);
    setPrompt(template.text);
    setRecentTemplateIds((current) => [template.id, ...current.filter((id) => id !== template.id)].slice(0, 8));
    setSuggestionsDismissed(true);
    setShowLibrary(false);
  }

  function saveCustomPrompt() {
    const text = prompt.trim();
    if (text.length < 3) return;
    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      title: text.slice(0, 38),
      description: "Saved by you",
      category: activeMode === "code" ? "Build" : activeMode === "image" || activeMode === "video" ? "Visual" : activeMode === "email" ? "Campaigns" : "Writing",
      mode: activeMode,
      text,
    };
    setCustomPrompts((current) => [template, ...current.filter((item) => item.text !== text)].slice(0, 12));
    setRecentTemplateIds((current) => [template.id, ...current.filter((id) => id !== template.id)].slice(0, 8));
  }

  function toggleFavorite(templateId: string) {
    setFavoriteIds((current) => current.includes(templateId) ? current.filter((id) => id !== templateId) : [templateId, ...current]);
  }

  function reorderIds(current: string[], sourceId: string, targetId: string) {
    if (sourceId === targetId) return current;
    const next = [...current];
    const sourceIndex = next.indexOf(sourceId);
    const targetIndex = next.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return current;
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, sourceId);
    return next;
  }

  function reorderFavorites(sourceId: string, targetId: string) {
    setFavoriteIds((current) => reorderIds(current, sourceId, targetId));
  }

  function reorderRecents(sourceId: string, targetId: string) {
    setRecentTemplateIds((current) => reorderIds(current, sourceId, targetId));
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && prompt.trim().length > 2) {
      event.preventDefault();
      setSuggestionsDismissed(true);
      return;
    }
    if (prompt.trim().length <= 2 || contextualSuggestions.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestionIndex((current) => (event.key === "ArrowDown" ? (current + 1) % contextualSuggestions.length : (current - 1 + contextualSuggestions.length) % contextualSuggestions.length));
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      applyTemplate(contextualSuggestions[suggestionIndex] ?? contextualSuggestions[0]);
    }
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
              <div className="shortcut-guide" aria-label="Prompt keyboard shortcuts"><span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>Enter</kbd> use</span><span><kbd>Esc</kbd> dismiss</span></div>
              <div className="prompt-area">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder={examplePrompts[activeMode]} aria-label="Describe what you want to create" aria-autocomplete="list" aria-controls="prompt-suggestions" aria-activedescendant={prompt.trim().length > 2 ? `suggestion-${contextualSuggestions[suggestionIndex]?.id}` : undefined} />
                <div className="prompt-tools"><div className="tool-group"><button className="tool-button" onClick={() => setPrompt(examplePrompts[activeMode])}><WandSparkles size={15} /> Inspire me</button><button className="tool-button" onClick={saveCustomPrompt} disabled={prompt.trim().length < 3}><Star size={15} /> Save prompt</button><button className="tool-button"><Paperclip size={15} /> Attach</button><button className="tool-button"><Mic2 size={15} /> Voice</button></div><span className="character-count">{prompt.length}/1200</span></div>
              </div>
              {prompt.trim().length > 2 && !suggestionsDismissed && <div className="suggestion-panel"><div className="suggestion-heading"><span><Sparkles size={13} /> Suggested for your draft</span><small>↑↓ choose · Enter use · Esc dismiss</small></div><div className="suggestion-list" id="prompt-suggestions" role="listbox" aria-label="Suggested prompts">{contextualSuggestions.map((template, index) => <button key={template.id} id={`suggestion-${template.id}`} className={index === suggestionIndex ? "suggestion-chip selected" : "suggestion-chip"} onMouseEnter={() => setSuggestionIndex(index)} onClick={() => applyTemplate(template)} role="option" aria-selected={index === suggestionIndex}><span><strong>{template.title}</strong><small>{template.description}</small></span><ArrowUpRight size={14} /></button>)}</div></div>}
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

      {showLibrary && <div className="modal-backdrop" onClick={() => setShowLibrary(false)}><div className="library-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">The archive</p><h2>Prompt library</h2><p className="modal-subtitle">Start from a useful shape, then make it yours.</p></div><button className="icon-button" onClick={() => setShowLibrary(false)} aria-label="Close library"><X size={18} /></button></div><div className="library-search"><Search size={16} /><input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search prompts, categories or outcomes" autoFocus /></div><div className="category-filters" aria-label="Filter prompt categories">{(["All", "Favorites", "Strategy", "Writing", "Campaigns", "Build", "Visual"] as const).map((category) => <button key={category} className={libraryCategory === category ? "category-filter selected" : "category-filter"} onClick={() => setLibraryCategory(category)}>{category === "Favorites" && <Star size={11} />}{category}</button>)}</div>{!libraryQuery && libraryCategory === "All" && recentTemplates.length > 0 && <div className="recent-prompts"><div className="rail-heading"><span>Recently used</span><small>{recentTemplates.length} saved · drag to reorder</small></div><div className="recent-prompt-list">{recentTemplates.slice(0, 8).map((template) => <button key={template.id} draggable onDragStart={() => setDraggingId(template.id)} onDragEnd={() => setDraggingId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggingId) reorderRecents(draggingId, template.id); setDraggingId(null); }} className={draggingId === template.id ? "dragging" : ""} onClick={() => applyTemplate(template)}><Clock3 size={13} /><span>{template.title}</span></button>)}</div></div>}<div className="library-list">{filteredTemplates.length ? filteredTemplates.map((template) => <div className={draggingId === template.id ? "library-row dragging" : "library-row"} key={template.id} draggable={favoriteIds.includes(template.id)} onDragStart={() => favoriteIds.includes(template.id) && setDraggingId(template.id)} onDragEnd={() => setDraggingId(null)} onDragOver={(event) => favoriteIds.includes(template.id) && event.preventDefault()} onDrop={() => { if (draggingId && favoriteIds.includes(template.id)) reorderFavorites(draggingId, template.id); setDraggingId(null); }}><button className="template-select" onClick={() => applyTemplate(template)}><span className={`prompt-icon ${template.category === "Visual" ? "gold" : template.category === "Build" ? "muted" : ""}`}><Sparkles size={16} /></span><span><strong>{template.title}</strong><small>{template.category} · {template.description}</small></span><ArrowUpRight size={15} /></button><button className={favoriteIds.includes(template.id) ? "favorite-button active" : "favorite-button"} onClick={() => toggleFavorite(template.id)} aria-label={favoriteIds.includes(template.id) ? `Remove ${template.title} from favorites` : `Add ${template.title} to favorites`}><Star size={15} fill={favoriteIds.includes(template.id) ? "currentColor" : "none"} /></button></div>) : <div className="library-empty"><Search size={18} /><strong>No prompts found</strong><span>Try a broader phrase or choose another category.</span><button className="text-button" onClick={() => { setLibraryQuery(""); setLibraryCategory("All"); }}>Clear filters</button></div>}</div></div></div>}
    </div>
  );
}
