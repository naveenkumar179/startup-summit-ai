import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StartupBridge — AI-Powered Platform for Startups & Investors" },
      {
        name: "description",
        content:
          "StartupBridge is an AI-powered platform that connects innovative startups with the right investors. Pitch, analyze, and invest smarter.",
      },
      { property: "og:title", content: "StartupBridge — Connect. Pitch. Invest." },
      {
        property: "og:description",
        content:
          "AI-powered analysis, smart matching, and data-driven investment decisions for founders and investors.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
    </div>
  );
}
