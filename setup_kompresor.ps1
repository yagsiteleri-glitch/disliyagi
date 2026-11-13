$src = 'c:\Users\yastn\OneDrive\Masaüstü\essa-yag'
$dest = 'c:\Users\yastn\OneDrive\Masaüstü\kompresoryagi'
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
New-Item -ItemType Directory -Path $dest | Out-Null

$exclude = @('.git', 'node_modules', '.astro', 'dist', 'build_*.mjs', 'extract_*.mjs', 'categorize.mjs', 'find_domains.mjs', 'slice_domains.mjs')
Get-ChildItem -Path $src -Exclude $exclude | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
}

New-Item -ItemType Junction -Path "$dest\node_modules" -Target "$src\node_modules" | Out-Null
Write-Host "kompresoryagi cloned and junction created successfully"
