import { ArrowRight, Sparkles, Users, LineChart } from "lucide-react";
import { HeroPreviewCard } from "./HeroPreviewCard";

const features = [
  {
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-accent",
    title: "AI-Powered Analysis",
    desc: "Get AI insights and improve your pitch deck",
  },
  {
    icon: Users,
    color: "text-success",
    bg: "bg-success/10",
    title: "Smart Matching",
    desc: "Connect with the right investors/startups",
  },
  {
    icon: LineChart,
    color: "text-warning",
    bg: "bg-warning/10",
    title: "Data-Driven Decisions",
    desc: "Make better investment decisions with AI",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle purple decoration */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.85 0.12 290) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Connect. Pitch. Invest.
              <br />
              Build the future together.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              StartupBridge is an AI-powered platform that connects innovative
              startups with the right investors.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button className="group flex items-center gap-4 rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90 transition">
                <div className="text-left">
                  <div className="text-base font-semibold">I'm a Founder</div>
                  <div className="text-xs opacity-90">Share your idea</div>
                </div>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button className="group flex items-center gap-4 rounded-xl border border-border bg-card px-6 py-4 text-foreground hover:border-primary/40 hover:bg-accent transition">
                <div className="text-left">
                  <div className="text-base font-semibold">I'm an Investor</div>
                  <div className="text-xs text-muted-foreground">Discover startups</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Feature strip */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Preview card */}
          <div className="relative">
            <HeroPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
