import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Crosshair,
  Layers3,
  Maximize2,
  Menu,
  RotateCcw,
  ScanLine,
  Send,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ThreeModel, type ViewerMode } from "../components/buildtwin/ThreeModel";

export const Route = createFileRoute("/")({
  component: BuildTwinDashboard,
});

type ChatMessage = { id: number; role: "assistant" | "user"; text: string; alert?: boolean };

const projectChoices = [
  { name: "Northline Medical Pavilion", code: "NMP · PHASE 02" },
  { name: "Harbor Exchange Tower", code: "HET · CORE & SHELL" },
  { name: "Cedar Ridge Transit Hub", code: "CRH · STRUCTURE" },
];
const progressData = [
  { week: "Wk 14", planned: 18, actual: 16 },
  { week: "Wk 15", planned: 29, actual: 26 },
  { week: "Wk 16", planned: 43, actual: 39 },
  { week: "Wk 17", planned: 57, actual: 51 },
  { week: "Wk 18", planned: 72, actual: 63 },
  { week: "Wk 19", planned: 86, actual: 74 },
];
const workItems = [
  { name: "Foundation", complete: 100, pending: 0 },
  { name: "Pillars", complete: 75, pending: 25 },
  { name: "Slab", complete: 42, pending: 58 },
  { name: "Plumbing", complete: 18, pending: 82 },
];

function BuildTwinDashboard() {
  const [mode, setMode] = useState<ViewerMode>("overlay");
  const [project, setProject] = useState(projectChoices[0]!);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coordinatesOn, setCoordinatesOn] = useState(true);
  const [logsOn, setLogsOn] = useState(true);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [selectedNav, setSelectedNav] = useState("Overview");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      alert: true,
      text: "Scan #42 completed. Detected a 2-day delay on Level 1 slab. Shall I update dependencies?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState("");
  const [viewerKey, setViewerKey] = useState(0);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const announce = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  };

  const chooseNav = (item: string) => {
    setSelectedNav(item);
    if (item === "Site twin") setMode("overlay");
    if (item === "Scans") {
      setMode("scan");
      announce("Latest scan selected · Scan #42");
    }
    if (item === "Schedule") {
      analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      announce("Schedule analytics in view");
    }
    setMobileMenuOpen(false);
  };

  const selectMode = (newMode: ViewerMode) => {
    setMode(newMode);
    setSelectedNav("Site twin");
  };

  const sendMessage = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || isTyping) return;
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: cleanText }]);
    setChatInput("");
    setIsTyping(true);
    window.setTimeout(() => {
      const lower = cleanText.toLowerCase();
      const answer = lower.includes("dependency") || lower.includes("update")
        ? "Dependency proposal ready: move Level 1 slab pour to Thu, 18 Jun, after rebar inspection clears. This shifts the Level 2 column start by 2 working days. No changes have been applied."
        : lower.includes("rebar") || lower.includes("curing")
          ? "Scan #42 shows rebar cage installation at 88%. Concrete cure is tracking at 31 hours of the planned 48-hour hold. I’ll flag any pour-readiness change in the next scan."
          : lower.includes("gantt") || lower.includes("schedule")
            ? "The Gantt dependency chain is Foundation → L1 columns → slab pour → cure → L2 columns. Slab finish is forecast 2 days behind the baseline."
            : "Understood. I’ve checked the latest site twin: Level 1 slab remains 2 days behind plan, with the rebar inspection as the next critical gate. This is a local simulation; no project data was changed.";
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: answer }]);
      setIsTyping(false);
    }, 1500);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(chatInput);
  };

  const suggestions = [
    "Show the dependency impact",
    "What is the rebar status?",
    "Review slab cure timeline",
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="BuildTwin">
          <span className="brand-mark"><Layers3 size={16} /></span>
          <span>BUILDTWIN</span>
          <span className="brand-sub">FIELD INTELLIGENCE</span>
        </div>
        <div className="top-meta">
          <span className="meta-hide">SAMPLE · 16 JUN 2025&nbsp; · &nbsp;07:42 MDT</span>
          <span className="live-pill"><i className="live-dot" /> LOCAL DEMO</span>
          <button className="icon-button mobile-only" aria-label="Open project navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar${mobileMenuOpen ? " mobile-open" : ""}`} aria-label="Project navigation">
          <div className="side-label">Active workspace</div>
          <div className="mobile-project-row">
            <button className="project-switcher" aria-expanded={projectMenuOpen} onClick={() => setProjectMenuOpen((open) => !open)}>
              <span><span className="project-name">{project.name}</span><span className="project-code">{project.code}</span></span>
              <ChevronDown size={14} />
            </button>
          </div>
          {projectMenuOpen && (
            <div className="project-menu" role="menu">
              {projectChoices.map((choice) => (
                <button
                  key={choice.code}
                  className={`project-choice${choice.code === project.code ? " chosen" : ""}`}
                  role="menuitem"
                  onClick={() => {
                    setProject(choice);
                    setProjectMenuOpen(false);
                    announce(`${choice.name} workspace selected`);
                  }}
                >
                  <span>{choice.name}<small>{choice.code}</small></span>
                  {choice.code === project.code && <Check size={13} />}
                </button>
              ))}
            </div>
          )}

          <div className="side-label">Project navigation</div>
          <nav className="nav-list">
            {[
              { name: "Overview", icon: Building2 },
              { name: "Site twin", icon: Layers3 },
              { name: "Schedule", icon: Activity },
              { name: "Scans", icon: ScanLine },
            ].map(({ name, icon: Icon }) => (
              <button key={name} className={`nav-item${selectedNav === name ? " active" : ""}`} onClick={() => chooseNav(name)} aria-current={selectedNav === name ? "page" : undefined}>
                <Icon />{name}
              </button>
            ))}
          </nav>

          <div className="side-label">Admin controls</div>
          <div className="admin-controls">
            <button className={`control-row${mode === "overlay" ? " selected" : ""}`} onClick={() => selectMode("overlay")}><Crosshair />3D Discrepancy</button>
            <button className="control-row" onClick={() => { analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); announce("Development rate analytics"); }}><Activity />Dev Rate</button>
            <button className="control-row" onClick={() => setSettingsOpen(true)}><Settings2 />Settings</button>
          </div>
          {logsOn && (
            <>
              <div className="side-divider" />
              <div className="side-label">Recent logs <span style={{ float: "right", color: "#65737a" }}>24H</span></div>
              <div className="log-list">
                <div className="log-item"><i className="log-dot" /><span>Scan #42 processed · L1 slab<span className="log-time">07:38 · today</span></span></div>
                <div className="log-item"><i className="log-dot" style={{ background: "var(--green)" }} /><span>Rebar inspection approved<span className="log-time">16:12 · yesterday</span></span></div>
                <div className="log-item"><i className="log-dot" style={{ background: "var(--amber)" }} /><span>Cure hold extended by 6h<span className="log-time">13:46 · yesterday</span></span></div>
              </div>
            </>
          )}
          <div className="sidebar-bottom"><CircleHelp size={13} /><span>BuildTwin field guide</span><span className="guide-version">v2.8.1</span></div>
        </aside>

        <main className="main-column">
          <div className="heading-row">
            <div><h1>{selectedNav === "Overview" ? "Project overview" : selectedNav === "Scans" ? "Scan review" : selectedNav === "Schedule" ? "Schedule overview" : "Level 1 · Structural frame"}</h1><p>{project.name} <span className="muted-separator">/</span> Building A <span className="muted-separator">/</span> Level 1</p></div>
            <div className="scan-chip"><ScanLine /> LAST SCAN <strong>#42</strong> <span>· 07:38</span></div>
          </div>

          <section className="panel viewer-panel" aria-labelledby="viewer-title">
            <div className="panel-head">
              <div><div className="panel-title" id="viewer-title">STRUCTURAL TWIN <span className="panel-kicker">Building A · Level 1 · Gridlines A–D / 1–4</span></div></div>
              <div className="viewer-status"><span className="status-dot" /> COORDINATED VIEW</div>
            </div>
            <div className="viewer-wrap" id="viewer">
              <ThreeModel key={`${mode}-${viewerKey}`} mode={mode} />
              <div className="viewer-top-left"><Crosshair /> MODEL SPACE <span>·</span> 1:100</div>
              {coordinatesOn && <div className="viewer-coords"><span>N 39°44′12.8″</span><span>E 104°59′21.4″</span><span>EL {units === "metric" ? "+04.20 m" : "+13.78 ft"}</span></div>}
              <div className="viewer-legend">
                <span className="legend-key"><i className="swatch" /> Planned</span>
                <span className="legend-key"><i className="swatch actual" /> Site scan</span>
                {mode === "overlay" && <span className="legend-key"><i className="swatch delay" /> Variance</span>}
              </div>
            </div>
            <div className="mode-bar">
              <span className="mode-label">View mode</span>
              <button className={`mode-button${mode === "blueprint" ? " active" : ""}`} onClick={() => selectMode("blueprint")} aria-pressed={mode === "blueprint"}><Layers3 />Blueprint</button>
              <button className={`mode-button${mode === "scan" ? " active" : ""}`} onClick={() => selectMode("scan")} aria-pressed={mode === "scan"}><ScanLine />Site scan</button>
              <button className={`mode-button${mode === "overlay" ? " active" : ""}`} onClick={() => selectMode("overlay")} aria-pressed={mode === "overlay"}><Crosshair />Overlay <span className="mode-alert">1</span></button>
              <div className="view-actions">
                <button className="icon-button" aria-label="Reset model view" title="Reset model view" onClick={() => setViewerKey((key) => key + 1)}><RotateCcw /></button>
                <button className="icon-button" aria-label="Toggle fullscreen model" title="Toggle fullscreen model" onClick={() => {
                  const element = document.getElementById("viewer");
                  if (!element) return;
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void element.requestFullscreen?.();
                }}><Maximize2 /></button>
              </div>
            </div>
          </section>

          <div className="metrics-strip" aria-label="Project progress summary">
            <div className="metric"><span className="metric-label">OVERALL COMPLETE</span><strong>74<span>%</span></strong><span className="metric-trend"><ArrowUpRight /> 4.2% this week</span></div>
            <div className="metric"><span className="metric-label">SCHEDULE VARIANCE</span><strong className="amber-text">−2<span> days</span></strong><span className="metric-trend risk"><ArrowDownRight /> slab critical path</span></div>
            <div className="metric"><span className="metric-label">ACTIVE CREW</span><strong>28<span> / 34</span></strong><span className="metric-trend">6 trades on site</span></div>
            <div className="metric"><span className="metric-label">NEXT MILESTONE</span><strong className="milestone-value">L1 slab pour</strong><span className="metric-trend"><Clock3 /> Thu, 18 Jun · forecast</span></div>
          </div>

          <div ref={analyticsRef} className="analytics-grid" id="analytics">
            <section className="panel chart-panel" aria-labelledby="progress-title">
              <div className="panel-head">
                <div className="panel-title" id="progress-title">PLANNED VS ACTUAL <span className="panel-kicker">Cumulative construction progress · last 6 weeks</span></div>
                <div className="chart-legend"><span><i className="line-mark" /> Planned</span><span><i className="line-mark purple" /> Actual</span></div>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={168}>
                  <AreaChart data={progressData} margin={{ top: 7, right: 5, left: -19, bottom: 0 }}>
                    <defs>
                      <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43cdd0" stopOpacity={0.19} /><stop offset="100%" stopColor="#43cdd0" stopOpacity={0.01} /></linearGradient>
                      <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a98ae8" stopOpacity={0.15} /><stop offset="100%" stopColor="#a98ae8" stopOpacity={0.01} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2b3439" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "#78868d", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#78868d", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#20272b", border: "1px solid #3a454b", borderRadius: 5, fontSize: 10, color: "#dce4e6" }} formatter={(value, name) => [`${value}%`, name === "planned" ? "Planned" : "Actual"]} />
                    <Area type="monotone" dataKey="planned" stroke="#45cbd0" strokeWidth={2} fill="url(#plannedFill)" activeDot={{ r: 3, fill: "#45cbd0" }} isAnimationActive={false} />
                    <Area type="monotone" dataKey="actual" stroke="#ab8ce9" strokeWidth={2} fill="url(#actualFill)" activeDot={{ r: 3, fill: "#ab8ce9" }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="chart-foot"><span>Baseline: 86% planned</span><span>Actual: 74% <b>· 12 pts behind</b></span></div>
              </div>
            </section>
            <section className="panel chart-panel" aria-labelledby="tasks-title">
              <div className="panel-head"><div className="panel-title" id="tasks-title">WORK PACKAGE STATUS<span className="panel-kicker">Level 1 structural sequence</span></div><span className="progress-summary">4 packages</span></div>
              <div className="tasks-chart">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    data={workItems}
                    layout="vertical"
                    margin={{ top: 3, right: 12, left: 0, bottom: 0 }}
                    barCategoryGap={12}
                    accessibilityLayer
                  >
                    <CartesianGrid stroke="#2b3439" strokeDasharray="3 5" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: "#78868d", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fill: "#a9b4b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#ffffff08" }}
                      contentStyle={{ background: "#20272b", border: "1px solid #3a454b", borderRadius: 5, fontSize: 10, color: "#dce4e6" }}
                      formatter={(value, name) => [`${value}%`, name === "complete" ? "Completed" : "Pending"]}
                    />
                    <Bar dataKey="complete" name="Completed" stackId="work" fill="#5cc49a" radius={[2, 0, 0, 2]} isAnimationActive={false} />
                    <Bar dataKey="pending" name="Pending" stackId="work" fill="#343d42" radius={[0, 2, 2, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="task-note"><span>On critical path</span><strong><AlertTriangle size={11} /> Slab pour · +2d</strong></div>
              <div className="task-caption">Completion by field-verified work package</div>
            </section>
          </div>
        </main>

        <aside className="chat-panel" aria-label="AI Site Manager">
          <div className="chat-head">
            <div className="chat-title"><span className="ai-mark"><Bot /></span><span>AI Site Manager<small className="panel-kicker">Field intelligence assistant</small></span></div>
            <span className="sim-label">SIMULATED</span>
          </div>
          <div className="chat-context"><span className="context-building"><Building2 />{project.name}</span><span>LEVEL 1</span></div>
          <div className="chat-messages" ref={chatMessagesRef} aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <div key={message.id} className={`message${message.role === "user" ? " user" : ""}${message.alert ? " alert-message" : ""}`}>
                <span className="message-avatar">{message.role === "assistant" ? <Bot /> : <span>EN</span>}</span>
                <div className="message-body"><div className="message-meta">{message.role === "assistant" ? "SITE MANAGER" : "YOU"} <span>· {message.role === "assistant" ? "07:38" : "now"}</span></div>
                  <div className="message-bubble">{message.alert && <div className="alert-tag"><AlertTriangle /> Schedule variance</div>}{message.text}</div>
                </div>
              </div>
            ))}
            {isTyping && <div className="message"><span className="message-avatar"><Bot /></span><div className="message-body"><div className="message-meta">SITE MANAGER</div><div className="typing" role="status" aria-label="Site Manager is typing">Reviewing field data <i /><i /><i /></div></div></div>}
          </div>
          {!isTyping && messages.length < 3 && <div className="suggestions" aria-label="Suggested questions">{suggestions.map((suggestion) => <button className="suggestion" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}</div>}
          <form className="chat-form" onSubmit={onSubmit}>
            <div className="input-wrap"><input className="chat-input" aria-label="Message the AI Site Manager" placeholder="Ask about the site, schedule…" value={chatInput} onChange={(event) => setChatInput(event.target.value)} /><button type="submit" className="send-button" aria-label="Send message" disabled={!chatInput.trim() || isTyping}><Send /></button></div>
            <div className="chat-footnote"><Sparkles size={10} /> Simulated assistant · responses are not saved to a project</div>
          </form>
        </aside>
      </div>

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-head"><div><h2 id="settings-title">Workspace settings</h2><p>Local display preferences for this review session.</p></div><button className="icon-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X /></button></div>
            <label className="setting-option"><span><strong>Model coordinates</strong><span>Show survey position and elevation over the twin</span></span><input type="checkbox" checked={coordinatesOn} onChange={(event) => setCoordinatesOn(event.target.checked)} /></label>
            <label className="setting-option"><span><strong>Recent activity log</strong><span>Show the latest scan and field events in navigation</span></span><input type="checkbox" checked={logsOn} onChange={(event) => setLogsOn(event.target.checked)} /></label>
            <label className="setting-option"><span><strong>Measurement units</strong><span>Displayed for the current review only</span></span><select value={units} onChange={(event) => setUnits(event.target.value as "metric" | "imperial")} aria-label="Measurement units"><option value="metric">Metric · m</option><option value="imperial">Imperial · ft</option></select></label>
            <div className="dialog-actions"><button className="primary-button" onClick={() => { setSettingsOpen(false); announce("Display preferences applied for this session"); }}>Done</button></div>
          </section>
        </div>
      )}
      {toast && <div className="toast-note" role="status">{toast}</div>}
    </div>
  );
}
