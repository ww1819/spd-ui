# 清理 spd-ui 开发服务被 JS Debugger Auto Attach 卡住的状态
# - 释放 8100/8101 端口上的监听进程
# - 结束卡在 vue-cli-service / cross-env 的相关 node（尽量保守，仅匹配命令行特征）
# - 提示清除本终端调试注入环境变量

$ErrorActionPreference = 'Continue'
$ports = @(8100, 8101)
$killed = @{}

function Stop-PidSafe([int]$ProcessId, [string]$Reason) {
  if ($ProcessId -le 0 -or $killed.ContainsKey($ProcessId)) { return }
  try {
    $p = Get-Process -Id $ProcessId -ErrorAction Stop
    Write-Host ("[kill] pid={0} name={1} reason={2}" -f $ProcessId, $p.ProcessName, $Reason)
    Stop-Process -Id $ProcessId -Force -ErrorAction Stop
    $killed[$ProcessId] = $true
  } catch {
    Write-Host ("[skip] pid={0} ({1})" -f $ProcessId, $_.Exception.Message)
  }
}

Write-Host '=== 清理 spd-ui 调试阻塞 ==='

foreach ($port in $ports) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  } catch {
    $conns = @()
  }
  if (-not $conns) {
    Write-Host ("[port {0}] 无监听" -f $port)
    continue
  }
  foreach ($c in $conns) {
    Stop-PidSafe -ProcessId ([int]$c.OwningProcess) -Reason ("listen :{0}" -f $port)
  }
}

# 匹配被 js-debug bootloader 注入、或卡在 vue-cli-service serve 的 node
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
  $cmd = [string]$_.CommandLine
  if (-not $cmd) { return }
  $hit =
    ($cmd -match 'ms-vscode\.js-debug' -and $cmd -match 'spd-ui') -or
    ($cmd -match 'vue-cli-service(\.js)?\s+serve') -or
    ($cmd -match 'cross-env.*vue-cli-service')
  if ($hit) {
    Stop-PidSafe -ProcessId ([int]$_.ProcessId) -Reason 'matched hung/dev node'
  }
}

# 当前会话：去掉调试注入，保留合法 NODE_OPTIONS（若有）
if ($env:VSCODE_INSPECTOR_OPTIONS) {
  Remove-Item Env:VSCODE_INSPECTOR_OPTIONS -ErrorAction SilentlyContinue
  Write-Host '[env] 已清除 VSCODE_INSPECTOR_OPTIONS'
}
if ($env:NODE_OPTIONS -and $env:NODE_OPTIONS -match 'js-debug|bootloader|inspect-publish-uid') {
  $cleaned = ($env:NODE_OPTIONS -replace '--require\s+"[^"]*js-debug[^"]*"', '' -replace '--inspect-publish-uid=\S+', '').Trim()
  if ($cleaned) {
    $env:NODE_OPTIONS = $cleaned
    Write-Host ('[env] 已清洗 NODE_OPTIONS -> {0}' -f $cleaned)
  } else {
    Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
    Write-Host '[env] 已清除含调试注入的 NODE_OPTIONS'
  }
}

if ($killed.Count -eq 0) {
  Write-Host '未发现需结束的进程（或已清理）。'
} else {
  Write-Host ("已结束 {0} 个进程。" -f $killed.Count)
}

Write-Host ''
Write-Host '建议：工作区已关闭 debug.javascript.autoAttachFilter；新开终端后执行 npm run dev'
Write-Host '或运行任务：spd-ui: 清理后启动 dev'
