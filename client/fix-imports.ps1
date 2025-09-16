# Fix import statements with version numbers in UI components

$uiPath = Join-Path $PSScriptRoot "src/components/ui"
if (-not (Test-Path $uiPath)) {
    Write-Error "UI components path not found: $uiPath"
    exit 1
}

$files = Get-ChildItem -Path $uiPath -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remove version numbers from imports
    $content = $content -replace '@[0-9]+\.[0-9]+\.[0-9]+', ''
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed imports in: $($file.Name)"
}

Write-Host "All import statements have been fixed!"