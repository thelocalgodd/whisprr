"use client";

import { ArrowRight, Shield, UserCheck, Clock, Users, MessageCircle, Heart, Lock, CheckCircle, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-emerald-600">
                Whisprr
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#safety" className="text-slate-600 hover:text-emerald-600 transition-colors">Safety</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 transition-colors">How It Works</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-600">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-slate-100 py-4">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
                <a href="#safety" className="text-slate-600 hover:text-emerald-600 transition-colors">Safety</a>
                <a href="#how-it-works" className="text-slate-600 hover:text-emerald-600 transition-colors">How It Works</a>
                <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-8 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
            Anonymous • Secure • Supportive
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Mental health support in
            <span className="text-emerald-600 block">complete anonymity</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Connect with verified counselors and supportive peers without revealing your identity. 
            Get the help you need in a safe, encrypted environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-4">
                Start Anonymous Chat
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/counselors">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Browse Counselors
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-emerald-600" />
              End-to-end encrypted
            </div>
            <div className="flex items-center">
              <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
              Verified counselors
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-emerald-600" />
              24/7 crisis support
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need for anonymous support
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Professional counseling and peer support, all while maintaining your complete privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Support Groups</h3>
                <p className="text-slate-600 mb-4">
                  Join topic-based groups like Anxiety, Depression, or Relationships with others who understand.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Counselor-moderated
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Join or leave anytime
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Private Counseling</h3>
                <p className="text-slate-600 mb-4">
                  One-on-one sessions with verified counselors. All conversations are encrypted.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                    ID-verified professionals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                    Specialized expertise
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Crisis Support</h3>
                <p className="text-slate-600 mb-4">
                  Advanced safety systems with crisis detection and instant access to professional help.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-red-600" />
                    24/7 emergency access
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-red-600" />
                    AI-powered monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Complete Anonymity</h3>
                <p className="text-slate-600 mb-4">
                  System-generated usernames, no personal data stored. Your identity remains private.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-amber-600" />
                    Zero personal identifiers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-amber-600" />
                    Pseudonym-based storage
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Support Circles</h3>
                <p className="text-slate-600 mb-4">
                  Small, counselor-led groups with up to 15 participants for deeper ongoing support.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Professional facilitation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Intimate group settings
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Resource Library</h3>
                <p className="text-slate-600 mb-4">
                  Access curated articles, exercises, and tools for mental wellness and progress tracking.
                </p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                    Professional resources
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                    Progress tracking
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Your safety and privacy come first
          </h2>
          <p className="text-xl text-slate-600 mb-12">
            Built with advanced security measures to protect your identity and ensure your conversations remain private.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">End-to-End Encryption</h3>
              <p className="text-slate-600">All messages are encrypted and can only be read by you and your counselor.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Verified Counselors</h3>
              <p className="text-slate-600">All counselors are licensed professionals verified through our rigorous process.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Crisis Detection</h3>
              <p className="text-slate-600">AI-powered systems monitor for crisis situations and provide immediate support.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Emergency Support Available 24/7</h3>
            <p className="text-slate-600 mb-6">
              If you're in crisis, our emergency support system connects you instantly with trained crisis counselors and local resources.
            </p>
            <Button className="bg-red-600 hover:bg-red-700">
              <Heart className="w-4 h-4 mr-2" />
              Access Crisis Support
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How Whisprr works
            </h2>
            <p className="text-xl text-slate-600">
              Getting support has never been easier or more private.
            </p>
          </div>
          
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Sign up anonymously</h3>
                <p className="text-slate-600">
                  Create your account with just a username and password. No personal information required.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Choose your support</h3>
                <p className="text-slate-600">
                  Browse counselors by specialty, join support groups, or access crisis support when needed.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Start your journey</h3>
                <p className="text-slate-600">
                  Begin conversations in complete privacy with the support system that works best for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to start your anonymous journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands who have found support while maintaining complete privacy. Your mental health matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-4">
                Start Anonymous Chat
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/counselors">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-4 bg-transparent"
              >
                Browse Counselors
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-emerald-400 mb-4">Whisprr</h3>
              <p className="text-slate-300 mb-6">
                Anonymous mental health support that puts your privacy first. Connect with counselors and peers safely.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-sm text-slate-300">Your conversations are private and encrypted</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="/help" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="/crisis" className="hover:text-emerald-400 transition-colors">Crisis Support</a></li>
                <li><a href="/resources" className="hover:text-emerald-400 transition-colors">Resources</a></li>
                <li><a href="/contact" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="/about" className="hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-emerald-400 transition-colors">Terms</a></li>
                <li><a href="/counselors/apply" className="hover:text-emerald-400 transition-colors">Become a Counselor</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} Whisprr. All rights reserved.
              </p>
              <p className="text-slate-400 text-sm mt-4 md:mt-0">
                If you're in crisis, call 988 (Suicide & Crisis Lifeline) or your local emergency services.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}