import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { useAuth } from "@/hooks/use-auth";

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
  const { isLoading, isAuthenticated, hasRole, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!hasRole) {
      navigate({ to: "/select-role" });
    } else {
      navigate({ to: user!.role === "investor" ? "/investor/dashboard" : "/founder/dashboard" });
    }
  }, [isLoading, isAuthenticated, hasRole, user]);

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
    </div>
  );
}
