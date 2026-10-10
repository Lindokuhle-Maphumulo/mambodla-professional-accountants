# Mambodla — add PAIA Manual to site-wide footer and sitemap
# Run this from the WEBSITE ROOT after copying the Final Legal Pack files.
# Compatible with Windows PowerShell 5.1+.

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$excludePattern = '\\(dist|node_modules|brand-book-source)\\'
$htmlFiles = Get-ChildItem -Path $root -Recurse -Filter *.html -File |
  Where-Object { $_.FullName -notmatch $excludePattern }

$updated = 0

foreach ($file in $htmlFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)

  if ($content -notmatch 'class="footer-legal"') {
    continue
  }

  if ($content -match '>PAIA Manual<') {
    continue
  }

  $relativePath = $file.FullName.Substring($root.Length).TrimStart('\')
  $paiaHref = if ($relativePath -match '^insights\\') {
    "../paia.html"
  } else {
    "paia.html"
  }

  $footerRegex = [regex]::new('(?s)<div class="footer-legal">.*?</div>')
  $match = $footerRegex.Match($content)

  if (-not $match.Success) {
    continue
  }

  $block = $match.Value
  $termsRegex = [regex]::new(
    '(?s)(<a\s+href="(?:\.\./)?terms\.html"[^>]*>\s*Terms\s*&amp;\s*Conditions\s*</a>)'
  )

  if (-not $termsRegex.IsMatch($block)) {
    Write-Warning "Terms footer link not found in $relativePath"
    continue
  }

  $insert = '$1' + "`r`n          <a href=`"$paiaHref`">PAIA Manual</a>"
  $newBlock = $termsRegex.Replace($block, $insert, 1)
  $newContent =
    $content.Substring(0, $match.Index) +
    $newBlock +
    $content.Substring($match.Index + $match.Length)

  [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
  $updated++
  Write-Host "Updated footer: $relativePath"
}

$sitemap = Join-Path $root "sitemap.xml"

if (Test-Path $sitemap) {
  $xml = [System.IO.File]::ReadAllText($sitemap)

  $xml = [regex]::Replace(
    $xml,
    '(<loc>https://mambodla\.co\.za/privacy\.html</loc>\s*<lastmod>)[^<]+(</lastmod>)',
    '${1}2026-10-10${2}'
  )

  $xml = [regex]::Replace(
    $xml,
    '(<loc>https://mambodla\.co\.za/terms\.html</loc>\s*<lastmod>)[^<]+(</lastmod>)',
    '${1}2026-10-10${2}'
  )

  if ($xml -notmatch '<loc>https://mambodla\.co\.za/paia\.html</loc>') {
    $entry = @"
  <url>
    <loc>https://mambodla.co.za/paia.html</loc>
    <lastmod>2026-10-10</lastmod>
  </url>
"@
    $xml = $xml -replace '</urlset>', ($entry + '</urlset>')
  }

  [System.IO.File]::WriteAllText($sitemap, $xml, $utf8NoBom)
  Write-Host "Updated sitemap.xml"
}

Write-Host ""
Write-Host "Complete. Footer files updated: $updated"
Write-Host "Now run: npm.cmd run build"
