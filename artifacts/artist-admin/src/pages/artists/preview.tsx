import { useGetArtistBySlug } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Loader2, Mic2, ArrowLeft, Globe, Twitter, Instagram, Disc } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ArtistPreview() {
  const { slug } = useParams();
  const { data: artist, isLoading, error } = useGetArtistBySlug(slug || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <Mic2 className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Artist Not Found</h2>
        <p className="text-muted-foreground">The requested slug does not match any artist.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/artists">Back to Roster</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="bg-background hover:bg-secondary">
          <Link href="/artists"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Preview</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Read-only view by slug: {artist.slug}</p>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
        <div className="h-48 bg-secondary/30 relative overflow-hidden">
           {artist.imageUrl && (
             <>
               <SafeImage src={artist.imageUrl} alt="" className="w-full h-full object-cover blur-xl opacity-50 scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
             </>
           )}
        </div>
        
        <div className="px-8 pb-8 relative -mt-24">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-6">
            <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-card bg-secondary shadow-2xl shrink-0">
              <SafeImage
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <Mic2 className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                }
              />
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-2">{artist.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm font-mono text-muted-foreground">
                {artist.origin && <span>{artist.origin}</span>}
                {artist.origin && artist.formedYear && <span>•</span>}
                {artist.formedYear && <span>Est. {artist.formedYear}</span>}
              </div>
            </div>
            <div className="flex gap-2 pb-2">
               {artist.socialLinks?.website && (
                 <a href={artist.socialLinks.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                   <Globe className="w-5 h-5" />
                 </a>
               )}
               {artist.socialLinks?.twitter && (
                 <a href={artist.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                   <Twitter className="w-5 h-5" />
                 </a>
               )}
               {artist.socialLinks?.instagram && (
                 <a href={artist.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                   <Instagram className="w-5 h-5" />
                 </a>
               )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {artist.genres.map(g => (
              <Badge key={g} className="bg-primary/20 text-primary hover:bg-primary/30 border-none font-mono uppercase tracking-wider px-3 py-1 text-xs">{g}</Badge>
            ))}
          </div>

          {artist.shortBio && (
            <p className="text-xl font-serif italic text-foreground/90 mb-8 border-l-4 border-primary/50 pl-4">{artist.shortBio}</p>
          )}

          <div className="prose prose-invert max-w-none mb-12">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">{artist.bio}</p>
          </div>

          {artist.discography && artist.discography.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                <Disc className="w-5 h-5 text-primary" /> 
                Selected Discography
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artist.discography.map((release, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-secondary/20 border border-border/50">
                    <div>
                      <div className="font-bold">{release.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 capitalize">{release.type} • {release.year}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
