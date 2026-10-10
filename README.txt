MAMBODLA PROFESSIONAL ACCOUNTANTS
FINAL LEGAL & COMPLIANCE WEBSITE PACK
10 October 2026

FILES
-----
privacy.html
terms.html
paia.html
css/legal.css
assets/documents/Mambodla_PAIA_Manual_2026-09-30.pdf
apply-paia-footer.ps1

WHAT THIS PACK DOES
-------------------
1. Replaces the old website Privacy Policy wording with the approved 16-section policy.
2. Replaces the old Terms & Conditions wording with the approved 17-section terms.
3. Adds a full PAIA web page based on the approved PAIA Manual.
4. Adds the approved PAIA Manual PDF as a downloadable website document.
5. Refines the shared legal-page layout for 1920 / 2200 / 2560 screens.
6. Keeps the ordinary Contact page unchanged: it should continue to show Elspark, Germiston only.
7. Uses the full address only in the formal legal/compliance pages:
   09 Quail Street, Elspark, Germiston, Gauteng, 1418, South Africa.
8. Uses +27 71 534 8873 on the formal legal/compliance pages.
9. Does NOT publish or link the Information Officer registration certificate.

INSTALL
-------
A. Back up your website folder / commit your current state first.

B. Copy these files into the matching locations in the website source:
   privacy.html
   terms.html
   paia.html
   css/legal.css
   assets/documents/Mambodla_PAIA_Manual_2026-09-30.pdf

C. From the website root, run:
   powershell -ExecutionPolicy Bypass -File ".\apply-paia-footer.ps1"

   This adds "PAIA Manual" to existing footer legal links throughout the source
   HTML and adds paia.html to sitemap.xml. It skips dist, node_modules and
   brand-book-source.

D. Build:
   npm.cmd run build

E. Review:
   privacy.html
   terms.html
   paia.html

   At:
   1920 x 1080
   2200 x 1200
   2560 x 1440

IMPORTANT
---------
Do not overwrite css/style.css with anything from this pack. The locked Home,
About, Services, Insights, article, calculator and Contact responsive work stays
where it is. This pack only replaces css/legal.css and the legal/compliance pages.

PRE-LAUNCH DATE RULE
--------------------
Privacy and Terms display:
Approved 5 October 2026

At production publication, replace that first metadata item with the actual
effective/publication date if desired. The PAIA Manual remains:
Compiled 30 September 2026 · Version 1.0 · PAIA
