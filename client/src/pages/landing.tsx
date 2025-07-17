import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Brain, Users, TrendingUp, Sparkles } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import { useEffect, useRef } from "react";

export default function Landing() {
  // For animated title
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.classList.add("animate-fade-in-down");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 dark:bg-gradient-to-br dark:text-foreground">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-primary via-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-gradient-x relative overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-tr from-primary/60 via-fuchsia-400/40 to-purple-600/60 animate-pulse rounded-full z-0" />
            <GraduationCap className="w-10 h-10 text-white z-10 relative drop-shadow-lg" />
          </div>
          <h1 ref={titleRef} className="text-4xl sm:text-5xl font-extrabold mb-2 tracking-tight text-gradient bg-gradient-to-r from-primary via-fuchsia-500 to-purple-600 bg-clip-text text-transparent transition-all duration-700">
            Should I Bunk?
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in-up">Smart decision making for students</p>
        </div>

        {/* Features */}
        <div className="space-y-6 mb-10">
          <Card className="border-none shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl group">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">AI-Powered Decisions</h3>
                <p className="text-sm text-muted-foreground">Smart scoring engine with AI-generated excuses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl group">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Friend Voting</h3>
                <p className="text-sm text-muted-foreground">Get opinions from your friends on whether to bunk</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl group bg-card text-card-foreground">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Personal Analytics</h3>
                <p className="text-sm text-muted-foreground">Track your bunking patterns and achievements</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mb-2">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-gradient-to-r from-primary via-fuchsia-500 to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 text-lg relative overflow-hidden"
            style={{ boxShadow: '0 4px 24px 0 rgba(128,0,255,0.15)' }}
          >
            <Sparkles className="inline-block mr-2 animate-fade-in-up" />
            Get Started - Login with Google
          </Button>
          <div className="text-xs text-muted-foreground mt-2 animate-fade-in-up">No spam, just smart decisions!</div>
        </div>

        {/* Email/Password Auth Form */}
        <div className="mt-8 bg-card/80 backdrop-blur-md text-card-foreground p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-auto border border-primary/10 animate-fade-in-up">
          <AuthForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-sm text-muted-foreground flex flex-col items-center gap-2 animate-fade-in-up">
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary to-purple-600 mb-1">
            <GraduationCap className="w-4 h-4 text-white" />
          </span>
          <p>Make smarter decisions about your classes</p>
        </div>
      </div>
    </div>
  );
}

// Tailwind custom animations (add to your tailwind.config.js if not present):
// animate-fade-in-down, animate-fade-in-up, animate-gradient-x, animate-bounce-slow
