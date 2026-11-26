param(
    [ValidateSet('Release', 'Debug')][string]$Configuration = 'Release',
    [ValidateSet('arm64-v8a', 'x86_64')][string]$Architecture = 'arm64-v8a'
)

$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$projectParent = Split-Path $projectPath -Parent
$projectName = Split-Path $projectPath -Leaf
$originalLocation = (Get-Location).Path
$originalNodeEnv = $env:NODE_ENV
$originalShortRoot = $env:FACERECOGNITION_SHORT_ROOT
$drive = $null
$mapped = $false

try {
    # Shorten native CMake paths without moving the activity out of ordinaria.
    $usedDrives = @((Get-CimInstance Win32_LogicalDisk).DeviceID)
    foreach ($letter in @('Z', 'Y', 'X', 'W', 'V', 'U')) {
        $candidate = "${letter}:"
        if ($usedDrives -notcontains $candidate -and -not (Test-Path "${candidate}\")) {
            $drive = $candidate
            break
        }
    }
    if (-not $drive) { throw 'No hay una letra de unidad libre para compilar con una ruta corta.' }
    & subst.exe $drive $projectParent
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la ruta corta temporal.' }
    $mapped = $true
    $shortProject = "${drive}\$projectName"
    $env:FACERECOGNITION_SHORT_ROOT = $shortProject
    Set-Location $shortProject
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar el proyecto Android.' }
    $env:NODE_ENV = if ($Configuration -eq 'Release') { 'production' } else { 'development' }
    Set-Location (Join-Path $shortProject 'android')
    & .\gradlew.bat "assemble$Configuration" "-PreactNativeArchitectures=$Architecture" '-Pkotlin.compiler.execution.strategy=in-process' --max-workers=2 --no-daemon
    if ($LASTEXITCODE -ne 0) { throw 'La compilación Android falló. Revisa el error anterior.' }
    $variant = $Configuration.ToLowerInvariant()
    Write-Output "APK: $(Join-Path $projectPath "android/app/build/outputs/apk/$variant/app-$variant.apk")"
} finally {
    Set-Location $originalLocation
    $env:NODE_ENV = $originalNodeEnv
    $env:FACERECOGNITION_SHORT_ROOT = $originalShortRoot
    if ($mapped) { & subst.exe $drive /D }
}
