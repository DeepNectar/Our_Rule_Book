# Deep & Honey — Love Rulebook (split & debugged)

The original monolithic `Index.Html` (2,702 lines) has been split into a proper
project structure and debugged.

## Structure
```
index.html      – markup only (links css/style.css and js/app.js)
css/style.css   – all styles (extracted from the inline <style> block + bug fixes)
js/app.js       – all behavior (extracted from the inline <script> block + bug fixes)
Index.Html      – original file, kept for reference
```

## Bugs found & fixed
1. **Broken inline `<script>` (critical).** The generated-HTML-email template inside
   the inline script contained literal `</head>`, `<body>` and `</script>` sequences.
   The browser terminated the script at the first `</script>`, killing ALL JavaScript
   on the page and dumping ~150 lines of broken markup into the DOM. Moving the code
   to an external `js/app.js` removes this hazard (`</script>` in a string is safe there).
2. **Wrong complaint subject.** `generateHtmlEmail()` decided the partner with
   `document.querySelector('.complaint-btn-deep') ? true : false` — always true, so even
   complaints about Honey were titled "About Deep". The target partner is now passed in
   explicitly from `sendComplaint()` / `toggleEmailFormat()`.
3. **Missing CSS classes.** JS applies `floating-emoji-slow … -dance` and
   `floating-emoji-zigzag/smooth/bounce` speed & pattern classes that were never defined
   in the stylesheet — silent no-ops. They are now defined in `css/style.css`.
4. **Nectar swarm class clash.** `createNectarSwarm()` gave its bees the
   `.floating-emoji` class, inheriting the `floatEmoji` keyframes (which need
   `--startX/--moveX` vars the swarm never sets) and fighting the inline `swarmFloat`
   animation. A dedicated `.nectar-bee` class was added.
5. **Reduced-motion gap.** The accessibility rule didn't cover JS-created emojis;
   extended to hide/stop them (and the nectar bees).
6. **Print styles** could reveal the password overlay; forced hidden in print media.
7. **Session restore** left stale/auto-filled text in the password box; now cleared.
8. Minor HTML hygiene: added `lang="en"`, lowercase filename `index.html`,
   single root document (the original had stray nested document tags inside the script).

## Verify
Open `index.html` in a browser (or `python3 -m http.server`). Runtime smoke tests
(jsdom) confirm: unlock works, 300 floating emojis spawn, the relationship
rules render without the removed section, signatures appear only on the
"Sign:" lines, and HTML email subjects correctly show Deep or Honey.
