# Clear spd-ui hang caused by Cursor/VS Code JS Auto Attach bootloader.
# Usage:
#   .\clear-dev-block.ps1
#   .\clear-dev-block.ps1 -StartDev
param(
  [switch]$StartDev
)

$ErrorActionPreference = 'Continue'
$uiRoot = Split-Path -Parent $PSScriptRoot
$ports = @(8100, 8101)
$killed = @{}
$CleanNodeOptions = '--max-old-space-size=4096 --openssl-legacy-provider'

function Stop-PidSafe {
  param(
    [int]$ProcessId,
    [string]$Reason
  )
  if ($ProcessId -le 0) { return }
  if ($killed.ContainsKey($ProcessId)) { return }
  try {
    $p = Get-Process -Id $ProcessId -ErrorAction Stop
    Write-Host ("[kill] pid={0} name={1} reason={2}" -f $ProcessId, $p.ProcessName, $Reason)
    Stop-Process -Id $ProcessId -Force -ErrorAction Stop
    $killed[$ProcessId] = $true
  } catch {
    Write-Host ("[skip] pid={0} ({1})" -f $ProcessId, $_.Exception.Message)
  }
}

function Clear-DebugInjectEnv {
  if (Test-Path Env:VSCODE_INSPECTOR_OPTIONS) {
    Remove-Item Env:VSCODE_INSPECTOR_OPTIONS -ErrorAction SilentlyContinue
    Write-Host '[env] cleared VSCODE_INSPECTOR_OPTIONS'
  }
  if (Test-Path Env:NODE_OPTIONS) {
    $val = [string]$env:NODE_OPTIONS
    if ($val -match 'js-debug|bootloader|inspect-publish-uid|inspectorIpc') {
      Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
      Write-Host '[env] cleared injected NODE_OPTIONS'
    }
  }
  $env:NODE_OPTIONS = $CleanNodeOptions
  Write-Host ('[env] NODE_OPTIONS -> {0}' -f $env:NODE_OPTIONS)
}

Write-Host '=== clear spd-ui debug block ==='
Clear-DebugInjectEnv

foreach ($port in $ports) {
  try {
    $conns = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
  } catch {
    $conns = @()
  }
  if ($conns.Count -eq 0) {
    Write-Host ('[port {0}] no listener' -f $port)
    continue
  }
  foreach ($c in $conns) {
    $reason = 'listen-port-' + $port
    Stop-PidSafe -ProcessId ([int]$c.OwningProcess) -Reason $reason
  }
}

Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
  $name = [string]$_.Name
  if ($name -ne 'node.exe' -and $name -ne 'npm.exe' -and $name -ne 'npm.cmd') {
    return
  }
  $cmd = [string]$_.CommandLine
  if ([string]::IsNullOrEmpty($cmd)) {
    return
  }
  $hit = $false
  if ($cmd -match 'ms-vscode\.js-debug|bootloader\.js') { $hit = $true }
  if ($cmd -match 'vue-cli-service(\.js)?\s+serve') { $hit = $true }
  if ($cmd -match 'cross-env.*vue-cli-service') { $hit = $true }
  if (($cmd -match 'spd-ui') -and ($cmd -match 'npm.*run\s+dev')) { $hit = $true }
  if (($cmd -match '[\\/]spd-ui[\\/]') -and ($cmd -match 'vue-cli-service')) { $hit = $true }
  if ($hit) {
    Stop-PidSafe -ProcessId ([int]$_.ProcessId) -Reason 'matched-hung-dev-node'
  }
}

if ($killed.Count -eq 0) {
  Write-Host 'no process killed (already clean).'
} else {
  Write-Host ('killed {0} process(es).' -f $killed.Count)
}

if (-not $StartDev) {
  Write-Host ''
  Write-Host 'Cleanup only. To start frontend, run task: spd-ui: clear then start dev'
  Write-Host 'or: npm run dev:clear'
  exit 0
}

Write-Host ''
Write-Host '=== start npm run dev with clean env ==='
Clear-DebugInjectEnv
Set-Location -LiteralPath $uiRoot
Write-Host ('cwd={0}' -f (Get-Location))
Write-Host ('NODE_OPTIONS={0}' -f $env:NODE_OPTIONS)
Write-Host ('VSCODE_INSPECTOR_OPTIONS present? {0}' -f [bool](Test-Path Env:VSCODE_INSPECTOR_OPTIONS))

$npmCmd = $null
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npm) {
  $npmCmd = $npm.Source
} else {
  $npm2 = Get-Command npm -ErrorAction SilentlyContinue
  if ($npm2) { $npmCmd = $npm2.Source }
}
if (-not $npmCmd) {
  Write-Host '[error] npm not found'
  exit 1
}

& $npmCmd run dev
exit $LASTEXITCODE
