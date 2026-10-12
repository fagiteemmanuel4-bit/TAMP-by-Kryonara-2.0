# Admin dashboard research (TAMP by Kryonara)

Research done on 8 October 2026 before building. Findings are paraphrased and mapped to decisions in this project.

## What the research says
1. **Design around user goals, not every metric.** Showing everything at once is a common mistake; different users need different views. Role-based views with the right level of detail are recommended. → Our roles (super, reviewer, finance, support, content) each see only their sections, and the Overview shows a "Needs attention" list instead of every number.
2. **Navigation must be predictable.** Messy or inconsistent navigation slows people down. Use global navigation for site-wide actions (profile, alerts) and a sidebar for dashboard areas, like chapters in a book. → Grouped sidebar (People, Learning, Money, Communication, System), global top bar with sign out and quick jump (Ctrl+K), highlighted current page.
3. **Place actions close to the data they affect,** and keep layout, spacing, colours, icons and button positions consistent. → Every list uses the same table, toolbar and action buttons.
4. **Usability heuristics apply to dashboards:** keep users informed of system status (highlight the current page, give feedback), prevent errors instead of only reporting them, offer shortcuts for experts, keep design minimal, and document the dashboard for handover. → Toasts after every action, confirmation before deleting, Ctrl+K jump, plain-language section descriptions, and the handoff document.
5. **Admin dashboards are used dozens of times a day,** so speed and clarity matter more than a polished first impression. → Search, filter, sort, pagination and CSV export on every table; fast review actions (Approve, Return) in one click.
6. **Be responsive and touch friendly,** and use fixed or sticky navigation for easy access. → Sticky top bar, slide-in sidebar on phones, horizontally scrolling tables.
7. **Security logging (OWASP):** log administrative functions and changes to security settings, failed authentication attempts, access-control violations and input validation failures; do not log passwords or session identifiers; protect log integrity. → Immutable-style audit log written for every admin action, including failed sign-ins; the handoff lists integrity and exclusion rules.

## References
- Mockplus, "Dashboard design best practices and examples": https://mockplus.com/blog/post/dashboard-design-best-practices-examples
- Raw Studio, "Dashboard Design Disasters: 6 UX Mistakes You Can't Afford to Make": https://raw.studio/blog/dashboard-design-disasters-6-ux-mistakes-you-cant-afford-to-make/
- "10 UX Heuristics in Dashboard Design" (applies Jakob Nielsen's heuristics): https://nastengraph.substack.com/p/10-ux-heuristics-in-dashboard-design
- Eleken, "Admin Dashboard UI: Best Examples, Design Principles" (2026): https://www.eleken.co/blog-posts/admin-dashboard-ui
- Orbix Studio, "Dashboard Design Best Practices": https://www.orbix.studio/blogs/dashboard-design-best-practices
- AND Academy, "Dashboard UI design guide": https://www.andacademy.com/resources/?p=17870
- OWASP Logging Cheat Sheet: https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Logging_Cheat_Sheet.md
- OWASP Developer Guide, security logging checklist: https://github.com/OWASP/DevGuide/pull/133/files
