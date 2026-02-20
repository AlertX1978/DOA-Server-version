$content = Get-Content 'c:\Users\atkac\OneDrive\.Codding\DOA\DOA Server version\doa-reader-v4_0.1w.html' -Raw
$match = [regex]::Match($content, '<script[^>]*id="browse-doa-data"[^>]*>\s*(\[[\s\S]*?\])\s*</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($match.Success) {
    $jsonStr = $match.Groups[1].Value
    $data = $jsonStr | ConvertFrom-Json
    
    Write-Host "=== SAMPLE ITEMS WITH DETAILS ===" -ForegroundColor Green
    Write-Host ""
    
    # Show a few items with their full structure
    for ($i = 0; $i -lt 10; $i++) {
        $item = $data[$i]
        Write-Host "[$($i+1)] Code: $($item.code)" -ForegroundColor Cyan
        Write-Host "    Title: $($item.title)"
        Write-Host "    Function: $($item.function)"
        if ($item.description) {
            Write-Host "    Description: $($item.description)"
        }
        if ($item.approvalChain -and @($item.approvalChain).Count -gt 0) {
            Write-Host "    ApprovalChain count: $(@($item.approvalChain).Count) roles"
        }
        Write-Host ""
    }
} else {
    Write-Host "Script tag not found"
}
