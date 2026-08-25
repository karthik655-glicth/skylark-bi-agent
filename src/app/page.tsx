"use client";

import { FormEvent, ReactNode, useState } from "react";

type Message = { role: "assistant" | "user"; content: string };
const starters = ["How is our pipeline looking this quarter?", "Which sectors have the strongest deal value?", "Create a leadership update for this week."];

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
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "I’m Skylark’s BI agent. Ask about pipeline, sector performance, revenue, or work-order delivery. I’ll use live monday.com board data and provide executive leadership answers." }]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setQuestion(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: trimmed, history: nextMessages.slice(-8) }) });
      const data = (await response.json()) as { answer?: string; error?: string };
      setMessages((current) => [...current, { role: "assistant", content: data.answer ?? data.error ?? "I couldn’t complete that analysis." }]);
    } catch { setMessages((current) => [...current, { role: "assistant", content: "The service is unavailable. Please try again in a moment." }]); }
    finally { setLoading(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(question); }

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">S</span><span>SKYLARK</span></div><div className="status"><span className="status-dot" /> monday.com connected</div></header>
    <section className="hero"><p className="eyebrow">FOUNDER INTELLIGENCE</p><h1>Answers from your business,<br /><em>not just your boards.</em></h1><p className="intro">Live deals and work-order intelligence, translated into a clear leadership perspective.</p></section>
    <section className="chat-card" aria-label="Business intelligence chat">
      <div className="messages">{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><span className="avatar">{message.role === "assistant" ? "S" : "YOU"}</span><FormattedMessage content={message.content} /></article>)}{loading && <article className="message assistant"><span className="avatar">S</span><div className="content-body"><p className="thinking">Reviewing live board data…</p></div></article>}</div>
      <div className="suggestions">{starters.map((starter) => <button key={starter} onClick={() => void ask(starter)}>{starter}</button>)}</div>
      <form onSubmit={submit} className="composer"><label className="sr-only" htmlFor="question">Ask a business question</label><input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about pipeline, delivery, revenue…" /><button type="submit" disabled={loading || !question.trim()} aria-label="Send question">↑</button></form>
    </section><p className="footer-note">Read-only live monday.com intelligence</p>
  </main>;
}
