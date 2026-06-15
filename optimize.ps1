# optimize.ps1 — Génère des vignettes web optimisées pour le portfolio
# Redimensionne à 2000px de large max, JPEG qualité 80
# Les originaux ne sont PAS modifiés

Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "PORTFOLIO\Photos Portfolio Flo 2026\PORTFOLIO 2026"
$destPath = Join-Path $PSScriptRoot "_web"

$maxWidth = 2000
$jpegQuality = 80L

# JPEG encoder
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, $jpegQuality
)

$files = Get-ChildItem -Path $sourcePath -Recurse -File | Where-Object { $_.Name -ne ".DS_Store" -and $_.Extension -match '\.(jpg|jpeg|png)$' }
$total = $files.Count
$i = 0
$errors = @()

Write-Host ""
Write-Host "=== OPTIMISATION DES IMAGES ===" -ForegroundColor Yellow
Write-Host "Source : $sourcePath"
Write-Host "Destination : $destPath"
Write-Host "Photos a traiter : $total"
Write-Host "Largeur max : ${maxWidth}px | Qualite JPEG : $jpegQuality"
Write-Host "===============================" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $i++
    $relativePath = $file.FullName.Substring($sourcePath.Length + 1)
    $destFile = Join-Path $destPath $relativePath
    $destDir = Split-Path $destFile -Parent

    # Create destination directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    # Skip if already processed and newer than source
    if ((Test-Path $destFile) -and ((Get-Item $destFile).LastWriteTime -ge $file.LastWriteTime)) {
        Write-Host "[$i/$total] SKIP  $relativePath" -ForegroundColor DarkGray
        continue
    }

    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)

        if ($img.Width -gt $maxWidth) {
            $ratio = $maxWidth / $img.Width
            $newWidth = $maxWidth
            $newHeight = [int]($img.Height * $ratio)
        } else {
            $newWidth = $img.Width
            $newHeight = $img.Height
        }

        $resized = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($resized)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

        $resized.Save($destFile, $jpegCodec, $encoderParams)

        $originalKB = [math]::Round($file.Length / 1KB)
        $newKB = [math]::Round((Get-Item $destFile).Length / 1KB)
        $pct = [math]::Round((1 - $newKB / $originalKB) * 100)

        Write-Host "[$i/$total] OK    $relativePath  ${originalKB}KB -> ${newKB}KB (-${pct}%)" -ForegroundColor Green

        $graphics.Dispose()
        $resized.Dispose()
        $img.Dispose()
    }
    catch {
        Write-Host "[$i/$total] ERR   $relativePath : $($_.Exception.Message)" -ForegroundColor Red
        $errors += $relativePath
    }
}

# Summary
Write-Host ""
Write-Host "=== TERMINÉ ===" -ForegroundColor Yellow

$destFiles = Get-ChildItem -Path $destPath -Recurse -File -ErrorAction SilentlyContinue
$totalSizeMB = 0
if ($destFiles) {
    $totalSizeMB = [math]::Round(($destFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
}
Write-Host "Images optimisees : $($total - $errors.Count) / $total"
Write-Host "Taille totale _web : $totalSizeMB Mo"

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Erreurs ($($errors.Count)) :" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host ""
