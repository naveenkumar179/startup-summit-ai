import { Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "./BrandMark";

const links = [
  { label: "Startups", href: "#startups" },
  { label: "Investors", href: "#investors" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
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
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground">
              Resources <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href="#faq" className="flex items-center gap-2 cursor-pointer">
                  <HelpCircle className="h-4 w-4" /> FAQ
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#resources" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" /> Contact Support
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
