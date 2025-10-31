# ==============================================================
# WHOP RETRY MVP - Script de Inicio Rápido para Windows
# ==============================================================
# 
# Este script instala dependencias y ejecuta backend + frontend
# en terminales separadas de PowerShell
#
# USO: Click derecho → "Ejecutar con PowerShell"
#      o desde terminal: .\start.ps1
#
# ==============================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  💳 WHOP RETRY MVP - Inicio Rápido" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js instalado
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# ==============================================================
# BACKEND
# ==============================================================

Write-Host "📦 PASO 1: Instalando dependencias del BACKEND..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".\backend\node_modules") {
    Write-Host "⏭️  node_modules ya existe, saltando instalación..." -ForegroundColor Yellow
} else {
    Set-Location -Path ".\backend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del backend" -ForegroundColor Red
        Set-Location -Path ".."
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Set-Location -Path ".."
    Write-Host "✅ Backend instalado correctamente" -ForegroundColor Green
}

Write-Host ""

# ==============================================================
# FRONTEND
# ==============================================================

Write-Host "📦 PASO 2: Instalando dependencias del FRONTEND..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".\frontend\node_modules") {
    Write-Host "⏭️  node_modules ya existe, saltando instalación..." -ForegroundColor Yellow
} else {
    Set-Location -Path ".\frontend"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del frontend" -ForegroundColor Red
        Set-Location -Path ".."
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Set-Location -Path ".."
    Write-Host "✅ Frontend instalado correctamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ✅ INSTALACIÓN COMPLETA" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================
# EJECUTAR SERVIDORES
# ==============================================================

Write-Host "🚀 PASO 3: Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Se abrirán 2 ventanas de PowerShell:" -ForegroundColor Yellow
Write-Host "  1️⃣  Backend  (puerto 3000)" -ForegroundColor White
Write-Host "  2️⃣  Frontend (puerto 5173)" -ForegroundColor White
Write-Host ""

# Obtener ruta absoluta del proyecto
$projectPath = Get-Location

# Iniciar Backend en nueva ventana
Write-Host "🟦 Iniciando Backend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\backend'; Write-Host '🚀 BACKEND - Whop Retry' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Esperar 3 segundos antes de iniciar frontend
Start-Sleep -Seconds 3

# Iniciar Frontend en nueva ventana
Write-Host "🟩 Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\frontend'; Write-Host '🎨 FRONTEND - Dashboard' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ✅ SERVIDORES INICIADOS" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Dashboard:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "📡 API Backend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 PRIMERA PRUEBA:" -ForegroundColor Yellow
Write-Host "   1. Abre http://localhost:5173 en tu navegador" -ForegroundColor White
Write-Host "   2. Click en '+ Crear pago de prueba'" -ForegroundColor White
Write-Host "   3. Observa el pago y los reintentos automáticos" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para detener: Cierra las ventanas de PowerShell del backend y frontend" -ForegroundColor Yellow
Write-Host ""

# Abrir navegador automáticamente después de 5 segundos
Write-Host "🌐 Abriendo dashboard en el navegador en 5 segundos..." -ForegroundColor Magenta
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✅ ¡Todo listo! Disfruta probando Whop Retry MVP" -ForegroundColor Green
Write-Host ""
