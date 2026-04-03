import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import ArtistList from "@/pages/artists/list";
import ArtistEditor from "@/pages/artists/editor";
import ArtistPreview from "@/pages/artists/preview";
import PrivacyPolicy from "@/pages/privacy-policy";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AuthGate() {
  const { state, logout, recheck } = useAuth();
  const [location] = useLocation();

  if (location === "/privacy-policy") {
    return <PrivacyPolicy standalone />;
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "unauthenticated") {
    return <Login onSuccess={recheck} />;
  }

  return (
    <Layout onLogout={logout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/artists" component={ArtistList} />
        <Route path="/artists/new" component={ArtistEditor} />
        <Route path="/artists/:id" component={ArtistEditor} />
        <Route path="/preview/:slug" component={ArtistPreview} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate />
        </WouterRouter>
        <Toaster />
        <Sonner richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
