import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mic2, Users, LayoutDashboard, Search as SearchIcon, Command, Loader2, Server, LogOut } from "lucide-react";
import { useHealthCheck, useSearchArtists } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function Layout({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  const [location, setLocation] = useLocation();
  const { data: health } = useHealthCheck({ query: { refetchInterval: 30000 } });
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { data: searchResults, isLoading: isSearching } = useSearchArtists(
    { q: debouncedSearch, limit: 5 },
    { query: { enabled: debouncedSearch.length > 1 } }
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/artists", label: "Artists", icon: Users },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 relative z-20 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar/50">
          <Link href="/" className="flex items-center gap-2 text-sidebar-primary hover:opacity-80 transition-opacity">
            <Mic2 className="w-6 h-6" />
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">FreqDirectory</span>
          </Link>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-sidebar-foreground/50 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-md border border-sidebar-border transition-colors"
          >
            <span className="flex items-center gap-2"><SearchIcon className="w-4 h-4" /> Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium opacity-100"><Command className="w-3 h-3" /> K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4 px-2 mt-2">Main Menu</div>
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium text-sm ${active ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"}`}>
                <item.icon className={`w-4 h-4 ${active ? "text-sidebar-primary" : "text-sidebar-foreground/50"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50 bg-sidebar/50 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className={`flex items-center justify-center w-6 h-6 rounded-md ${health?.status === "ok" ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"}`}>
                <Server className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sidebar-foreground/80">API Server</span>
                <span className={health?.status === "ok" ? "text-emerald-500" : "text-destructive"}>
                  {health?.status === "ok" ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="flex items-center justify-center w-7 h-7 rounded-md text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Link href="/privacy-policy" className="block text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background/95">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10 scroll-smooth">
          {children}
        </div>
      </main>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-2xl bg-card/80 backdrop-blur-xl border-border shadow-2xl">
          <div className="flex items-center border-b border-border px-3">
            <SearchIcon className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists by name, bio, or genre..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-lg"
            />
            {isSearching && <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {debouncedSearch.length < 2 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search directory...
              </div>
            ) : searchResults?.results.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No artists found matching "{debouncedSearch}"
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults?.results.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setLocation(`/artists/${artist.id}`);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                      {artist.imageUrl ? (
                        <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Mic2 className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{artist.name}</div>
                      <div className="text-xs text-muted-foreground truncate font-mono">
                        {artist.genres.join(", ")} {artist.origin ? `• ${artist.origin}` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
