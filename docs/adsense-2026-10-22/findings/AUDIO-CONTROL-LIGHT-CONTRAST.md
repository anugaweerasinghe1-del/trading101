# Inactive audio control contrast

THQ078: actual full-scroll light-theme views of three public profiles show the shared music icon almost invisible against the black footer. A separate mobile/desktop, top/footer, light/dark probe confirms the inactive light icon is rgba(15,15,15,0.7), over rgba(0,0,0,0.4) and footer rgb(4,4,4). sRGB alpha composition yields about1.05:1 icon contrast; actual captures independently show the visibility failure. The initial first-visit probe includes an analytics panel; it is retained separately. The second probe uses the isolated browser's reject choice and exposes the control unobstructed.

Minimal PR266 proposal: light-only opaque white background, neutral800 icon, neutral500 border and corresponding hover colours. Dark and active-playing variants, handlers, track, timers, storage and playback remain unchanged. No playback action used. Ordinary revert restores prior styling. Full build, before/after contrast and personally viewed mobile/desktop/theme/hover captures plus normal serial release gates required. General accessibility issue; no specific AdSense violation or rejection cause established.

The second reproduction ran while PR265 deployed: source audio component unchanged betweenad86 and550; this is reproduction evidence, not an exact deployment attestation.
