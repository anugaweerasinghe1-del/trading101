import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { SEOSection } from "@/components/SEOSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";

const DOMAIN = "https://www.thetradehq.com";
const OWNER_EMAIL = "anugaweerasinghe1@gmail.com";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .max(100, "Name must be under 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be under 255 characters"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject must be under 150 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
});

export default function Contact() {
  const [loadedAt] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Honeypot + timing spam protection
    if (form.website.trim() !== "") return;
    if (Date.now() - loadedAt < 2500) {
      toast.error("Please take a moment to review your message before sending.");
      return;
    }

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { name, email, subject, message } = parsed.data;
    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
      `[TradeHQ] ${subject}`
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("Opening your email client — send from there to reach us.");
    setSubmitting(false);
  };

  const setField = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <Helmet>
        <title>Contact TradeHQ | Get in Touch</title>
        <meta
          name="description"
          content="Contact TradeHQ for questions, feedback or partnership inquiries. Reach the team by email, phone, or the contact form."
        />
        <link rel="canonical" href={`${DOMAIN}/contact`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact TradeHQ | Get in Touch" />
        <meta
          property="og:description"
          content="Get in touch with TradeHQ by email, phone, or a simple contact form."
        />
        <meta property="og:url" content={`${DOMAIN}/contact`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="container mx-auto px-4 py-12 max-w-4xl pb-24 md:pb-12">
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <MessageSquare className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Contact TradeHQ</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Questions, feedback or partnership inquiries? Reach out and we will respond as soon as we can.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 mb-10">
            <a
              href={`mailto:${OWNER_EMAIL}`}
              className="glass-liquid-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
                <div className="text-sm font-medium text-foreground break-all">{OWNER_EMAIL}</div>
              </div>
            </a>
            <a
              href="tel:+94714897346"
              className="glass-liquid-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Phone</div>
                <div className="text-sm font-medium text-foreground">+94 71 489 7346</div>
              </div>
            </a>
          </div>

          <section className="glass-liquid-card p-6 mb-8" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="text-xl font-semibold mb-2">Send a message</h2>
            <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Response times vary depending on the request.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={setField("website")}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={setField("name")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={setField("email")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  required
                  maxLength={150}
                  value={form.subject}
                  onChange={setField("subject")}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "subject-error" : undefined}
                />
                {errors.subject && (
                  <p id="subject-error" className="text-xs text-destructive mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  maxLength={2000}
                  value={form.message}
                  onChange={setField("message")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="text-xs text-destructive mt-1">{errors.message}</p>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "Opening…" : "Send message"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Submitting opens your email client with the message pre-filled — nothing is sent from your browser.
              </p>
            </form>
          </section>

          <EducationalDisclaimer variant="inline" className="my-0" />

          <section className="glass-liquid-card p-6 mt-8" aria-labelledby="contact-expectations">
            <h2 id="contact-expectations" className="text-xl font-semibold mb-3">What to expect when you write to us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TradeHQ is a small independent project rather than a company with a support desk, so
              messages are read and answered by the person who builds the site. In practice that means
              response times vary with request volume and can take longer over a
              weekend or a public holiday. Nothing is auto-responded to, and no message is passed to a
              third party — the contact form simply opens your own email client with the text
              pre-filled, so your address is never stored on this site.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Bug reports are the most useful thing you can send. If something behaved unexpectedly,
              include the page address you were on, the browser and device you were using, what you
              expected to happen and what actually happened. A screenshot removes most of the
              guesswork. For a problem with a simulated trade, mention the ticker and roughly when it
              happened. Guest positions are browser-held; signed-in cash and open positions may also
              be stored by account sync when that service is available. Do not send passwords or private financial records.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Feature suggestions are welcome and genuinely do shape the public roadmap — several of
              the items already shipped started as a message from a reader. If you are writing about a
              partnership, an educational collaboration or use of the material in a classroom, say so
              in the subject line and include enough detail that the first reply can be a useful one
              rather than a request for more information.
            </p>
          </section>

          <section className="glass-liquid-card p-6 mt-6" aria-labelledby="contact-cannot-help">
            <h2 id="contact-cannot-help" className="text-xl font-semibold mb-3">What we cannot help with</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We cannot tell you what to buy or sell, review your real portfolio, or comment on whether
              a particular asset is a good investment. TradeHQ is an educational simulator and is not a
              broker, an adviser or a research house, so any such answer would be both unhelpful and
              inappropriate. Questions about tax, residency rules or the legality of a real brokerage
              account in your country need a licensed professional where you live — the country guides
              point to the relevant regulator, but they are context, not advice.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Guest practice records are stored in the browser that created them. Optional account sync
              stores account cash, positions and server-recorded trades for restoration on another device when the service is
              available. Earlier guest trade history, journal entries, individual course
              badges and lesson progress remain browser-held. Clearing site data removes local records; a synced account copy
              may still exist. Account sync is not a complete backup of your learning record.
            </p>
          </section>

          <section className="mt-6" aria-labelledby="contact-quick-links">
            <h2 id="contact-quick-links" className="text-xl font-semibold mb-3">Answers you might not need to write in for</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
              <li><a className="hover:text-foreground underline-offset-4 hover:underline" href="/about">About TradeHQ</a> — who builds it, what it is and what it deliberately is not.</li>
              <li><a className="hover:text-foreground underline-offset-4 hover:underline" href="/courses">Courses</a> — structured tracks, with quizzes and completion badges.</li>
              <li><a className="hover:text-foreground underline-offset-4 hover:underline" href="/wiki">Trading glossary</a> — plain-language definitions of the terms used across the site.</li>
              <li><a className="hover:text-foreground underline-offset-4 hover:underline" href="/roadmap">Roadmap</a> — what has shipped and what is planned next.</li>
              <li><a className="hover:text-foreground underline-offset-4 hover:underline" href="/privacy">Privacy</a> and <a className="hover:text-foreground underline-offset-4 hover:underline" href="/terms">Terms</a> — what is stored, and the rules for using the simulator.</li>
            </ul>
          </section>

          <SEOSection
            path="/contact"
            faqHeading="Contact"
            breadcrumbs={[{ label: "Contact" }]}
            faqs={[
              {
                question: "How quickly does TradeHQ respond?",
                answer:
                  "Response times vary depending on the request and may be longer on weekends or holidays.",
              },
              {
                question: "Does TradeHQ offer investment advice by email?",
                answer:
                  "No. TradeHQ is an educational simulator and does not provide financial, investment, legal or tax advice via email, phone or the platform itself.",
              },
              {
                question: "Can I request a feature or report a bug?",
                answer:
                  "Yes — please use the contact form or email us directly. Feature ideas are reviewed for the public roadmap.",
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
