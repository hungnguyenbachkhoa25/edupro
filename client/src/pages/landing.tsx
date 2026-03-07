import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Brain, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">EduPro</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
        </nav>
        <div>
          {isAuthenticated ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all inline-block">
              Go to Dashboard
            </Link>
          ) : (
            <a href="/api/login" className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all inline-block">
              Log in / Sign up
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden flex-1 flex items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
          
          {/* Decorative blurs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/50 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: AI-Powered IELTS Speaking Practice
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-foreground leading-[1.1]">
                Master Your Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">EduPro</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                The ultimate platform for IELTS, SAT, and THPTQG preparation. Practice with adaptive tests, get instant feedback, and achieve your target score.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                    Start Practicing Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-2 hover:bg-muted">
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              {/* landing page hero student learning */}
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop" 
                alt="Student studying" 
                className="rounded-3xl shadow-2xl shadow-black/10 border border-border/50 object-cover"
              />
              {/* Floating badges */}
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border/50 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 delay-300">
                <div className="bg-green-100 text-green-600 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Target Reached</p>
                  <p className="text-xs text-muted-foreground">IELTS 8.0</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-muted/50 border-y border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-muted-foreground text-lg">We combine high-quality questions with intelligent analytics to help you study smarter, not harder.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Brain, title: "Adaptive Practice", desc: "Questions adjust to your skill level, ensuring you're always challenged but never overwhelmed." },
                { icon: Target, title: "Detailed Analytics", desc: "Track your progress over time with deep insights into your strengths and weaknesses." },
                { icon: BookOpen, title: "Premium Material", desc: "Thousands of questions curated by top educators for IELTS, SAT, and national exams." },
              ].map((f, i) => (
                <div key={i} className="bg-card p-8 rounded-3xl shadow-lg shadow-black/5 border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground text-lg">Start for free, upgrade when you need more power.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-md">
                <h3 className="text-2xl font-display font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-6">0<span className="text-lg text-muted-foreground font-normal">đ / mo</span></div>
                <ul className="space-y-4 mb-8 text-muted-foreground">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /> Basic practice tests</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /> Progress tracking</li>
                  <li className="flex items-center gap-3 opacity-50"><CheckCircle className="w-5 h-5" /> Explanations</li>
                </ul>
                <Button className="w-full rounded-xl" variant="outline">Current Plan</Button>
              </div>
              
              {/* Pro */}
              <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-2xl relative transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-yellow-950 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-6">99k<span className="text-lg opacity-80 font-normal">đ / mo</span></div>
                <ul className="space-y-4 mb-8 opacity-90">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5" /> All Free features</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5" /> Detailed explanations</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5" /> Advanced analytics</li>
                </ul>
                <Button className="w-full rounded-xl bg-white text-primary hover:bg-gray-100 border-0">Upgrade to Pro</Button>
              </div>

              {/* Premium */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-md">
                <h3 className="text-2xl font-display font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold mb-6">199k<span className="text-lg text-muted-foreground font-normal">đ / mo</span></div>
                <ul className="space-y-4 mb-8 text-muted-foreground">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /> All Pro features</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /> AI Speaking Partner</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-primary" /> Essay Grading</li>
                </ul>
                <Button className="w-full rounded-xl" variant="outline">Upgrade to Premium</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 EduPro Platform. Built for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
