import { useState } from "react";
import { Link } from "wouter";
import { useListArtists, useListGenres, useDeleteArtist, getListArtistsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Mic2, Loader2, Bot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function ArtistList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [genre, setGenre] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data, isLoading } = useListArtists({
    page,
    limit,
    search: debouncedSearch || undefined,
    genre: genre !== "all" ? genre : undefined,
  });

  const { data: genreData } = useListGenres();
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  const deleteMutation = useDeleteArtist({
    mutation: {
      onSuccess: () => {
        toast.success("Artist deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListArtistsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast.error("Failed to delete artist");
        setDeleteId(null);
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex sm:items-end justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Roster</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage artists and their MCP context embeddings.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <Link href="/artists/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Artist
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border shadow-xl shadow-black/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search artists..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/50"
          />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-[200px] bg-background/50 border-border/50 focus:ring-primary/50">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genreData?.genres.map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : data?.artists.length === 0 ? (
        <div className="text-center p-20 border border-dashed border-border rounded-xl bg-card/20 backdrop-blur-sm">
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No artists found</h3>
          <p className="text-muted-foreground text-base mb-8 max-w-sm mx-auto">We couldn't find any artists matching your current search and filter criteria.</p>
          <Button variant="outline" onClick={() => { setSearch(""); setGenre("all"); }} className="border-border/50">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.artists.map(artist => (
            <div key={artist.id} className="bg-card/40 backdrop-blur-sm border border-border/60 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group hover:shadow-xl hover:shadow-primary/5 flex flex-col">
              <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                {artist.imageUrl ? (
                  <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                    <Mic2 className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                
                {artist.llmContext && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <Bot className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/90 font-mono">AI Context</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-md bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/artists/${artist.id}`} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" /> Edit Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => setDeleteId(artist.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <Link href={`/artists/${artist.id}`} className="font-bold text-xl hover:text-primary transition-colors line-clamp-1 mb-1 tracking-tight">
                  {artist.name}
                </Link>
                {artist.origin && (
                  <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5 font-mono truncate">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    {artist.origin}
                  </p>
                )}
                
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {artist.genres?.slice(0, 3).map(g => (
                    <Badge key={g} variant="secondary" className="text-[10px] font-mono uppercase tracking-wider bg-secondary/40 hover:bg-secondary/60 text-foreground/80 border-border/50 py-0.5 px-2">{g}</Badge>
                  ))}
                  {artist.genres?.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider bg-secondary/20 text-muted-foreground border-border/50 py-0.5 px-2">+{artist.genres.length - 3}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-8 pb-12">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="bg-card/50">Previous</Button>
          <div className="flex items-center px-4 text-sm font-medium font-mono text-muted-foreground bg-card/30 rounded-md border border-border/50">
            Page {page} of {data.totalPages}
          </div>
          <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} className="bg-card/50">Next</Button>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Artist Profile
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you absolutely sure? This will permanently delete the artist profile
              and remove their embedding data from the MCP index.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
