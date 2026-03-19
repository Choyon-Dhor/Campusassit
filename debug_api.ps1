$body = @{ email = 'admin@campus.edu'; password = 'password123' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/auth/login' -Body $body -ContentType 'application/json'
Write-Host 'LOGIN:' (ConvertTo-Json $login -Depth 5)
$token = $login.token
$batches = Invoke-RestMethod -Uri 'http://localhost:5000/api/batch-routine/batches' -Headers @{ Authorization = "Bearer $token" }
Write-Host 'BATCHES:' (ConvertTo-Json $batches -Depth 5)

# Verify routine retrieval for batch 58 section A
$routine = Invoke-RestMethod -Uri 'http://localhost:5000/api/batch-routine/58/A' -Headers @{ Authorization = "Bearer $token" }
Write-Host 'ROUTINE 58/A:' (ConvertTo-Json $routine -Depth 5)
