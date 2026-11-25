param([string]$RepositoryPath = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath $RepositoryPath).Path.TrimEnd('\')
$packagePath = Join-Path $repoRoot 'package.json'
if (-not (Test-Path -LiteralPath $packagePath)) { throw 'Choose the SellPostly repository root.' }
$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
if ($package.name -ne 'sellpostly') { throw 'This cleanup only runs inside the SellPostly repository.' }
function Get-CheckedTarget([string]$RelativePath) {
  $target = [IO.Path]::GetFullPath((Join-Path $repoRoot $RelativePath))
  if (-not $target.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Cleanup target is outside the repository.' }
  $ancestor = Split-Path -Parent $target
  while ($ancestor -and $ancestor -ne $repoRoot) {
    if ((Test-Path -LiteralPath $ancestor) -and (Get-Item -LiteralPath $ancestor -Force).LinkType) { throw 'A cleanup path crosses a symbolic link. Review it manually.' }
    $ancestor = Split-Path -Parent $ancestor
  }
  return $target
}
$removed = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'REMOVED-FILES.json') -Raw | ConvertFrom-Json
foreach ($relative in $removed) {
  $target = Get-CheckedTarget $relative
  if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force }
}
foreach ($relative in @('src/app/shop/look','src/app/s/[slug]/look','src/app/s/[slug]/[storeType]/look','public/lookbook','.next')) {
  $target = Get-CheckedTarget $relative
  if (Test-Path -LiteralPath $target) {
    if ((Get-Item -LiteralPath $target -Force).LinkType) { throw 'A cleanup directory is a symbolic link. Review it manually.' }
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}
Write-Host 'SellPostly cleanup complete. Run npm test and npm run build.'
