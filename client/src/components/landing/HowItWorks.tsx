export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Getting Started is Simple
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Begin your journey to better mental health in just a few steps, with
            complete privacy from day one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Create Anonymous Profile
            </h3>
            <p className="text-slate-600">
              Get a system-generated username like "User_5X2K9" and set your
              password. No personal information required.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Choose Your Support
            </h3>
            <p className="text-slate-600">
              Browse verified counselors, join topic-based groups, or start with
              our resource library to find what works for you.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Start Your Journey
            </h3>
            <p className="text-slate-600">
              Begin conversations, join support circles, and access crisis
              support whenever you need it—all completely anonymous.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
