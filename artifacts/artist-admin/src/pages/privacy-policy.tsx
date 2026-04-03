import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy({ standalone }: { standalone?: boolean }) {
  const inner = (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Last updated: April 3, 2026
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Overview</h2>
        <p className="text-muted-foreground leading-relaxed">
          FreqDirectory ("we", "us", or "our") operates the Merc Majah artist directory platform.
          This Privacy Policy describes how we collect, use, and store information when you use our
          admin dashboard and associated services. By using FreqDirectory, you agree to the practices
          described in this policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Data We Collect</h2>
        <p className="text-muted-foreground leading-relaxed">
          We collect only the data you explicitly provide when creating or editing artist profiles. This includes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>Artist name, biography, and short bio</li>
          <li>Genre tags, origin, and formation year</li>
          <li>Member names and record label affiliations</li>
          <li>Discography entries and streaming service URLs</li>
          <li>Music video links and press quotes</li>
          <li>Artist profile image URLs</li>
          <li>LLM Context Layer instructions (admin-only metadata)</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We do not collect personal data about visitors, use tracking cookies, or run analytics on end users.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">How We Use Your Data</h2>
        <p className="text-muted-foreground leading-relaxed">
          Artist profile data is used exclusively for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>Displaying artist profiles within the admin dashboard</li>
          <li>Serving artist information through the MCP (Model Context Protocol) server to AI models</li>
          <li>Powering the directory search index</li>
          <li>Generating dashboard statistics (artist count, genre breakdowns, etc.)</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We do not sell, rent, or share your data with any third-party marketing or advertising services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Third-Party Services</h2>
        <p className="text-muted-foreground leading-relaxed">
          FreqDirectory relies on the following third-party infrastructure providers. Each has its own
          privacy policy and data handling practices:
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card/30 p-4">
            <p className="font-medium text-foreground">Neon (PostgreSQL)</p>
            <p className="text-sm text-muted-foreground mt-1">
              Artist profile data is stored in a PostgreSQL database hosted by Neon.
              Neon is SOC 2 Type 2 compliant. See{" "}
              <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                neon.tech/privacy-policy
              </a>.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/30 p-4">
            <p className="font-medium text-foreground">Vercel</p>
            <p className="text-sm text-muted-foreground mt-1">
              The application is deployed and served via Vercel's edge network.
              Vercel may log request metadata (IP address, user agent) for security and diagnostics.
              See{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                vercel.com/legal/privacy-policy
              </a>.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Data Retention</h2>
        <p className="text-muted-foreground leading-relaxed">
          Artist profiles are retained indefinitely until explicitly deleted through the admin dashboard.
          When a profile is deleted, all associated data is permanently removed from the database.
          We do not maintain backups beyond those provided by Neon's standard database infrastructure.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">LLM Context &amp; AI Usage</h2>
        <p className="text-muted-foreground leading-relaxed">
          Artist profiles — including the optional LLM Context Layer — are made available to AI language
          models via the MCP server. This is the core purpose of the platform. If an artist's profile
          contains sensitive instructions in the LLM Context Layer, those instructions are only surfaced
          to AI agents that connect to the MCP endpoint, not to the general public.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Contact</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you have questions about this Privacy Policy or how your data is handled, please reach out
          through the repository or deployment contact associated with this FreqDirectory installation.
        </p>
      </section>

      <p className="text-xs text-muted-foreground/60 border-t border-border pt-6">
        This policy applies to all data entered into FreqDirectory and the Merc Majah MCP platform.
        We reserve the right to update this policy; the "Last updated" date at the top reflects the
        most recent revision.
      </p>
    </div>
  );

  if (standalone) {
    return (
      <div className="min-h-screen w-full bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
        <div className="relative z-10 overflow-y-auto p-8 lg:p-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
          {inner}
        </div>
      </div>
    );
  }

  return inner;
}
