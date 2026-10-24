import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { FileText, AlertTriangle, Scale, Shield, Ban, RefreshCw } from "lucide-react";
import { SEOSection } from "@/components/SEOSection";

export default function Terms() {
  const sections = [
    {
      icon: Shield,
      title: "1. Acceptance of Terms",
      content: `By accessing and using TradeHQ ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.

TradeHQ is a trading simulation platform for educational purposes only. No real money is involved, and no actual financial transactions occur.`
    },
    {
      icon: AlertTriangle,
      title: "2. Important Disclaimers",
      content: `SIMULATION ONLY: TradeHQ is a market simulation platform. All trades are executed with virtual currency only. No real money is at risk, and no actual securities transactions occur.

NOT FINANCIAL ADVICE: Nothing on TradeHQ constitutes financial, investment, legal, or tax advice. We do not recommend any particular investment strategy or security.

NO GUARANTEES: Past performance in our simulation does not guarantee future real-world results. Market simulations may not accurately reflect actual market conditions.

EDUCATIONAL PURPOSE: TradeHQ is designed solely for educational and entertainment purposes. Users should consult qualified financial advisors before making real investment decisions.`
    },
    {
      icon: Scale,
      title: "3. User Responsibilities",
      content: `When using TradeHQ, you agree to:

• Use the Service only for lawful purposes
• Not attempt to manipulate or disrupt the simulation
• Not use automated systems or bots without authorization
• Not reverse engineer or copy the Service
• Not impersonate others or misrepresent your identity
• Accept that virtual funds have no real monetary value

You acknowledge that:
• Simulated trading results are hypothetical
• Real trading involves substantial risk of loss
• You are responsible for your own investment decisions`
    },
    {
      icon: Ban,
      title: "4. Prohibited Activities",
      content: `Users are prohibited from:

• Attempting to exploit bugs or vulnerabilities
• Using the Service for any illegal purpose
• Distributing malware or harmful code
• Scraping data without permission
• Creating multiple accounts to circumvent limits
• Commercial use without written authorization
• Misrepresenting TradeHQ or its simulation as real trading`
    },
    {
      icon: RefreshCw,
      title: "5. Service Modifications",
      content: `TradeHQ reserves the right to:

• Modify or discontinue the Service at any time
• Change these Terms with reasonable notice
• Reset virtual portfolios and trading data
• Update simulation parameters and asset availability
• Limit access to certain features or regions

We will make reasonable efforts to notify users of significant changes through the platform.`
    },
    {
      icon: FileText,
      title: "6. Intellectual Property",
      content: `TradeHQ claims rights in its original educational writing, branding, interface contributions and simulation code to the extent those rights belong to its publisher.

Third-party libraries, data, images, music, quotations and user submissions retain their respective owners’ rights and applicable licenses. Inclusion on this site does not transfer their ownership to TradeHQ.

Reuse must respect the applicable rights and license terms. This statement does not override permissions granted by an open-source or other third-party license.`
    }
  ];

  return (
    <>
      <Helmet>
        <title>Terms of Service | TradeHQ Educational Simulator</title>
        <meta name="description" content="Read the Terms of Service for TradeHQ — an educational paper trading simulator. No brokerage, no financial advice, no real money at risk." />
        <link rel="canonical" href="https://www.thetradehq.com/terms" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Terms of Service | TradeHQ Educational Simulator" />
        <meta property="og:description" content="Educational-use terms for TradeHQ — no brokerage, no financial advice, no real money at risk." />
        <meta property="og:url" content="https://www.thetradehq.com/terms" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-28 max-w-4xl pb-24 md:pb-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using TradeHQ. By using our service, you agree to these terms.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Effective Date: January 26, 2026
            </p>
          </div>

          {/* Critical Disclaimer */}
          <div className="glass-liquid-card p-6 mb-12 border-l-4 border-l-yellow-500">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Critical Notice
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">TradeHQ is a SIMULATION platform.</strong> No real money is involved. 
              All "trades" are executed with virtual currency that has no real-world value. This platform is for 
              educational and entertainment purposes only. Nothing on TradeHQ constitutes financial advice. 
              Always consult a licensed financial advisor before making real investment decisions.
            </p>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={index} className="glass-liquid-card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  {section.title}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Limitation of Liability */}
          <section className="mt-8 glass-liquid-card p-6">
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADEHQ AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
              LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              TradeHQ provides no warranty that the Service will be uninterrupted, secure, or error-free. 
              The Service is provided "AS IS" without warranties of any kind.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mt-8 glass-liquid-card p-6">
            <h2 className="text-xl font-semibold mb-4">8. Governing Law</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard 
              to conflict of law principles. Any disputes arising from these Terms shall be resolved through 
              binding arbitration or in courts of competent jurisdiction.
            </p>
          </section>

          {/* Contact */}
          <section className="mt-8 glass-liquid-card p-6">
            <h2 className="text-xl font-semibold mb-4">9. Contact Information</h2>
            <p className="text-sm text-muted-foreground mb-4">
              For questions about these Terms of Service:
            </p>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-sm">
                <strong>Contact:</strong> <Link to="/contact" className="underline underline-offset-4">TradeHQ contact page</Link>
              </p>
            </div>
          </section>

          <SEOSection
            path="/terms"
            faqHeading="Terms"
            breadcrumbs={[{ label: "Terms of Service" }]}
            faqs={[
              {
                question: "Is TradeHQ real trading or a simulator?",
                answer:
                  "TradeHQ is a 100% simulator. Every trade uses virtual currency only — no real money is ever at risk and no actual securities transactions occur. (Educational simulation only — not financial advice.)",
              },
              {
                question: "Does TradeHQ provide financial advice?",
                answer:
                  "No. Nothing on TradeHQ — including educational mentor responses, market analysis or sector commentary — constitutes financial, investment, legal or tax advice. Always consult a qualified advisor for real-money decisions.",
              },
              {
                question: "Can I use TradeHQ commercially?",
                answer:
                  "No, not without prior written permission. The service is licensed for personal, educational use only. Scraping, reverse engineering and bot use are prohibited.",
              },
              {
                question: "Who is TradeHQ for?",
                answer:
                  "Beginners and students who want to learn how markets work without risking real capital. Especially designed with Sri Lankan students and South Asian beginner traders in mind.",
              },
            ]}
          />
        </main>

        <MegaFooter />
      </div>
    </>
  );
}
