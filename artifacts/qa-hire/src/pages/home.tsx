import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Target } from "lucide-react";

export default function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4 md:px-8 border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src={`${basePath}/logo.svg`} alt="QAHire" className="h-8" />
          <div className="flex gap-4">
            <Link href="/sign-in" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary hover:bg-primary/10 h-10 px-4 py-2">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="py-20 md:py-32 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              The daily briefing for <br className="hidden md:block" />
              <span className="text-primary">serious QA engineers.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              QAHire curates, scores, and delivers the best QA testing jobs in India directly to your Telegram. Stop scrolling endless generic job boards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-md hover:-translate-y-0.5 duration-200">
                Start receiving matches <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Scored Relevance</h3>
              <p className="text-muted-foreground">
                We analyze your exact tech stack (Playwright, Appium, Cypress) and experience to score every job from 0-100.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Telegram Delivery</h3>
              <p className="text-muted-foreground">
                Get a single, high-signal briefing every morning directly in Telegram. No spam, no irrelevant junior roles.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Market Intelligence</h3>
              <p className="text-muted-foreground">
                Track your active applications, see who's hiring actively, and understand what the market is paying for your skills.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/40 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} QAHire. Crafted for QA Professionals.</p>
      </footer>
    </div>
  );
}