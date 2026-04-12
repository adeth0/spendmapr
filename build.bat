@echo off
echo Building SpendMapr...
echo.
echo Note: This is a static build. Dependencies should be installed with:
echo npm install
echo.
echo Starting build process...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Error: node_modules directory not found.
    echo Please run 'npm install' first.
    echo.
    echo If you're having issues with npm, try:
    echo 1. Run PowerShell as Administrator
    echo 2. Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo 3. Then run: npm install
    exit /b 1
)

REM Run the build
echo Running build...
npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo Build completed successfully!
echo Output directory: dist
echo.
echo To deploy to GitHub Pages:
echo 1. Push to GitHub
echo 2. Go to repository Settings > Pages
echo 3. Set source to "Deploy from a branch"
echo 4. Select "main" branch and "/(root)" folder
echo.
pause