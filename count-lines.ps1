# Count lines of code in Vision Ideas Portal
$totalLines = 0
$fileCount = 0

Write-Host "=== Vision Ideas Portal - Lines of Code Analysis ===" -ForegroundColor Green
Write-Host ""

# Backend files
Write-Host "Backend Files:" -ForegroundColor Yellow
$backendFiles = @("server.js", "DocumentStore.js", "create-test-excel.js", "test.js")
$backendTotal = 0

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "  $file`: $lines lines"
        $backendTotal += $lines
        $totalLines += $lines
        $fileCount++
    }
}
Write-Host "  Backend Subtotal: $backendTotal lines" -ForegroundColor Cyan
Write-Host ""

# Frontend files
Write-Host "Frontend Files:" -ForegroundColor Yellow
$frontendTotal = 0

# Main app files
$mainFiles = @(
    "client\src\App.js",
    "client\src\index.js",
    "client\src\authConfig.js"
)

foreach ($file in $mainFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "  $file`: $lines lines"
        $frontendTotal += $lines
        $totalLines += $lines
        $fileCount++
    }
}

# Component files
Write-Host "  Components:" -ForegroundColor Magenta
$componentFiles = Get-ChildItem "client\src\components\*.js" -ErrorAction SilentlyContinue
foreach ($file in $componentFiles) {
    $lines = (Get-Content $file.FullName | Measure-Object -Line).Lines
    Write-Host "    $($file.Name)`: $lines lines"
    $frontendTotal += $lines
    $totalLines += $lines
    $fileCount++
}

# Context files
Write-Host "  Contexts:" -ForegroundColor Magenta
$contextFiles = Get-ChildItem "client\src\contexts\*.js" -ErrorAction SilentlyContinue
foreach ($file in $contextFiles) {
    $lines = (Get-Content $file.FullName | Measure-Object -Line).Lines
    Write-Host "    $($file.Name)`: $lines lines"
    $frontendTotal += $lines
    $totalLines += $lines
    $fileCount++
}

# Config files
Write-Host "  Config:" -ForegroundColor Magenta
$configFiles = Get-ChildItem "client\src\config\*.js" -ErrorAction SilentlyContinue
foreach ($file in $configFiles) {
    $lines = (Get-Content $file.FullName | Measure-Object -Line).Lines
    Write-Host "    $($file.Name)`: $lines lines"
    $frontendTotal += $lines
    $totalLines += $lines
    $fileCount++
}

Write-Host "  Frontend Subtotal: $frontendTotal lines" -ForegroundColor Cyan
Write-Host ""

# Template files
Write-Host "Template Files:" -ForegroundColor Yellow
$templateFiles = @("roadmap-template.html", "test-csv-import.html")
$templateTotal = 0

foreach ($file in $templateFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "  $file`: $lines lines"
        $templateTotal += $lines
        $totalLines += $lines
        $fileCount++
    }
}
Write-Host "  Template Subtotal: $templateTotal lines" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "Total Files: $fileCount"
Write-Host "Backend: $backendTotal lines"
Write-Host "Frontend: $frontendTotal lines" 
Write-Host "Templates: $templateTotal lines"
Write-Host ""
Write-Host "TOTAL LINES OF CODE: $totalLines" -ForegroundColor Red -BackgroundColor White
