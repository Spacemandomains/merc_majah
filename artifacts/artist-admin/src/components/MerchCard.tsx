import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, ExternalLink, Loader2 } from "lucide-react";

interface MerchItem {
  name: string;
  price: number;
  currency: string;
  description: string;
  paymentLink: string;
  available: boolean;
}

export default function MerchCard() {
  const [merch, setMerch] = useState<MerchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/merch")
      .then((r) => r.json())
      .then((data) => { setMerch(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/30 backdrop-blur-sm border-border">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !merch) return null;

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="w-4 h-4 text-primary" />
          Official Merch
        </CardTitle>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
          Available Now
        </span>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-lg leading-tight">{merch.name}</p>
            <p className="text-2xl font-bold font-mono text-primary mt-1">
              ${merch.price}
              <span className="text-sm font-normal text-muted-foreground ml-1">{merch.currency}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
              {merch.description}
            </p>
          </div>
        </div>

        {merch.paymentLink && (
          <a
            href={merch.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2.5 text-sm font-semibold"
          >
            Buy Now — ${merch.price}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
