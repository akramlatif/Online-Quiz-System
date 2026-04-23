# ─────────────────────────────────────────────────────────
#  Aetheria Quiz — One-Click Setup Script
#  Run this from the project root:  .\setup.ps1
# ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Aetheria Quiz — Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check .env ────────────────────────────────────
Write-Host "[1/4] Checking .env file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "  WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "  Copying .env.example to .env. Please fill in your DATABASE_URL and NEXTAUTH_SECRET later." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "REPLACE_WITH" -or $envContent -match "USER:PASSWORD") {
    Write-Host "  WARNING: .env still has placeholder values for DATABASE_URL or NEXTAUTH_SECRET!" -ForegroundColor Yellow
    Write-Host "  Make sure you edit .env before starting the app." -ForegroundColor Yellow
} else {
    Write-Host "  .env found and looks configured." -ForegroundColor Green
}

# ── Step 2: Install packages ──────────────────────────────
Write-Host ""
Write-Host "[2/4] Installing npm packages..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed. Make sure Node.js is installed and npm is in your PATH." -ForegroundColor Red
    exit 1
}
Write-Host "  Packages installed." -ForegroundColor Green

# ── Step 3: Generate Prisma Client ───────────────────────
Write-Host ""
Write-Host "[3/4] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: prisma generate failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Prisma Client generated." -ForegroundColor Green

# ── Step 4: Push schema to DB ────────────────────────────
Write-Host ""
Write-Host "[4/4] Pushing Prisma schema to database..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: db push failed. Check your DATABASE_URL in .env." -ForegroundColor Red
    exit 1
}
Write-Host "  Database schema applied." -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup complete! Start the app with:" -ForegroundColor Green
Write-Host "    npm run dev" -ForegroundColor White
Write-Host "  Then open: http://localhost:3000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
