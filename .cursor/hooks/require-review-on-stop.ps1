param()

# Keep stop hook permissive; this placeholder avoids missing-script failures.
Write-Host '[hook] stop: review reminder hook is active.'
exit 0
#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

try {
  $rawInput = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($rawInput)) {
    Write-Output '{}'
    exit 0
  }

  $needsVitestReview = $rawInput -match '(?i)(vitest\.config|\.test\.(ts|tsx|js|jsx)|\.spec\.(ts|tsx|js|jsx)|vitest)'
  $needsNativewindReview = $rawInput -match '(?i)(nativewind|className|src\/.*\.(ts|tsx)|src\\.*\.(ts|tsx))'

  $needsReview = $needsVitestReview -or $needsNativewindReview
  $hasReviewRequest = $rawInput -match '(?i)(vitest-reviewer|nativewind-reviewer|yg-quality-gate|run\s+.*review|review\s+.*changes)'

  if ($needsReview -and -not $hasReviewRequest) {
    $msg = @'
Review gate is enabled for this repo.

Before finishing, explicitly run at least one relevant reviewer:
- `vitest-reviewer` for test/Vitest changes
- `nativewind-reviewer` for NativeWind/UI changes
- `yg-quality-gate` for broad validation
'@

    $escapedMsg = $msg.Replace('\', '\\').Replace('"', '\"').Replace("`r`n", '\n').Replace("`n", '\n')
    Write-Output "{`"followup_message`":`"$escapedMsg`"}"
    exit 0
  }

  Write-Output '{}'
  exit 0
} catch {
  Write-Output '{}'
  exit 0
}
