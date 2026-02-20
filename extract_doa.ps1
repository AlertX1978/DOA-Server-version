$content = Get-Content 'c:\Users\atkac\OneDrive\.Codding\DOA\DOA Server version\doa-reader-v4_0.1w.html' -Raw
$match = [regex]::Match($content, '<script[^>]*id="browse-doa-data"[^>]*>\s*(\[[\s\S]*?\])\s*</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($match.Success) {
    $jsonStr = $match.Groups[1].Value
    $data = $jsonStr | ConvertFrom-Json
    
    $totalItems = @($data).Count
    $topLevelCodes = @{}
    $sampleCodes = @()
    
    foreach ($item in $data) {
        if ($sampleCodes.Count -lt 15) {
            $sampleCodes += $item.code
        }
        $topCode = $item.code.Split('.')[0]
        if (-not $topLevelCodes.ContainsKey($topCode)) {
            $topLevelCodes[$topCode] = 0
        }
        $topLevelCodes[$topCode]++
    }
    
    Write-Host "Total items: $totalItems"
    Write-Host "Top-level codes: $($topLevelCodes.Keys | Sort-Object)"
    Write-Host "Count per category:"
    $topLevelCodes.GetEnumerator() | Sort-Object Key | ForEach-Object { 
        Write-Host "  Category $($_.Key): $($_.Value)" 
    }
    Write-Host "Sample codes (first 15): $($sampleCodes -join ', ')"
} else {
    Write-Host "Script tag not found"
}
