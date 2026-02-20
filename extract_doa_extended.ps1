$content = Get-Content 'c:\Users\atkac\OneDrive\.Codding\DOA\DOA Server version\doa-reader-v4_0.1w.html' -Raw
$match = [regex]::Match($content, '<script[^>]*id="browse-doa-data"[^>]*>\s*(\[[\s\S]*?\])\s*</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($match.Success) {
    $jsonStr = $match.Groups[1].Value
    $data = $jsonStr | ConvertFrom-Json
    
    $totalItems = @($data).Count
    $topLevelCodes = @{}
    $allCodes = @()
    
    foreach ($item in $data) {
        $allCodes += $item.code
        $topCode = $item.code.Split('.')[0]
        if (-not $topLevelCodes.ContainsKey($topCode)) {
            $topLevelCodes[$topCode] = 0
        }
        $topLevelCodes[$topCode]++
    }
    
    Write-Host "=== DOA DATA ANALYSIS ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "TOTAL ITEMS: $totalItems" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "TOP-LEVEL CATEGORIES (14 total):"
    $codesList = @()
    $topLevelCodes.Keys | Sort-Object {[int]$_} | ForEach-Object { $codesList += $_ }
    Write-Host "  Codes: $($codesList -join ', ')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ITEMS PER CATEGORY:"
    $topLevelCodes.GetEnumerator() | Sort-Object { [int]$_.Key } | ForEach-Object { 
        Write-Host "  Category $($_.Key.PadLeft(2)): $($_.Value.ToString().PadLeft(3)) items"
    }
    Write-Host ""
    Write-Host "SAMPLE OF 20 CODES SPREAD ACROSS THE DATA:"
    $step = [Math]::Floor($totalItems / 20)
    $sampleCodes = @()
    for ($i = 0; $i -lt $totalItems; $i += $step) {
        if ($sampleCodes.Count -lt 20) {
            $sampleCodes += $allCodes[$i]
        }
    }
    Write-Host "  $($sampleCodes -join ', ')"
} else {
    Write-Host "Script tag not found"
}
