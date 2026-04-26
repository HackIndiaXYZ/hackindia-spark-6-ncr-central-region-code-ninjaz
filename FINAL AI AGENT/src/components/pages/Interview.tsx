import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Webcam } from "@/components/Webcam";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";

type ChatRole = "ai" | "user";
interface Msg { role: ChatRole; content: string; ts: number; }
interface AnswerScore { relevance: number; creativity: number; depth: number; reasoning: string; hint?: string; }

const TOTAL = 8;
const TIME_LIMIT_S = 12 * 60;

function fmtTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
function fmtClock(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function avg(scores: AnswerScore[]) {
  if (scores.length === 0) return { rel: 0, cre: 0, dep: 0, overall: 0 };
  const rel = Math.round(scores.reduce((a, s) => a + s.relevance, 0) / scores.length);
  const cre = Math.round(scores.reduce((a, s) => a + s.creativity, 0) / scores.length);
  const dep = Math.round(scores.reduce((a, s) => a + s.depth, 0) / scores.length);
  return { rel, cre, dep, overall: Math.round((rel + cre + dep) / 3) };
}

export default function Interview() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile(user?.id);

  const role = params.get("role") || "Frontend Developer";
  const mode = (params.get("mode") || "real") as "real" | "mock";
  const topics = params.get("topics") || "";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState<AnswerScore[]>([]);
  const [qIndex, setQIndex] = useState(0); // questions asked
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_S);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Redirect unauth
  useEffect(() => { if (!authLoading && !user) nav("/auth", { replace: true }); }, [authLoading, user, nav]);

  // Autoscroll
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const callAI = useCallback(async (body: any) => {
    const { data, error } = await supabase.functions.invoke("interview-ai", { body });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  }, []);

  // Boot the interview once we have user + role
  useEffect(() => {
    if (startedRef.current) return;
    if (!user || !role) return;
    startedRef.current = true;
    (async () => {
      try {
        setBusy(true);
        // Create interview row
        const { data: ins, error: insErr } = await supabase
          .from("interviews")
          .insert({ user_id: user.id, role, mode, topics: topics || null })
          .select("id")
          .single();
        if (insErr) throw insErr;
        setInterviewId(ins.id);

        const data = await callAI({
          mode: "first_question",
          role,
          topics,
          resume: profile?.resume_text ?? undefined,
          questionNumber: 1,
          totalQuestions: TOTAL,
        });
        const q: string = (data as any).question;
        setMessages([{ role: "ai", content: q, ts: Date.now() }]);
        setQIndex(1);
      } catch (e: any) {
        setError(e?.message ?? "Could not start interview");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const finishInterview = useCallback(async (history: Msg[], finalScores: AnswerScore[]) => {
    if (!user || !interviewId) return;
    setFinishing(true);
    try {
      const data: any = await callAI({
        mode: "final_feedback",
        role,
        topics,
        resume: profile?.resume_text ?? undefined,
        history: history.map((m) => ({ role: m.role, content: m.content })),
      });
      await supabase
        .from("interviews")
        .update({
          completed: true,
          total_score: data.total_score,
          relevance_score: data.relevance,
          creativity_score: data.creativity,
          depth_score: data.depth,
          feedback: data.feedback,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          transcript: history as any,
        })
        .eq("id", interviewId);
      // Pass to result page via session storage
      sessionStorage.setItem(
        "agenthire_last_result",
        JSON.stringify({ role, mode, ...data, transcript: history, scores: finalScores }),
      );
      nav(`/result/${interviewId}`);
    } catch (e: any) {
      setError(e?.message ?? "Could not finalize interview");
      setFinishing(false);
    }
  }, [user, interviewId, role, topics, profile?.resume_text, callAI, nav]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy || finishing) return;
    setInput("");
    setError(null);

    const userMsg: Msg = { role: "user", content: text, ts: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setBusy(true);

    try {
      const aiHistory = newHistory.map((m) => ({ role: m.role, content: m.content }));
      // Determine adaptive difficulty from running scores
      const a = avg(scores);
      const difficulty = a.overall > 75 ? "hard" : a.overall < 50 && scores.length > 0 ? "easy" : "medium";

      const data: any = await callAI({
        mode: "follow_up",
        role,
        topics,
        resume: profile?.resume_text ?? undefined,
        history: aiHistory,
        questionNumber: qIndex + 1,
        totalQuestions: TOTAL,
        difficulty,
      });

      const newScore: AnswerScore = {
        relevance: data.relevance,
        creativity: data.creativity,
        depth: data.depth,
        reasoning: data.reasoning,
        hint: data.hint,
      };
      const updatedScores = [...scores, newScore];
      setScores(updatedScores);

      // If we've already asked TOTAL questions, this was the last answer → finalize.
      if (qIndex >= TOTAL) {
        await finishInterview(newHistory, updatedScores);
        return;
      }

      const aiMsg: Msg = { role: "ai", content: data.next_question, ts: Date.now() };
      setMessages([...newHistory, aiMsg]);
      setQIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "AI unavailable");
    } finally {
      setBusy(false);
    }
  }, [input, busy, finishing, messages, scores, qIndex, role, topics, profile?.resume_text, callAI, finishInterview]);

  // Time-up: auto-finish if we have at least one scored answer
  useEffect(() => {
    if (timeLeft === 0 && interviewId && scores.length > 0 && !finishing) {
      finishInterview(messages, scores);
    }
  }, [timeLeft, interviewId, scores, finishing, messages, finishInterview]);

  const liveAvg = useMemo(() => avg(scores), [scores]);
  const progressPct = Math.round(((qIndex - 1 + (busy ? 0.5 : 0)) / TOTAL) * 100);
  const rankPreview = liveAvg.overall > 0 ? `Top ${Math.max(1, Math.round(100 - liveAvg.overall * 0.95))}%` : "—";
  const lastHint = scores[scores.length - 1]?.hint;

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="interview-layout">
            {/* LEFT: agent + scores */}
            <div>
              <div className="agent-card">
                <div className="agent-avatar">
                  🤖
                  <div className="agent-status" />
                </div>
                <div className="agent-name">Aria</div>
                <div className="agent-role">AI Interviewer</div>
                <div className="company-tag">🤖 AgentHire AI · {role}</div>

                <div className="section-label">Webcam</div>
                <Webcam />

                <div className="section-label" style={{ marginTop: 14 }}>Progress</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
                </div>
                <div className="prog-label">
                  {finishing ? "Generating final report…" : `Question ${Math.min(qIndex, TOTAL)} of ${TOTAL}`}
                </div>

                <div className="divider" />
                <div className="section-label">Live Scores</div>
                <div className="score-row"><span className="score-label">Relevance</span><span className="score-val">{liveAvg.rel || "—"}</span></div>
                <div className="score-row"><span className="score-label">Creativity</span><span className="score-val">{liveAvg.cre || "—"}</span></div>
                <div className="score-row"><span className="score-label">Depth</span><span className="score-val">{liveAvg.dep || "—"}</span></div>
                <div className="score-row"><span className="score-label">Overall</span><span className="score-val lit">{liveAvg.overall || "—"}</span></div>

                <div className="divider" />
                <div className="section-label">Session</div>
                <div className="score-row"><span className="score-label">Role</span><span className="score-val">{role}</span></div>
                <div className="score-row"><span className="score-label">Mode</span><span className="score-val">{mode}</span></div>
                <div className="score-row"><span className="score-label">Q&amp;A</span><span className="score-val">{scores.length}/{TOTAL}</span></div>
              </div>
            </div>

            {/* CENTER: chat */}
            <div className="chat-card">
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="status-dot" />
                  <div>
                    <div className="chat-header-title">Interview Room — {role}</div>
                    <div className="chat-header-sub">{mode === "mock" ? "Mock interview · feedback after each answer" : "Live AI interview"}</div>
                  </div>
                </div>
                <div className="chat-timer">{fmtTime(timeLeft)}</div>
              </div>

              <div className="chat-messages" ref={messagesRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <div className="msg-bubble">{m.content}</div>
                    <div className="msg-time">{fmtClock(m.ts)}</div>
                  </div>
                ))}
                {busy && (
                  <div className="msg ai">
                    <div className="typing"><span className="dot" /><span className="dot" /><span className="dot" /></div>
                  </div>
                )}
                {error && (
                  <div className="msg ai">
                    <div className="msg-bubble" style={{ borderColor: "rgba(248,113,113,.4)", color: "var(--red)" }}>
                      ⚠ {error}
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-row">
                <input
                  className="chat-input"
                  placeholder={finishing ? "Wrapping up…" : busy ? "Aria is thinking…" : "Type your answer… (Enter to send)"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={busy || finishing || timeLeft === 0}
                />
                <button className="send-btn" onClick={send} disabled={busy || finishing || !input.trim()}>
                  Send ↗
                </button>
              </div>
            </div>

            {/* RIGHT: live criteria + rank preview */}
            <div className="criteria-panel">
              <div className="section-label">Scoring Criteria</div>
              {([
                { key: "rel", name: "Relevance", val: scores[scores.length - 1]?.relevance ?? 0 },
                { key: "cre", name: "Creativity", val: scores[scores.length - 1]?.creativity ?? 0 },
                { key: "dep", name: "Depth", val: scores[scores.length - 1]?.depth ?? 0 },
              ] as const).map((c) => (
                <div className="criteria-item" key={c.key}>
                  <div className="criteria-head">
                    <span className="criteria-name">{c.name}</span>
                    <span className="criteria-score">{c.val || "—"}</span>
                  </div>
                  <div className="criteria-bar">
                    <div className="criteria-fill" style={{ width: `${c.val}%` }} />
                  </div>
                </div>
              ))}

              <div className="tip-box">
                <strong>💡 {lastHint ? "Aria's hint:" : "Tip:"}</strong>{" "}
                {lastHint || "Be specific. Reference real tools, patterns and trade-offs you've encountered. Aria rewards depth over brevity."}
              </div>

              <div style={{ marginTop: 20 }}>
                <div className="section-label">Your Rank Preview</div>
                <div style={{ fontSize: 28, fontFamily: "var(--font-d)", color: "var(--accent)", fontWeight: 800, marginTop: 4 }}>
                  {rankPreview}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>
                  of candidates for this role
                </div>
              </div>

              {scores.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="section-label">AI Reasoning</div>
                  <div className="tip-box" style={{ marginTop: 0, fontStyle: "italic" }}>
                    {scores[scores.length - 1].reasoning}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
