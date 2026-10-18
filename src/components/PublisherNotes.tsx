import React from "react";
export interface PublisherPage {
  path: string;
  heading: string;
  summary: string;
  sections: { h: string; p?: string[]; list?: string[] }[];
  links: { href: string; label: string }[];
}

/** The same visible reference material is rendered at build time and in React. */
export function PublisherNotes({ page }: { page: PublisherPage }) {
  return (
    <article data-publisher-notes={page.path} aria-label="Learning and reference notes"
      style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 100px", color: "hsl(var(--foreground, 220 10% 80%))", lineHeight: 1.7, overflowWrap: "anywhere" }}>
      <h2 style={{ fontSize: "1.6rem", color: "hsl(var(--foreground, 220 10% 96%))" }}>Learning notes: {page.heading}</h2>
      <p>{page.summary}</p>
      <p style={{ fontSize: "0.875rem" }}>Published by TradeHQ, created by Anuga Weerasinghe. <a href="/about" style={{ textDecoration: "underline" }}>Publisher background and editorial approach</a>. No independent professional review is claimed; any recorded source-check scope appears on the page.</p>
      {page.sections.map((section, i) => (
        <section key={i}>
          <h3 style={{ fontSize: "1.2rem", margin: "28px 0 12px", color: "hsl(var(--foreground, 220 10% 96%))" }}>{section.h}</h3>
          {section.p?.filter(Boolean).map((p, j) => <p key={j}>{p}</p>)}
          {!!section.list?.length && <ul style={{ paddingLeft: 24 }}>{section.list.map((item, j) => <li key={j}>{item}</li>)}</ul>}
        </section>
      ))}
      {!!page.links.length && <nav aria-label="Learning notes references">
        <h3 style={{ fontSize: "1.2rem", marginTop: 28 }}>References and related pages</h3>
        <ul style={{ paddingLeft: 24 }}>{page.links.map((link, i) => <li key={i}>
          <a href={link.href} style={{ color: "inherit", textDecoration: "underline" }}>{link.label}</a>
        </li>)}</ul>
      </nav>}
      <p style={{ fontSize: "0.875rem", marginTop: 28 }}>Educational simulation only — not financial advice. Virtual money; no brokerage transactions. Quotes may be delayed, cached, unavailable or fixed simulator values; generated charts are labelled separately. Practice results do not predict investment outcomes.</p>
    </article>
  );
}
