import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Shield, Lock, Eye, Database, Globe, Mail } from "lucide-react";
import { PRIVACY_SECTIONS, PRIVACY_REFERENCES } from "@/lib/privacyCopy";
import { SEOSection } from "@/components/SEOSection";
import { AdvertisingPrivacyChoices } from "@/components/AdvertisingPrivacyChoices";

const privacyIcons = { Database, Lock, Eye, Shield, Globe };

export default function Privacy() {
  const sections = PRIVACY_SECTIONS.map(section => ({ ...section, icon: privacyIcons[section.icon] }));


  return (
    <>
      <Helmet>
        <title>Privacy Policy | TradeHQ</title>
        <meta name="description" content="TradeHQ privacy policy covering browser-stored simulator data, optional accounts, analytics, advertising cookies, service providers and user choices." />
        <link rel="canonical" href="https://www.thetradehq.com/privacy" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="container mx-auto px-4 py-12 max-w-4xl pb-24 md:pb-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This policy describes the data flows used by the current TradeHQ website, including optional analytics and advertising.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last Updated: October 18, 2026
            </p>
          </div>

          <div className="glass-liquid-card p-6 mb-12">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Privacy at a Glance
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-profit">✓</span><span>Core simulator features can be used without creating an account.</span></li>
              <li className="flex items-start gap-2"><span className="text-profit">✓</span><span>Guest portfolios stay in your browser; account cash, positions and server-recorded trades restore from Supabase.</span></li>
              <li className="flex items-start gap-2"><span className="text-profit">✓</span><span>Optional accounts and community features can store data with Supabase.</span></li>
              <li className="flex items-start gap-2"><span className="text-profit">✓</span><span>Amplitude analytics/session replay and Google advertising are optional, consent-dependent services.</span></li>
              <li className="flex items-start gap-2"><span className="text-profit">✓</span><span>No real-money deposit or brokerage account is required for simulated trading.</span></li>
            </ul>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={index} className="glass-liquid-card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  {section.title}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8 glass-liquid-card p-6" aria-label="Advertising information and opt-outs">
            <h2 className="text-xl font-semibold mb-3">Google advertising information and opt-outs</h2>
            <ul className="list-disc pl-5 space-y-2">{PRIVACY_REFERENCES.map(link => <li key={link.href}><a className="text-primary underline" href={link.href}>{link.label}</a></li>)}</ul>
          </section>

          <section className="mt-12 glass-liquid-card p-6">
            <AdvertisingPrivacyChoices className="mb-5 mr-3 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted" />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("tradehq:open-consent"))}
              className="mb-5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Change analytics choices
            </button>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              Contact Us
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              For privacy questions or rights requests, use the contact page and identify the message as privacy-related.
            </p>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-sm">
                <a href="/contact" className="text-primary hover:underline">Contact TradeHQ</a>
              </p>
            </div>
          </section>

          <SEOSection
            path="/privacy"
            faqHeading="Privacy"
            breadcrumbs={[{ label: "Privacy Policy" }]}
            faqs={[
              {
                question: "Do I need an account to use TradeHQ?",
                answer: "No. Core simulator features work in guest mode. Optional account and community features can store profile information and selected practice statistics.",
              },
              {
                question: "Where is my simulated portfolio stored?",
                answer: "Guest portfolios are stored in your browser. Account cash, positions and server-recorded trades are stored with Supabase and restore across devices when available. Earlier guest history, journals and course progress remain browser-held.",
              },
              {
                question: "Does TradeHQ use analytics or advertising cookies?",
                answer: "Amplitude analytics/session replay can use cookies or similar identifiers after analytics consent. Google provides separate regional advertising privacy messages and controls. You can change analytics choices here and use Advertising privacy choices when Google's European message applies, or its Do Not Sell or Share link in supported US states.",
              },
            ]}
          />
        </main>

        <MegaFooter />
        <MobileBottomNav />
      </div>
    </>
  );
}
