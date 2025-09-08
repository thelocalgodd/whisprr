import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Safety } from "@/components/landing/Safety";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Safety />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
