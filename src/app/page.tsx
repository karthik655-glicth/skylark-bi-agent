"use client";

import { FormEvent, useState } from "react";

type Message = { role: "assistant" | "user"; content: string };
const starters = ["How is our pipeline looking this quarter?", "Which sectors have the strongest deal value?", "Create a leadership update for this week."];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "I’m Skylark’s BI agent. Ask about pipeline, sector performance, revenue, or work-order delivery. I’ll use live monday.com board data and flag any data-quality caveats." }]);
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
      <div className="messages">{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><span className="avatar">{message.role === "assistant" ? "S" : "YOU"}</span><p>{message.content}</p></article>)}{loading && <article className="message assistant"><span className="avatar">S</span><p className="thinking">Reviewing live board data…</p></article>}</div>
      <div className="suggestions">{starters.map((starter) => <button key={starter} onClick={() => void ask(starter)}>{starter}</button>)}</div>
      <form onSubmit={submit} className="composer"><label className="sr-only" htmlFor="question">Ask a business question</label><input id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about pipeline, delivery, revenue…" /><button type="submit" disabled={loading || !question.trim()} aria-label="Send question">↑</button></form>
    </section><p className="footer-note">Read-only access · Missing and inconsistent data is surfaced in every answer</p>
  </main>;
}
