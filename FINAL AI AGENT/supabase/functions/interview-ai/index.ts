// AI-powered interview engine
// Modes:
//   - "first_question": generate first question for a role/topics/resume
//   - "follow_up": evaluate the last answer and generate the next adaptive question
//   - "final_feedback": summarize the entire interview into a final report
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

interface ReqBody {
  mode: "first_question" | "follow_up" | "final_feedback";
  role: string;
  topics?: string;
  resume?: string;
  history?: { role: "ai" | "user"; content: string }[];
  questionNumber?: number;
  totalQuestions?: number;
  lastAnswer?: string;
  difficulty?: "easy" | "medium" | "hard";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(messages: any[], tools?: any[], toolChoice?: any) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = { model: MODEL, messages };
  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw Object.assign(new Error("Rate limit exceeded. Try again in a moment."), { status: 429 });
  if (res.status === 402) throw Object.assign(new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage."), { status: 402 });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    const { mode, role, topics, resume, history = [], questionNumber = 1, totalQuestions = 8, lastAnswer, difficulty = "medium" } = body;

    if (!mode || !role) return jsonResponse({ error: "mode and role required" }, 400);

    const resumeContext = resume ? `\n\nCANDIDATE RESUME (first 3000 chars):\n${resume.slice(0, 3000)}` : "";
    const topicsContext = topics ? `\n\nFOCUS TOPICS: ${topics}` : "";

    if (mode === "first_question") {
      const sys = `You are Aria, a senior technical interviewer for the role of ${role}. Ask exactly ONE concise opening question — warm but professional, role-specific, and answerable in 2-4 sentences. Do not number the question. Do not preamble with "Let's begin" or similar fluff. Just the question itself.${topicsContext}${resumeContext}`;
      const data = await callAI([
        { role: "system", content: sys },
        { role: "user", content: `Generate question 1 of ${totalQuestions}. Difficulty: ${difficulty}.` },
      ]);
      const question = data.choices?.[0]?.message?.content?.trim() ?? "Tell me about a project you're most proud of and why.";
      return jsonResponse({ question });
    }

    if (mode === "follow_up") {
      // Use tool calling for structured output: evaluation + next question
      const conversationStr = history.map((m) => `${m.role === "ai" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`).join("\n\n");
      const sys = `You are Aria, an expert interviewer for ${role}. After each answer you (1) score it across three dimensions and (2) generate ONE adaptive follow-up question that builds on what they said.

Scoring rubric (0-100 each):
- relevance: how well the answer addresses what was asked, with concrete role-specific content
- creativity: original thinking, trade-off awareness, novel angles
- depth: technical detail, reasoning, examples, edge-case awareness

Anti-cheating: If an answer feels generic, copy-pasted, or contradicts earlier statements, lower the scores and probe deeper in the follow-up.

Adaptive difficulty: If scores are high (>75 avg), make the next question harder (system design, edge cases). If low (<50), step down to fundamentals.

Keep the next question to ONE sentence, no preamble, no numbering.${topicsContext}${resumeContext}`;
      const data = await callAI(
        [
          { role: "system", content: sys },
          { role: "user", content: `Conversation so far:\n\n${conversationStr}\n\nThis is question ${questionNumber} of ${totalQuestions}. Evaluate the candidate's last answer and produce the next question.` },
        ],
        [
          {
            type: "function",
            function: {
              name: "evaluate_and_continue",
              description: "Score the last answer and produce the next adaptive interview question.",
              parameters: {
                type: "object",
                properties: {
                  relevance: { type: "integer", minimum: 0, maximum: 100 },
                  creativity: { type: "integer", minimum: 0, maximum: 100 },
                  depth: { type: "integer", minimum: 0, maximum: 100 },
                  reasoning: { type: "string", description: "1-2 sentence private reasoning explaining the scores" },
                  hint: { type: "string", description: "Optional one-line constructive hint shown to the candidate (can be empty)" },
                  next_question: { type: "string", description: "The next adaptive question, one sentence." },
                },
                required: ["relevance", "creativity", "depth", "reasoning", "next_question"],
                additionalProperties: false,
              },
            },
          },
        ],
        { type: "function", function: { name: "evaluate_and_continue" } }
      );
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) throw new Error("AI did not return structured evaluation");
      const args = JSON.parse(call.function.arguments);
      return jsonResponse(args);
    }

    if (mode === "final_feedback") {
      const conversationStr = history.map((m) => `${m.role === "ai" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`).join("\n\n");
      const sys = `You are Aria, summarizing a full ${role} interview. Produce a candid, concrete final report.`;
      const data = await callAI(
        [
          { role: "system", content: sys },
          { role: "user", content: `Full conversation:\n\n${conversationStr}\n\nProduce the final report.` },
        ],
        [
          {
            type: "function",
            function: {
              name: "final_report",
              description: "Final interview report with scores and qualitative feedback.",
              parameters: {
                type: "object",
                properties: {
                  total_score: { type: "integer", minimum: 0, maximum: 100 },
                  relevance: { type: "integer", minimum: 0, maximum: 100 },
                  creativity: { type: "integer", minimum: 0, maximum: 100 },
                  depth: { type: "integer", minimum: 0, maximum: 100 },
                  strengths: { type: "string", description: "2-3 sentences naming the candidate's strongest areas with specifics from the conversation." },
                  weaknesses: { type: "string", description: "2-3 sentences on weakest areas with specific examples." },
                  feedback: { type: "string", description: "A 4-6 sentence reasoning summary including improvement suggestions." },
                  skills: {
                    type: "array",
                    description: "3-5 specific skills evaluated with score 0-100.",
                    items: {
                      type: "object",
                      properties: { name: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 100 } },
                      required: ["name", "score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["total_score", "relevance", "creativity", "depth", "strengths", "weaknesses", "feedback", "skills"],
                additionalProperties: false,
              },
            },
          },
        ],
        { type: "function", function: { name: "final_report" } }
      );
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) throw new Error("AI did not return final report");
      return jsonResponse(JSON.parse(call.function.arguments));
    }

    return jsonResponse({ error: "unknown mode" }, 400);
  } catch (e: any) {
    console.error("interview-ai error:", e);
    return jsonResponse({ error: e?.message ?? "Unknown error" }, e?.status ?? 500);
  }
});
