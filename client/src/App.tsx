import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import History from "@/pages/history";
import Stats from "@/pages/stats";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import AttendedHistory from "@/pages/attended-history";
import ConfessionsPage from "@/pages/confessions";
import { ThemeProvider } from "@/lib/themeContext";
import PlannerPage from "@/pages/planner";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/history" component={History} />
          <Route path="/stats" component={Stats} />
          <Route path="/profile" component={Profile} />
          <Route path="/attended-history" component={AttendedHistory} />
          <Route path="/planner" component={PlannerPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
