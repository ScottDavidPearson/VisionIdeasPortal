try {
    $nodePath = "C:\Program Files\nodejs"
    $env:PATH = "$nodePath;$env:PATH"

    Write-Host "Node.js version:"
    & node --version

    Write-Host "NPM version:"
    & npm --version

    Write-Host "Starting server..."
    Set-Location "c:\Users\spearson\CascadeProjects\windsurf-project"
    & node server.js

} catch {
    Write-Host "Error: $_"
}
