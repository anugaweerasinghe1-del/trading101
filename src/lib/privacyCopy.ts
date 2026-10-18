export const PRIVACY_SECTIONS = [
    {
      icon: "Database",
      title: "Information TradeHQ Handles",
      content: `TradeHQ can be used without creating an account. The data handled depends on the features you choose.

• Guest simulator data: practice cash, positions and trade history are stored in your browser. Watchlists, journal entries, course progress, streaks and related settings also remain browser-stored.
• Signed-in portfolio data: Supabase stores account cash, positions and server-recorded practice orders, including asset, quantity, execution price, fees, time and simulated result. These account records restore across devices when the service is available. A first-time browser import stores cash and positions as an unranked portfolio; earlier guest trade history stays in its original browser. Starting a fresh ranked practice cycle archives the previous account snapshot privately. Journals and course progress remain browser-held.
• Optional account data: if you create an account, Supabase processes authentication data such as your email or provider identity and can store profile fields including username, country and bio.
• Community data: signed-in features can store selected practice statistics, public-profile settings, reviews and duel/challenge records. These are simulated results, not brokerage statements or verified real-money performance.
• Review interactions: likes are stored with your account ID and the review ID to enforce one like per account. Public pages show totals, not individual liker identities. Owner replies are public. Reviews removed from public view remain in the private admin panel for restoration.
• Contact messages: the contact page opens your own email client with a pre-filled message. TradeHQ does not send that form directly from the browser.
• Technical data: hosting, authentication, security and abuse-prevention services can receive normal request information such as IP address, browser/device information and server logs.
• Optional analytics and advertising data: after the applicable consent choice, Amplitude may receive analytics/session-replay data and Google AdSense may use cookies or similar identifiers for ad delivery, measurement and, where permitted by the user's choices and region, personalization.

TradeHQ does not require a payment card, bank account or brokerage account to place simulated trades.`
    },
    {
      icon: "Lock",
      title: "How Information Is Used",
      content: `TradeHQ uses data only for the feature that needs it: operating the simulator, authenticating optional accounts, showing profile/community features, preventing abuse, responding to messages, diagnosing problems and improving the service.

Amplitude is used for product analytics and may include session replay when analytics consent is granted. This can record interactions such as navigation and clicks subject to the provider's masking and privacy controls.

Google AdSense provides advertising and regional advertising privacy choices. Ad delivery depends on Google's site approval and settings. If advertising is enabled, Google and its partners may place or read cookies and use similar technologies, web beacons, IP addresses and other identifiers to deliver and measure ads. Third parties may collect information as a result of ad serving. Advertising cookies can reflect prior visits to TradeHQ or other sites and, where consent and law permit, support personalised ads. These uses remain subject to the applicable privacy choices. Advertising may be personalized, non-personalized or limited depending on consent, location and Google settings.

TradeHQ does not sell simulated portfolio data to brokers or financial institutions and does not execute real-money trades.`
    },
    {
      icon: "Eye",
      title: "Storage, Visibility & Retention",
      content: `Browser data remains on the device until the browser, the user or TradeHQ's own reset controls remove it. Clearing browser data removes local records; it does not delete a signed-in portfolio already stored in Supabase.

Optional account and community data can be stored by Supabase for as long as the related account or feature requires it. New accounts start with a public profile: the chosen username, profile fields and selected simulated statistics can be visible on public pages. You can make your profile private at any time from your profile page.

Analytics and advertising data are retained according to the settings and policies of the relevant provider. TradeHQ does not state a fixed retention period where it cannot verify one.

TradeHQ uses hosted infrastructure and access controls intended to protect stored data, but no online service can guarantee absolute security.`
    },
    {
      icon: "Shield",
      title: "Age and Optional Features",
      content: `The core simulator works without an account. The optional account flow does not ask for age, so TradeHQ does not determine a visitor's age from that form.

Public profiles and community features can publish the information and simulated statistics you choose to share. Avoid including private or sensitive information in public fields. A parent or guardian can use the contact page to raise a privacy concern involving a young user.

An advertising consent choice alone does not determine age or replace age-specific advertising protections where they apply.`
    },
    {
      icon: "Globe",
      title: "Service Providers, Cookies & Your Choices",
      content: `TradeHQ relies on third parties including Cloudflare Pages and Vercel for hosting, Supabase for optional authentication/database features, Amplitude for consented analytics/session replay, and Google AdSense for consented advertising. These providers can process data in countries other than your own under their own legal and contractual arrangements.

Optional Amplitude analytics scripts are blocked until you accept analytics. You can reject analytics and change that choice later from this privacy page. Analytics acceptance does not grant advertising consent.

TradeHQ is configured to use Google's consent-management platform for regional advertising choices in the EEA, United Kingdom and Switzerland. Availability of the published message depends on Google's configuration and the visitor's region; an unavailable message does not constitute consent. The Google message lets you consent, decline or manage individual options. When it applies, use Advertising privacy choices on this page or in the footer to change or withdraw your decision.

In supported US states, Google's Do Not Sell or Share My Personal Information link lets you opt out of the sale or sharing of personal information for advertising. Google applies restricted data processing to applicable opt-out requests. These regional messages manage Google's advertising partners; optional Amplitude analytics are controlled separately.

You can also clear browser storage/cookies, use browser privacy controls and manage ad personalization through Google Ads Settings. When the Google message is available, its partner list describes the vendors and purposes covered by your advertising choices.

Depending on where you live, privacy law may give you rights to access, correct, delete, restrict or object to certain processing. Use the TradeHQ contact page for a privacy request. The exact rights available depend on your jurisdiction.`
    }
  ];

export const PRIVACY_REFERENCES = [
  { href: "https://policies.google.com/technologies/partner-sites", label: "How Google uses information from sites and apps that use its services" },
  { href: "https://myadcenter.google.com/", label: "Google advertising personalisation controls" },
  { href: "https://optout.aboutads.info/", label: "Participating third-party advertising opt-outs" },
];
