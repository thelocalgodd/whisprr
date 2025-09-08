import {
  Users,
  MessageCircle,
  Heart,
  Lock,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need for Anonymous Support
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our platform combines the best of peer support with professional
            counseling, all while maintaining your complete anonymity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Group Forums
              </h3>
              <p className="text-slate-600 mb-4">
                Join topic-based support groups like #Anxiety, #Relationships,
                or #Depression. Connect with others who understand your journey.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                  Counselor-moderated discussions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                  Join or leave anytime
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Private Counseling
              </h3>
              <p className="text-slate-600 mb-4">
                One-on-one sessions with verified counselors. All conversations
                are encrypted and automatically deleted after 30 days.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                  ID-verified professionals
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                  Specialized expertise tags
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Crisis Support
              </h3>
              <p className="text-slate-600 mb-4">
                Advanced safety systems with crisis keyword detection and
                instant access to professional hotlines when you need immediate
                help.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-red-600" />
                  24/7 panic button access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-red-600" />
                  AI-powered safety monitoring
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Complete Anonymity
              </h3>
              <p className="text-slate-600 mb-4">
                System-generated usernames, no personal data stored. Your
                identity remains completely private throughout your journey.
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Support Circles
              </h3>
              <p className="text-slate-600 mb-4">
                Join small, counselor-led support groups with up to 15
                participants. Scheduled sessions for deeper, ongoing support.
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

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Resource Library
              </h3>
              <p className="text-slate-600 mb-4">
                Access curated articles, exercises, and tools for mental
                wellness. Export your session notes and track your progress
                privately.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                  Professional resources
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                  Progress tracking tools
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
