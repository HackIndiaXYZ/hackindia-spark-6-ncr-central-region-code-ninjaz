import { useNavigate } from "react-router-dom";
import { Nav } from "@/components/Nav";

const SECTIONS: { label: string; cards: { num: string; icon: string; title: string; topics: string }[] }[] = [
  {
    label: "Web Development",
    cards: [
      { num: "Web · 8 Qs", icon: "⚛️", title: "Frontend Developer", topics: "React, Vue, JS/TS, CSS, Performance, Accessibility, Testing" },
      { num: "Web · 8 Qs", icon: "⚙️", title: "Backend Engineer", topics: "Node.js, Python, REST APIs, GraphQL, SQL, Microservices, System Design" },
      { num: "Web · 8 Qs", icon: "🔄", title: "Full Stack Developer", topics: "MERN stack, REST APIs, Auth, Docker, CI/CD" },
      { num: "Mobile · 8 Qs", icon: "📱", title: "Mobile Developer", topics: "React Native, Flutter, iOS Swift, Android Kotlin, Architecture" },
    ],
  },
  {
    label: "AI / Data",
    cards: [
      { num: "AI · 8 Qs", icon: "🧠", title: "ML Engineer", topics: "Python, TensorFlow, PyTorch, Neural Networks, MLOps" },
      { num: "Data · 8 Qs", icon: "📊", title: "Data Scientist", topics: "Statistics, SQL, Visualization, ML, A/B Testing" },
      { num: "Data · 8 Qs", icon: "🗄️", title: "Data Engineer", topics: "SQL, Spark, ETL Pipelines, Airflow, Data Warehousing" },
      { num: "AI · 8 Qs", icon: "🤖", title: "AI/LLM Engineer", topics: "LangChain, RAG, Prompt Engineering, Vector DBs, Fine-tuning" },
    ],
  },
  {
    label: "Infrastructure & Design",
    cards: [
      { num: "Infra · 8 Qs", icon: "🛠️", title: "DevOps Engineer", topics: "Docker, Kubernetes, CI/CD, Terraform, Cloud, Monitoring" },
      { num: "Infra · 8 Qs", icon: "☁️", title: "Cloud Architect", topics: "AWS/Azure/GCP, Serverless, IaC, HA, Cost Optimization" },
      { num: "Security · 8 Qs", icon: "🔐", title: "Security Engineer", topics: "OWASP, Pen Testing, Cryptography, IAM, Incident Response" },
      { num: "Design · 8 Qs", icon: "🎨", title: "Product Designer", topics: "Figma, UX Research, Interaction Design, Design Systems" },
    ],
  },
];

export default function MockSelect() {
  const nav = useNavigate();
  const start = (role: string, topics: string) =>
    nav(`/interview?role=${encodeURIComponent(role)}&mode=mock&topics=${encodeURIComponent(topics)}`);

  return (
    <>
      <Nav />
      <div className="app">
        <div className="page">
          <div className="section-head">
            <div>
              <div className="section-title">Mock Interview — Choose Your Domain</div>
              <p className="hero-sub" style={{ marginBottom: 0 }}>
                Pick a role. Aria will ask 8 adaptive technical questions and give live feedback after each answer.
              </p>
            </div>
            <button className="btn-ghost" onClick={() => nav("/home")}>
              ← Back
            </button>
          </div>

          {SECTIONS.map((s) => (
            <div key={s.label}>
              <div className="section-label">{s.label}</div>
              <div className="steps-row">
                {s.cards.map((c) => (
                  <div key={c.title} className="step-card clickable" onClick={() => start(c.title, c.topics)}>
                    <div className="step-num">{c.num}</div>
                    <div className="step-icon-wrap">{c.icon}</div>
                    <div className="step-title">{c.title}</div>
                    <div className="step-desc">{c.topics}</div>
                  </div>
                ))}
              </div>
              <div className="divider" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
