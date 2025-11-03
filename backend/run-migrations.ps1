# SCRIPT DE MIGRACIONES SQL
# Ejecuta las 2 migraciones pendientes en SQLite

Write-Host "Ejecutando migraciones SQL..." -ForegroundColor Cyan
Write-Host ""

$dbPath = "data.db"

# Verificar si existe SQLite3
try {
    $null = sqlite3 -version
    Write-Host "SQLite3 encontrado" -ForegroundColor Green
} catch {
    Write-Host "ERROR: sqlite3 no esta instalado" -ForegroundColor Red
    Write-Host "Descarga desde: https://www.sqlite.org/download.html" -ForegroundColor Yellow
    exit 1
}

# Verificar si existe la base de datos
if (-Not (Test-Path $dbPath)) {
    Write-Host "Base de datos no existe, se creara automaticamente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Migracion 1/2: Onboarding columns" -ForegroundColor Cyan

# Leer SQL de migracion 1
$sql1 = Get-Content "migrations\add_onboarding_columns.sql" -Raw

# Ejecutar migracion 1
try {
    $sql1 | sqlite3 $dbPath 2>&1 | Out-Null
    
    # Verificar si las columnas existen
    $schema = sqlite3 $dbPath "PRAGMA table_info(users);" | Out-String
    
    if ($schema -match "onboarding_step") {
        Write-Host "   Columna onboarding_step existe" -ForegroundColor Green
    } else {
        Write-Host "   Columna onboarding_step no se creo" -ForegroundColor Yellow
    }
    
    if ($schema -match "onboarding_completed_at") {
        Write-Host "   Columna onboarding_completed_at existe" -ForegroundColor Green
    } else {
        Write-Host "   Columna onboarding_completed_at no se creo" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error en migracion (puede ser normal si ya existian)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Migracion 2/2: Achievements table" -ForegroundColor Cyan

# Leer SQL de migracion 2
$sql2 = Get-Content "fix_achievements.sql" -Raw

# Ejecutar migracion 2
try {
    $sql2 | sqlite3 $dbPath 2>&1 | Out-Null
    
    # Verificar si la tabla existe
    $tables = sqlite3 $dbPath ".tables" | Out-String
    
    if ($tables -match "achievements") {
        Write-Host "   Tabla achievements creada" -ForegroundColor Green
        
        # Mostrar schema
        $achievementsSchema = sqlite3 $dbPath ".schema achievements"
        Write-Host "   Schema:" -ForegroundColor Gray
        Write-Host "   $achievementsSchema" -ForegroundColor Gray
    } else {
        Write-Host "   Tabla achievements no se creo" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error en migracion" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Migraciones completadas" -ForegroundColor Green
Write-Host ""
Write-Host "Estado de la base de datos:" -ForegroundColor Cyan

# Listar todas las tablas
$allTables = sqlite3 $dbPath ".tables"
Write-Host "   Tablas: $allTables" -ForegroundColor White

Write-Host ""
Write-Host "Todo listo! Ahora puedes iniciar el backend con: npm start" -ForegroundColor Green
Write-Host ""
