import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 bg-emerald-600">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Start Your Anonymous Journey?
        </h2>
        <p className="text-xl text-emerald-100 mb-8">
          Join thousands who have found support while maintaining complete
          privacy. Your mental health matters, and your anonymity is guaranteed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-3"
          >
            Start Anonymous Chat
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-3 bg-transparent"
          >
            Browse Counselors
          </Button>
        </div>
      </div>
    </section>
  );
}
