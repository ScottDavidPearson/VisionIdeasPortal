$nodePath = "C:\Program Files\nodejs"
$env:PATH = "$nodePath;$env:PATH"
Set-Location "c:\Users\spearson\CascadeProjects\windsurf-project"

Write-Host "Installing backend dependencies..."
npm install

Write-Host "Installing frontend dependencies..."
npm run install-client

Write-Host "Setup complete!"
