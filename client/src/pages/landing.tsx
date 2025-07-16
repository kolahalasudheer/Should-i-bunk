import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Brain, Users, TrendingUp } from "lucide-react";
import AuthForm from "@/components/AuthForm"; // Added import for AuthForm

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:bg-background dark:text-foreground">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Should I Bunk?</h1>
          <p className="text-muted-foreground">Smart decision making for students</p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI-Powered Decisions</h3>
                  <p className="text-sm text-muted-foreground">Smart scoring engine with AI-generated excuses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Friend Voting</h3>
                  <p className="text-sm text-muted-foreground">Get opinions from your friends on whether to bunk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-card text-card-foreground">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Personal Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track your bunking patterns and achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            Get Started - Login with Google
          </Button>
        </div>

        {/* Email/Password Auth Form */}
        <div className="mt-6 bg-card text-card-foreground p-6 rounded shadow-md w-full max-w-sm mx-auto">
          <AuthForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Make smarter decisions about your classes</p>
        </div>
      </div>
    </div>
  );
}
