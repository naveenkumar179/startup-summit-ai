import {
  Rocket,
  Brain,
  Users,
  ArrowRight,
  Search,
  ShieldCheck,
  LineChart,
  FileText,
  MessageSquare,
  CheckCircle2,
  Check,
} from "lucide-react";

export function StartupsSection() {
  const points = [
    {
      icon: Brain,
      title: "AI Pitch Analysis",
      desc: "Upload your pitch deck and get an instant AI-generated score, strengths, weaknesses, and improvement suggestions.",
    },
    {
      icon: Users,
      title: "Get Discovered",
      desc: "Publish your startup profile so investors actively looking for opportunities like yours can find you.",
    },
    {
      icon: LineChart,
      title: "Improve Before You Pitch",
      desc: "Use AI-generated recommendations to strengthen your narrative, market sizing, and financials before investor meetings.",
    },
  ];

  return (
    <section id="startups" className="scroll-mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">
              <Rocket className="h-3.5 w-3.5" /> For Founders
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              Built for startups raising their next round
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              List your startup, get AI-powered feedback on your pitch deck, and put your best
              foot forward with investors who are the right fit for your stage and industry.
            </p>
            <a
              href="/api/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary/90"
            >
              I'm a Founder <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {points.map((p) => (
              <div key={p.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function InvestorsSection() {
  const points = [
    {
      icon: Search,
      title: "Discover Vetted Startups",
      desc: "Search and filter startups by industry, stage, and funding needs to find deals that match your thesis.",
    },
    {
      icon: ShieldCheck,
      title: "AI Due Diligence",
      desc: "Generate SWOT analysis, risk assessments, and an investment readiness score in seconds, not days.",
    },
    {
      icon: MessageSquare,
      title: "Ask the Pitch Deck Anything",
      desc: "Chat directly with an AI trained on each startup's pitch deck to get quick answers before a call.",
    },
  ];

  return (
    <section id="investors" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 grid grid-cols-1 gap-4 lg:order-1">
            {points.map((p) => (
              <div key={p.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <p.icon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <Users className="h-3.5 w-3.5" /> For Investors
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              Make smarter, faster investment decisions
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Skip the manual research. Discover promising startups, run AI due diligence in
              seconds, and keep your pipeline organized in one place.
            </p>
            <a
              href="/api/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-accent"
            >
              I'm an Investor <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Create your profile",
      desc: "Sign up and choose whether you're a founder or an investor to unlock the right tools.",
    },
    {
      step: "02",
      title: "Upload or discover",
      desc: "Founders upload a pitch deck for instant AI analysis. Investors browse published startups.",
    },
    {
      step: "03",
      title: "Get AI insights",
      desc: "Generate scores, SWOT reports, and improvement suggestions powered by AI in seconds.",
    },
    {
      step: "04",
      title: "Connect & save",
      desc: "Investors save startups to a watchlist and portfolio; founders refine and republish their pitch.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            How StartupBridge works
          </h2>
          <p className="mt-4 text-muted-foreground">
            A simple, guided path for founders and investors to connect and move fast.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="rounded-2xl border border-border bg-card p-6">
              <span className="text-3xl font-bold text-primary/30">{s.step}</span>
              <h3 className="mt-3 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      desc: "For founders and investors just getting started.",
      features: ["1 startup profile or watchlist", "Basic AI pitch analysis", "Discover published startups", "Community support"],
      cta: "Get started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      desc: "For active founders and investors who need the full AI toolkit.",
      features: [
        "Unlimited startup profiles",
        "Full AI due diligence reports",
        "Pitch deck chat & improvement suggestions",
        "Watchlist & portfolio tracking",
        "Priority support",
      ],
      cta: "Start free trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For accelerators, funds, and platforms managing many deals.",
      features: ["Everything in Pro", "Team seats & permissions", "Dedicated onboarding", "Custom integrations"],
      cta: "Contact sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you need the full power of AI-driven analysis.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                p.highlight ? "border-primary shadow-[var(--shadow-glow)]" : "border-border"
              } bg-card`}
            >
              {p.highlight && (
                <span className="mb-3 inline-block w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/api/login"
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const faqs = [
    {
      q: "Is StartupBridge free to use?",
      a: "Yes. Founders and investors can create a profile, publish or discover startups, and run a basic AI pitch analysis for free on the Starter plan.",
    },
    {
      q: "How does the AI pitch deck analysis work?",
      a: "Upload a PDF pitch deck and our AI reviews the content to generate an overall score, strengths, weaknesses, category-by-category feedback, and suggested investor types.",
    },
    {
      q: "Can investors message founders directly?",
      a: "Yes, once you're signed in you can save startups to your watchlist and reach out through the built-in messaging tools.",
    },
    {
      q: "Do you support both founders and investors on the same account?",
      a: "Each account selects a single role (founder or investor) at sign-up so the dashboard and tools are tailored to what you need.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know before you get started.</p>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                {f.q}
                <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer id="resources" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Questions? Reach us at{" "}
            <a href="mailto:support@startupbridge.ai" className="font-medium text-primary hover:underline">
              support@startupbridge.ai
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            © {new Date().getFullYear()} StartupBridge. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
