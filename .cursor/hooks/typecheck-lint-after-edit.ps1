param()

$ErrorActionPreference = 'Stop'

function Get-HookPayload {
  try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return $null
    }
    return $raw | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-EditedFilePath($payload) {
  if ($null -eq $payload) {
    return ''
  }

  $candidates = @(
    $payload.file_path,
    $payload.path,
    $payload.target_file,
    $payload.tool_input.path,
    $payload.toolInput.path
  )

  foreach ($candidate in $candidates) {
    if ($null -ne $candidate -and -not [string]::IsNullOrWhiteSpace([string]$candidate)) {
      return [string]$candidate
    }
  }

  return ''
}

function ShouldRunChecks([string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) {
    return $true
  }

  return $path -match '\.(ts|tsx|js|jsx|json)$'
}

function Get-TypecheckCommand([string]$path) {
  if ($path -like 'apps/server/*') {
    return 'npm run typecheck -w @autocare/server'
  }
  if ($path -like 'apps/mobile/*') {
    return 'npm run typecheck -w @autocare/mobile'
  }
  if ($path -like 'apps/web/*') {
    return 'npm run typecheck -w @autocare/web'
  }
  if ($path -like 'packages/db/*') {
    return 'npm run typecheck -w @autocare/db'
  }
  if ($path -like 'packages/auth/*') {
    return 'npm run typecheck -w @autocare/auth'
  }
  if ($path -like 'packages/shared/*') {
    return 'npm run typecheck -w @autocare/shared'
  }
  return 'npm run typecheck'
}

$payload = Get-HookPayload
$editedFilePath = Get-EditedFilePath $payload

if (-not (ShouldRunChecks $editedFilePath)) {
  exit 0
}

$repoRoot = Resolve-Path "$PSScriptRoot\..\.."
Push-Location $repoRoot

try {
  if (-not [string]::IsNullOrWhiteSpace($editedFilePath)) {
    $absoluteEditedPath = $editedFilePath
    if (-not [System.IO.Path]::IsPathRooted($absoluteEditedPath)) {
      $absoluteEditedPath = Join-Path $repoRoot $editedFilePath
    }
    if (Test-Path $absoluteEditedPath) {
      $editedFilePath = Resolve-Path -LiteralPath $absoluteEditedPath -Relative
      $editedFilePath = $editedFilePath.TrimStart('.\')
      $editedFilePath = $editedFilePath -replace '\\', '/'
    }
  }

  Write-Host '[hook] Running TypeScript checks...'
  $typecheckCommand = Get-TypecheckCommand $editedFilePath
  Invoke-Expression $typecheckCommand | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[hook] typecheck failed; fix TypeScript errors.'
    exit $LASTEXITCODE
  }

  Write-Host '[hook] Running Biome lint...'
  if ([string]::IsNullOrWhiteSpace($editedFilePath)) {
    npm run lint | Out-Host
  } else {
    npx biome check $editedFilePath | Out-Host
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[hook] lint failed; fix Biome issues.'
    exit $LASTEXITCODE
  }

  Write-Host '[hook] Typecheck and lint passed.'
  exit 0
} finally {
  Pop-Location
}
