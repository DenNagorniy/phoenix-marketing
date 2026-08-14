param(
  [string]$StylesPath = "wow-system.css"
)

$forbidden = @(
  '\.hero\b', '\.section\b', '\.hero-copy\b', '\.hero-visual\b',
  '\.button\b', '\.modal\b', 'grid-template-columns', 'background-size',
  '(?m)(?:^|[;{])\s*width\s*:', '(?m)(?:^|[;{])\s*height\s*:',
  '(?m)(?:^|[;{])\s*top\s*:', '(?m)(?:^|[;{])\s*left\s*:'
)

if (-not (Test-Path -LiteralPath $StylesPath)) {
  throw "Missing wow stylesheet: $StylesPath"
}

$content = Get-Content -Raw -LiteralPath $StylesPath
# Ignore explanatory comments; only declarations/selectors are subject to the boundary check.
$content = [regex]::Replace($content, '(?s)/\*.*?\*/', '')
$matches = foreach ($pattern in $forbidden) {
  Select-String -InputObject $content -Pattern $pattern -AllMatches | ForEach-Object { $_.Matches.Value }
}

if ($matches) {
  throw "Forbidden base-layout selector/property found in $StylesPath`: $($matches -join ', ')"
}

Write-Output "WOW CSS boundary check passed: $StylesPath"
