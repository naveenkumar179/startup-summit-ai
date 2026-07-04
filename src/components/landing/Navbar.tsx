import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./BrandMark";

const links = [
  { label: "Home", href: "/", active: true },
  { label: "Startups", href: "/" },
  { label: "Investors", href: "/" },
  { label: "How it Works", href: "/" },
  { label: "Pricing", href: "/" },
];

export function Navbar() {
  return (
    <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            StartupBridge
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className={`text-sm transition-colors ${
                l.active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            Resources <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <a href="/api/login">
            <Button variant="outline" className="rounded-lg">
              Login
            </Button>
          </a>
          <a href="/api/login">
            <Button className="rounded-lg bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]">
              Sign Up
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
