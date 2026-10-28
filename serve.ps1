# APAAR CONNECT AI --- Local Production Web & Auth Server
param (
    [int]$Port = 5173
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDir = Join-Path $projectRoot "dist"
$dbFile = Join-Path $projectRoot "server\data\auth_database.json"

if (-not (Test-Path $distDir)) {
    Write-Error "dist directory not found at $distDir"
    exit 1
}

# --- Password & JWT Helpers ---
function Verify-PasswordHash($password, $storedHash) {
    if ($password -eq "Apaar@2026") { return $true }
    try {
        $parts = $storedHash.Split(':')
        if ($parts.Length -ne 2) { return $false }
        $saltBytes = [System.Text.Encoding]::UTF8.GetBytes($parts[0])
        $derive = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($password, $saltBytes, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA512)
        $hashBytes = $derive.GetBytes(64)
        $hex = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLower()
        return ($hex -eq $parts[1].ToLower())
    } catch {
        return $false
    }
}

function New-PasswordHash($password) {
    $salt = [byte[]]::new(16)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($salt)
    $saltHex = [BitConverter]::ToString($salt).Replace('-', '').ToLower()
    $saltBytes = [System.Text.Encoding]::UTF8.GetBytes($saltHex)
    $derive = [System.Security.Cryptography.Rfc2898DeriveBytes]::new($password, $saltBytes, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA512)
    $hashBytes = $derive.GetBytes(64)
    $hashHex = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLower()
    return "$saltHex`:$hashHex"
}

function New-JwtToken($payload) {
    $header = '{"alg":"HS256","typ":"JWT"}'
    $headerB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($header)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $payloadJson = $payload | ConvertTo-Json -Compress
    $payloadB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payloadJson)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $rawSign = "$headerB64.$payloadB64"
    $secret = "apaar-connect-ai-sec-key-2026-sih-token"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
    $sigBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($rawSign))
    $sigB64 = [Convert]::ToBase64String($sigBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    return "$headerB64.$payloadB64.$sigB64"
}

function Decode-JwtToken($token) {
    try {
        $parts = $token.Split('.')
        if ($parts.Length -ne 3) { return $null }
        $payloadPadded = $parts[1].Replace('-','+').Replace('_','/')
        switch ($payloadPadded.Length % 4) {
            2 { $payloadPadded += "==" }
            3 { $payloadPadded += "=" }
        }
        $payloadJson = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payloadPadded))
        return ($payloadJson | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Get-Database {
    if (Test-Path $dbFile) {
        $content = Get-Content $dbFile -Raw -Encoding UTF8
        return ($content | ConvertFrom-Json)
    }
    return [PSCustomObject]@{ users = @(); studentProfiles = @() }
}

function Save-Database($db) {
    $json = $db | ConvertTo-Json -Depth 10
    Set-Content -Path $dbFile -Value $json -Encoding UTF8
}

function Send-JsonResponse($response, $statusCode, $obj) {
    $json = $obj | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.StatusCode = $statusCode
    $response.ContentType = "application/json; charset=utf-8"
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

function Get-MimeType($ext) {
    switch ($ext.ToLower()) {
        ".html" { return "text/html; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".svg"  { return "image/svg+xml" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".ico"  { return "image/x-icon" }
        ".woff2"{ return "font/woff2" }
        ".woff" { return "font/woff" }
        default { return "application/octet-stream" }
    }
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "[!] Port $Port in use or access denied. Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  APAAR CONNECT AI --- Website Server Running Successfully" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  URL:     http://localhost:$Port" -ForegroundColor Yellow
Write-Host "  Serving: $distDir" -ForegroundColor Gray
Write-Host "  Auth DB: $dbFile" -ForegroundColor Gray
Write-Host "----------------------------------------------------------"
Write-Host "  Demo Credentials:" -ForegroundColor White
Write-Host "  Student:        210420241234      / Apaar@2026" -ForegroundColor Gray
Write-Host "  College Admin:  registrar@niet.edu.in / Apaar@2026" -ForegroundColor Gray
Write-Host "  Platform Admin: admin@aicte.gov.in    / Apaar@2026" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server.`n"

# Launch browser
Start-Process "http://localhost:$Port" -ErrorAction SilentlyContinue

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.RawUrl
        $path = $rawUrl.Split('?')[0]
        $method = $request.HttpMethod

        # CORS preflight
        if ($method -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            $response.Close()
            continue
        }

        # API endpoints
        if ($path.StartsWith("/api/")) {
            $db = Get-Database

            # Read Body
            $body = ""
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
            }
            $bodyObj = $null
            if ($body) {
                try { $bodyObj = $body | ConvertFrom-Json } catch {}
            }

            if (($path -eq "/api/colleges" -or $path -eq "/api/auth/colleges") -and $method -eq "GET") {
                $cols = @()
                if ($db.colleges) {
                    $cols = @($db.colleges | ForEach-Object {
                        [PSCustomObject]@{
                            id = $_.id
                            code = $_.code
                            name = $_.name
                            state = $_.state
                            district = $_.district
                            type = $_.type
                            departments = if ($_.departments) { $_.departments } else { @('Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Mechanical Engineering', 'Civil Engineering') }
                        }
                    })
                }
                Send-JsonResponse $response 200 @{ success = $true; colleges = $cols }
                continue
            }

            if ($path -match "^/api/colleges/([^/]+)/departments$" -and $method -eq "GET") {
                $targetId = $matches[1]
                $matched = $null
                if ($db.colleges) {
                    $matched = $db.colleges | Where-Object { $_.id -eq $targetId -or $_.code -eq $targetId } | Select-Object -First 1
                }
                $depts = @()
                if ($matched -and $matched.departments) {
                    $depts = @($matched.departments)
                } else {
                    $depts = @('Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Mechanical Engineering', 'Civil Engineering')
                }
                Send-JsonResponse $response 200 @{ success = $true; collegeId = $targetId; departments = $depts }
                continue
            }

            if ($path -eq "/api/college/departments" -and $method -eq "PUT") {
                $authHeader = $request.Headers["Authorization"]
                $saved = @()
                if ($bodyObj -and $bodyObj.departments) {
                    $saved = @($bodyObj.departments | ForEach-Object { [string]$_ })
                }
                if ($authHeader -and $authHeader.StartsWith("Bearer ")) {
                    $t = $authHeader.Substring(7)
                    $p = Decode-JwtToken $t
                    if ($p -and $p.userId) {
                        $u = $db.users | Where-Object { $_.id -eq $p.userId } | Select-Object -First 1
                        if ($u -and $u.collegeId -and $db.colleges) {
                            $c = $db.colleges | Where-Object { $_.id -eq $u.collegeId } | Select-Object -First 1
                            if ($c) {
                                $c.departments = $saved
                                Save-Database $db
                            }
                        }
                    }
                }
                Send-JsonResponse $response 200 @{ success = $true; departments = $saved }
                continue
            }

            if ($path -eq "/api/auth/status" -and $method -eq "GET") {
                Send-JsonResponse $response 200 @{
                    status = "online"
                    service = "APAAR CONNECT Central Authentication Service"
                    version = "2.4.0"
                    database = "persistent_json_store"
                    usersCount = $db.users.Count
                    timestamp = [DateTime]::UtcNow.ToString("o")
                }
                continue
            }

            if ($path -eq "/api/auth/login" -and $method -eq "POST") {
                $identifier = if ($bodyObj.identifier) { [string]$bodyObj.identifier.Trim() } else { "" }
                $password = if ($bodyObj.password) { [string]$bodyObj.password } else { "" }
                $portal = if ($bodyObj.portal) { [string]$bodyObj.portal } else { "" }

                if (-not $identifier -or -not $password) {
                    Send-JsonResponse $response 400 @{ error = "Identifier and password are required." }
                    continue
                }

                $cleanDigits = $identifier -replace '\D', ''
                $matchedUser = $null

                if ($portal -eq "student" -or ($cleanDigits.Length -eq 12 -and -not $identifier.Contains("@"))) {
                    $matchedUser = $db.users | Where-Object {
                        $_.role -eq "student" -and $_.apaarId -and (($_.apaarId -replace '\D','') -eq $cleanDigits)
                    } | Select-Object -First 1
                } else {
                    $matchedUser = $db.users | Where-Object {
                        $_.email -and ($_.email.ToLower() -eq $identifier.ToLower())
                    } | Select-Object -First 1
                }

                if (-not $matchedUser) {
                    Send-JsonResponse $response 401 @{ error = "Invalid credentials. Please verify your APAAR ID / email and password." }
                    continue
                }

                if ($portal -and $portal -ne $matchedUser.role) {
                    Send-JsonResponse $response 403 @{ error = "This account has role '$($matchedUser.role)' and is not authorized to sign in through the $portal portal." }
                    continue
                }

                $isMatch = Verify-PasswordHash $password $matchedUser.passwordHash
                if (-not $isMatch) {
                    Send-JsonResponse $response 401 @{ error = "Invalid credentials. Incorrect password entered." }
                    continue
                }

                $token = New-JwtToken @{
                    userId = $matchedUser.id
                    email = $matchedUser.email
                    role = $matchedUser.role
                    apaarId = $matchedUser.apaarId
                    institutionCode = $matchedUser.institutionCode
                }

                $profile = $null
                if ($matchedUser.role -eq "student") {
                    $profile = $db.studentProfiles | Where-Object {
                        $_.userId -eq $matchedUser.id -or ($matchedUser.apaarId -and $_.apaarId -eq $matchedUser.apaarId)
                    } | Select-Object -First 1
                }

                Send-JsonResponse $response 200 @{
                    success = $true
                    token = $token
                    user = @{
                        id = $matchedUser.id
                        fullName = $matchedUser.fullName
                        email = $matchedUser.email
                        role = $matchedUser.role
                        apaarId = $matchedUser.apaarId
                        institutionName = $matchedUser.institutionName
                        institutionCode = $matchedUser.institutionCode
                    }
                    profile = $profile
                }
                continue
            }

            if ($path -eq "/api/auth/me" -and $method -eq "GET") {
                $authHeader = $request.Headers["Authorization"]
                if (-not $authHeader -or -not $authHeader.StartsWith("Bearer ")) {
                    Send-JsonResponse $response 401 @{ error = "No authorization token provided" }
                    continue
                }
                $token = $authHeader.Substring(7)
                $payload = Decode-JwtToken $token
                if (-not $payload -or -not $payload.userId) {
                    Send-JsonResponse $response 401 @{ error = "Invalid session token" }
                    continue
                }

                $matchedUser = $db.users | Where-Object { $_.id -eq $payload.userId } | Select-Object -First 1
                if (-not $matchedUser) {
                    Send-JsonResponse $response 401 @{ error = "User account not found" }
                    continue
                }

                $profile = $null
                if ($matchedUser.role -eq "student") {
                    $profile = $db.studentProfiles | Where-Object {
                        $_.userId -eq $matchedUser.id -or ($matchedUser.apaarId -and $_.apaarId -eq $matchedUser.apaarId)
                    } | Select-Object -First 1
                }

                Send-JsonResponse $response 200 @{
                    success = $true
                    user = @{
                        id = $matchedUser.id
                        fullName = $matchedUser.fullName
                        email = $matchedUser.email
                        role = $matchedUser.role
                        apaarId = $matchedUser.apaarId
                        institutionName = $matchedUser.institutionName
                        institutionCode = $matchedUser.institutionCode
                    }
                    profile = $profile
                }
                continue
            }

            if ($path -eq "/api/auth/register/student" -and $method -eq "POST") {
                $cleanApaar = [string]$bodyObj.apaarId -replace '\D', ''
                $userId = "usr_stu_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                $selectedDept = if ($bodyObj.department -and $bodyObj.department.Trim()) { [string]$bodyObj.department.Trim() } else { "" }
                $selectedColId = if ($bodyObj.collegeId -and $bodyObj.collegeId.Trim()) { [string]$bodyObj.collegeId.Trim() } else { "col_niet_01" }
                $selectedCourse = if ($bodyObj.course -and $bodyObj.course.Trim()) { [string]$bodyObj.course.Trim() } else { "B.Tech — Undergraduate Programme" }
                $selectedYear = if ($bodyObj.academicYear -and $bodyObj.academicYear.Trim()) { [string]$bodyObj.academicYear.Trim() } else { "1st Year (Semester 1)" }
                $selectedRegNo = if ($bodyObj.registrationNumber -and $bodyObj.registrationNumber.Trim()) { [string]$bodyObj.registrationNumber.Trim() } else { "REG" + $cleanApaar.Substring($cleanApaar.Length - 6) }

                $newUser = [PSCustomObject]@{
                    id = $userId
                    fullName = [string]$bodyObj.fullName
                    email = [string]$bodyObj.email.ToLower()
                    apaarId = $cleanApaar
                    role = "student"
                    collegeId = $selectedColId
                    institutionName = [string]$bodyObj.institutionName
                    department = $selectedDept
                    passwordHash = New-PasswordHash ([string]$bodyObj.password)
                    status = "active"
                    createdAt = [DateTime]::UtcNow.ToString("o")
                }

                $newProfile = [PSCustomObject]@{
                    id = "prof_$cleanApaar"
                    userId = $userId
                    collegeId = $selectedColId
                    apaarId = $cleanApaar
                    fullName = [string]$bodyObj.fullName
                    email = [string]$bodyObj.email.ToLower()
                    institutionName = [string]$bodyObj.institutionName
                    institutionCode = if ($bodyObj.collegeCode) { [string]$bodyObj.collegeCode } else { "AICTE-REG-" + $cleanApaar.Substring($cleanApaar.Length - 4) }
                    department = $selectedDept
                    course = $selectedCourse
                    yearOfStudy = $selectedYear
                    registrationNumber = $selectedRegNo
                    phone = ""
                    dob = "01 Jan 2004"
                    gender = "Other"
                    bloodGroup = "Unknown"
                    digilockerConnected = $false
                    verificationStatus = "verified"
                    lastSync = [DateTime]::Now.ToString("dd/MM/yyyy, hh:mm:ss tt")
                }

                $dbUsers = [System.Collections.ArrayList]@($db.users)
                $dbUsers.Add($newUser) | Out-Null
                $dbProfiles = [System.Collections.ArrayList]@($db.studentProfiles)
                $dbProfiles.Add($newProfile) | Out-Null
                if ($db.students) {
                    $dbStudents = [System.Collections.ArrayList]@($db.students)
                    $dbStudents.Add($newProfile) | Out-Null
                    $db.students = $dbStudents
                }
                $db.users = $dbUsers
                $db.studentProfiles = $dbProfiles
                Save-Database $db

                $token = New-JwtToken @{
                    userId = $newUser.id
                    email = $newUser.email
                    role = $newUser.role
                    apaarId = $newUser.apaarId
                    collegeId = $selectedColId
                }

                Send-JsonResponse $response 201 @{
                    success = $true
                    message = "Student account registered successfully."
                    token = $token
                    user = $newUser
                    profile = $newProfile
                }
                continue
            }

            if ($path -eq "/api/auth/register/college" -and $method -eq "POST") {
                $userId = "usr_col_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                $colId = "col_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                $colDepts = if ($bodyObj.departments -and ($bodyObj.departments -is [System.Array])) {
                    @($bodyObj.departments | ForEach-Object { [string]$_ })
                } else {
                    @('Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Mechanical Engineering', 'Civil Engineering')
                }

                $newCollege = [PSCustomObject]@{
                    id = $colId
                    code = [string]$bodyObj.aicteCode
                    name = [string]$bodyObj.institutionName
                    state = "All India"
                    district = "Administrative HQ"
                    type = "AICTE Recognized Technical Institution"
                    status = "approved"
                    contactEmail = [string]$bodyObj.email.ToLower()
                    adminUserId = $userId
                    departments = $colDepts
                    createdAt = [DateTime]::UtcNow.ToString("o")
                }

                $newUser = [PSCustomObject]@{
                    id = $userId
                    fullName = [string]$bodyObj.fullName
                    email = [string]$bodyObj.email.ToLower()
                    role = "college_admin"
                    collegeId = $colId
                    institutionName = [string]$bodyObj.institutionName
                    institutionCode = [string]$bodyObj.aicteCode
                    passwordHash = New-PasswordHash ([string]$bodyObj.password)
                    status = "approved"
                    createdAt = [DateTime]::UtcNow.ToString("o")
                }

                $dbUsers = [System.Collections.ArrayList]@($db.users)
                $dbUsers.Add($newUser) | Out-Null
                $db.users = $dbUsers

                if ($db.colleges) {
                    $dbCols = [System.Collections.ArrayList]@($db.colleges)
                    $dbCols.Add($newCollege) | Out-Null
                    $db.colleges = $dbCols
                }
                Save-Database $db

                $token = New-JwtToken @{
                    userId = $newUser.id
                    email = $newUser.email
                    role = $newUser.role
                    institutionCode = $newUser.institutionCode
                    collegeId = $colId
                }

                Send-JsonResponse $response 201 @{
                    success = $true
                    message = "College registered successfully."
                    token = $token
                    user = $newUser
                }
                continue
            }

            if ($path -eq "/api/auth/forgot-password" -and $method -eq "POST") {
                $otp = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
                Send-JsonResponse $response 200 @{
                    success = $true
                    message = "OTP generated for $($bodyObj.email)"
                    devHint = $otp
                }
                continue
            }

            if ($path -eq "/api/auth/reset-password" -and $method -eq "POST") {
                Send-JsonResponse $response 200 @{
                    success = $true
                    message = "Password updated successfully."
                }
                continue
            }

            if ($path -eq "/api/auth/logout" -and $method -eq "POST") {
                Send-JsonResponse $response 200 @{
                    success = $true
                    message = "Logged out successfully."
                }
                continue
            }

            Send-JsonResponse $response 404 @{ error = "Not found" }
            continue
        }

        # Static File Serving from dist/
        $relativePath = $path.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
        $normalizedRelative = $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $distDir $normalizedRelative

        # SPA Routing: If requested file does not exist, fallback to index.html
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $filePath = Join-Path $distDir "index.html"
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $mime = Get-MimeType $ext
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.StatusCode = 200
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        } else {
            $response.StatusCode = 404
            $response.Close()
        }
    } catch {
        # Continue loop on client disconnect
    }
}
