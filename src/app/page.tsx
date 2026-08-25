"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Message = { role: "assistant" | "user"; content: string; time?: string };

const suggestionCategories = [
  { label: "Pipeline this quarter", icon: "📊", query: "How is our pipeline looking this quarter?" },
  { label: "Top sectors by deal value", icon: "🏢", query: "Which sectors have the highest potential deal value?" },
  { label: "Weekly leadership brief", icon: "📑", query: "Create a leadership update for this week." },
  { label: "Billed vs Collected revenue", icon: "💰", query: "What is the total billed value versus collected amount?" },
  { label: "Work orders by owner", icon: "👷", query: "Which owners are handling the most work orders?" },
  { label: "Receivables & Unbilled", icon: "⏳", query: "What is our total receivable amount and unbilled value?" },
];

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) && token.length >= 2) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Markdown Table Detection
    if (line.trim().startsWith("|") && line.trim().endsWith("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
      const headerRow = line.split("|").map((s) => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        const row = lines[i].split("|").map((s) => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        rows.push(row);
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="table-wrap">
          <table>
            <thead>
              <tr>
                {headerRow.map((h, hi) => (
                  <th key={hi}>{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = level <= 2 ? "h2" : level === 3 ? "h3" : "h4";
      elements.push(<Tag key={`h-${i}`}>{renderInline(text)}</Tag>);
      i++;
      continue;
    }

    // List items
    if (/^\s*([•\-\*]|\d+\.)\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*([•\-\*]|\d+\.)\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*([•\-\*]|\d+\.)\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`}>
          {listItems.map((item, li) => (
            <li key={li}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line spacing
    if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="spacer" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(<p key={`p-${i}`}>{renderInline(line)}</p>);
    i++;
  }

  return <div className="content-body">{elements}</div>;
}

export default function Home() {
  const initialGreeting: Message = {
    role: "assistant",
    content: "Welcome to **Skylark Intelligence**. I'm connected live to your **Deals** and **Work Orders** boards on monday.com.\n\nAsk about sales pipeline, sector concentrations, revenue, work-order delivery, or request an on-demand leadership brief.",
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: nextMessages.slice(-8) }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer ?? data.error ?? "I couldn’t complete that analysis." },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "The service is unavailable. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  function resetChat() {
    setMessages([initialGreeting]);
    setQuestion("");
  }

  return (
    <main className="shell">
      {/* Top Navbar */}
      <header className="topbar">
        <div className="brand-wrapper">
          <div className="brand-mark">S</div>
          <div className="brand-title">
            <span className="brand-name">SKYLARK</span>
            <span className="brand-tag">INTELLIGENCE</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="board-pills">
            <span className="pill">Deals</span>
            <span className="pill">Work Orders</span>
          </div>
          <div className="status-badge" title="Connected to monday.com Streamable HTTP MCP">
            <span className="status-dot pulsing" />
            <span>Live Sync</span>
          </div>
          {messages.length > 1 && (
            <button className="reset-btn" onClick={resetChat} title="Reset conversation">
              <span>↺</span> Clear
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-pill">
          <span className="sparkle">✨</span>
          <span>EXECUTIVE BUSINESS INTELLIGENCE</span>
        </div>
        <h1>
          Answers from your business,
          <br />
          <em>not just your boards.</em>
        </h1>
        <p className="intro">
          Live deals and work-order intelligence, synthesized into executive clarity for founders and leadership.
        </p>
      </section>

      {/* Suggestion Chips */}
      <section className="quick-starters" aria-label="Suggested business questions">
        <div className="starters-scroll">
          {suggestionCategories.map((item) => (
            <button
              key={item.label}
              className="starter-chip"
              onClick={() => void ask(item.query)}
              disabled={loading}
            >
              <span className="chip-icon">{item.icon}</span>
              <span className="chip-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Chat Dashboard Card */}
      <section className="chat-card" aria-label="Business intelligence conversation">
        <div className="messages-container">
          {messages.map((message, index) => (
            <article className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
              <div className="avatar-wrapper">
                <div className={`avatar ${message.role}`}>
                  {message.role === "assistant" ? "S" : "YOU"}
                </div>
              </div>
              <div className="message-bubble">
                {message.role === "assistant" && (
                  <div className="bubble-header">
                    <span className="agent-badge">Skylark Executive AI</span>
                  </div>
                )}
                <FormattedMessage content={message.content} />
              </div>
            </article>
          ))}

          {loading && (
            <article className="message-row assistant">
              <div className="avatar-wrapper">
                <div className="avatar assistant">S</div>
              </div>
              <div className="message-bubble thinking-bubble">
                <div className="thinking-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span className="thinking-text">Querying live monday.com boards…</span>
              </div>
            </article>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <form onSubmit={submit} className="composer-bar">
          <div className="input-container">
            <span className="search-icon">🔍</span>
            <input
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about pipeline, sector revenue, delivery status, unbilled amounts..."
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-label="Send question"
              className="send-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
          <div className="composer-hint">
            <span>Press <strong>Enter ↵</strong> to query live data</span>
            <span>•</span>
            <span>Deterministic financial metrics</span>
          </div>
        </form>
      </section>

      {/* Footer Note */}
      <footer className="page-footer">
        <p>Skylark Drones Intelligence · Powered by official monday.com MCP & Google Gemini</p>
      </footer>
    </main>
  );
}
