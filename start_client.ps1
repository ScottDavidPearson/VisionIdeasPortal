try {
    $nodePath = "C:\Program Files\nodejs"
    $env:PATH = "$nodePath;$env:PATH"

    Write-Host "Starting React development server..."
    Set-Location "c:\Users\spearson\CascadeProjects\windsurf-project\client"
    & npm start

} catch {
    Write-Host "Error: $_"
}
