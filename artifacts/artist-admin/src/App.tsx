import { Switch, Route, Router as WouterRouter } from "wouter";
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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
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
          <Router />
        </WouterRouter>
        <Toaster />
        <Sonner richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
