# 打包 Tapp 为 .tapp（zip 格式）
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root 'dist\ink.kei.arknights.tapp'

$files = @(
  'manifest.json', 'core.js', 'styles.css', 'page.html',
  'page/index.js', 'page/crypto.js', 'page/skland.js', 'page/assets.js', 'page/home.js', 'page/collection.js', 'page/debug.js',
  'i18n/en-US.json', 'i18n/zh-CN.json',
  'assets/rank/elite0.png', 'assets/rank/elite1.png', 'assets/rank/elite2.png',
  'assets/profession/pioneer.png', 'assets/profession/warrior.png', 'assets/profession/tank.png', 'assets/profession/sniper.png',
  'assets/profession/caster.png', 'assets/profession/medic.png', 'assets/profession/support.png', 'assets/profession/special.png',
  'assets/potential/potential_0.png', 'assets/potential/potential_1.png', 'assets/potential/potential_2.png',
  'assets/potential/potential_3.png', 'assets/potential/potential_4.png', 'assets/potential/potential_5.png',
  'assets/star/star_0.png', 'assets/star/star_1.png', 'assets/star/star_2.png',
  'assets/star/star_3.png', 'assets/star/star_4.png', 'assets/star/star_5.png',
  'assets/star/charBg_2-0.png', 'assets/star/charBg_r3.png', 'assets/star/charBg_r4.png', 'assets/star/charBg_r5.png'
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path (Split-Path $out))) {
  New-Item -ItemType Directory -Path (Split-Path $out) | Out-Null
}

Remove-Item $out -Force -ErrorAction SilentlyContinue

$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
try {
  foreach ($f in $files) {
    $src = Join-Path $root ($f -replace '/', '\')
    if (-not (Test-Path -LiteralPath $src)) {
      Write-Host "MISSING: $f" -ForegroundColor Yellow
      continue
    }
    $entryName = $f -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $src, $entryName) | Out-Null
  }
} finally {
  $zip.Dispose()
}

Write-Host ("packed: {0} bytes ({1} KB), {2} files -> {3}" -f (Get-Item $out).Length, [math]::Round((Get-Item $out).Length / 1KB, 1), $files.Count, $out) -ForegroundColor Green
