import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Disc3, Mic2, Loader2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import MerchCard from "@/components/MerchCard";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">System status and directory metrics for MCP index.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Artists</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-mono tracking-tighter">{stats.totalArtists}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Genres</CardTitle>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground/70">
              <Disc3 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-mono tracking-tighter">{stats.totalGenres}</div>
          </CardContent>
        </Card>
      </div>

      <MerchCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-card/30 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-primary" />
              Top Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {stats.topGenres.map((g) => (
                <div key={g.genre} className="flex items-center group">
                  <div className="w-full flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground/90 group-hover:text-primary transition-colors">{g.genre}</span>
                      <span className="text-sm font-mono text-muted-foreground">{g.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/80 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (g.count / stats.totalArtists) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {stats.topGenres.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No genres tracked yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-card/30 backdrop-blur-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-primary" />
              Recently Added
            </CardTitle>
            <Link href="/artists" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentlyAdded.map((artist) => (
                <Link key={artist.id} href={`/artists/${artist.id}`} className="flex items-center gap-4 group p-3 -mx-3 rounded-lg hover:bg-secondary/40 transition-colors border border-transparent hover:border-border">
                  <div className="w-12 h-12 rounded-md bg-secondary/80 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                    {artist.imageUrl ? (
                      <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Mic2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{artist.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{artist.genres?.join(", ") || "Uncategorized"}</p>
                  </div>
                </Link>
              ))}
              {stats.recentlyAdded.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No artists in directory yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
