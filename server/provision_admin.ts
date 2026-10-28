/**
 * server/provision_admin.ts
 *
 * SECURE SERVER-SIDE PLATFORM ADMINISTRATOR PROVISIONING TOOL
 *
 * In privileged government and enterprise architectures, initial administrator setup
 * and emergency break-glass operations must be executed directly on the trusted server
 * console rather than through unverified public client forms.
 *
 * Usage:
 *   node --experimental-strip-types server/provision_admin.ts <command> [arguments...]
 *
 * Commands:
 *   create <name> <email> <username> <empId> <designation> <password> <securityQuestion> <securityAnswer>
 *   invite [expiresInDays]
 *   list-pending
 *   approve <userId>
 *   reset-lockout <email>
 *   help
 */

import { dbService, hashPassword, hashSecurityAnswer } from './portalDb.ts'
import crypto from 'node:crypto'

function printHelp(): void {
  console.log(`
========================================================================
 AICTE APAAR CONNECT AI — PLATFORM ADMINISTRATOR MANAGEMENT CLI
========================================================================
Usage:
  node --experimental-strip-types server/provision_admin.ts <command> [args]

Commands:
  1. create <fullName> <email> <username> <employeeId> <designation> <password> <securityQuestion> <securityAnswer>
     Provision a new authorized Platform Administrator immediately (Status: ACTIVE).
     Pass arguments with quotes if they contain spaces.
     Example:
       node --experimental-strip-types server/provision_admin.ts create "Dr. Ramesh Sharma" "ramesh@aicte.gov.in" "ramesh_aicte" "AICTE-OFF-09" "Director of IT" "Apaar@Sec2026!" "What was the name of your first school?" "Kendriya Vidyalaya"

  2. invite [expiresInDays=14]
     Generate a cryptographically secure 1회 invitation token for administrative enrollment.
     Example:
       node --experimental-strip-types server/provision_admin.ts invite 30

  3. list-pending
     Display all platform administrator registration requests awaiting authorization.
     Example:
       node --experimental-strip-types server/provision_admin.ts list-pending

  4. approve <userId>
     Approve and activate a pending administrator enrollment request.
     Example:
       node --experimental-strip-types server/provision_admin.ts approve usr_admin_12345

  5. reset-lockout <emailOrUsername>
     Clear failed login attempts and unlock an administrator account.
     Example:
       node --experimental-strip-types server/provision_admin.ts reset-lockout "admin@aicte.gov.in"
========================================================================
`)
}

async function handleCreate(args: string[]): Promise<void> {
  if (args.length < 8) {
    console.error('Error: Insufficient arguments for create.')
    console.error('Required: <fullName> <email> <username> <employeeId> <designation> <password> <securityQuestion> <securityAnswer>')
    process.exit(1)
  }

  const [fullName, email, username, employeeId, designation, password, securityQuestion, securityAnswer] = args

  const cleanEmail = email.trim().toLowerCase()
  const cleanUsername = username.trim().toLowerCase()

  // Verify email domain
  const validDomains = ['.gov.in', '.nic.in', '.ac.in', '.edu.in']
  if (!validDomains.some((d) => cleanEmail.endsWith(d))) {
    console.error(`Error: Official administrator email must end in one of: ${validDomains.join(', ')}`)
    process.exit(1)
  }

  // Check duplicates
  if (dbService.findUserByEmail(cleanEmail)) {
    console.error(`Error: An account with email "${cleanEmail}" already exists.`)
    process.exit(1)
  }

  const existingByUsername = dbService.getUsers().find((u) => u.username?.toLowerCase() === cleanUsername)
  if (existingByUsername) {
    console.error(`Error: The username "${cleanUsername}" is already taken.`)
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.')
    process.exit(1)
  }

  const newAdmin = {
    id: `usr_platform_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    fullName: fullName.trim(),
    email: cleanEmail,
    username: cleanUsername,
    role: 'platform_admin' as const,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    status: 'active' as const,
    securityQuestion: securityQuestion.trim(),
    securityAnswerHash: hashSecurityAnswer(securityAnswer),
    failedLoginAttempts: 0,
    lockoutUntil: 0,
    employeeId: employeeId.trim(),
    designation: designation.trim(),
    approvedAt: new Date().toISOString(),
    approvedByAdminId: 'ROOT_SERVER_CONSOLE',
  }

  dbService.createUser(newAdmin)

  console.log('\n[SUCCESS] Platform Administrator provisioned successfully:')
  console.log(`  ID:                 ${newAdmin.id}`)
  console.log(`  Full Name:          ${newAdmin.fullName}`)
  console.log(`  Email:              ${newAdmin.email}`)
  console.log(`  Username:           ${newAdmin.username}`)
  console.log(`  Officer ID:         ${newAdmin.employeeId}`)
  console.log(`  Designation:        ${newAdmin.designation}`)
  console.log(`  Status:             ACTIVE (Immediate access granted)`)
  console.log(`  Security Question:  ${newAdmin.securityQuestion}`)
  console.log(`  Security Hash:      PBKDF2 salted hash created (Answer is NOT stored in plaintext)\n`)
}

async function handleInvite(args: string[]): Promise<void> {
  const days = parseInt(args[0] || '14', 10)
  if (isNaN(days) || days <= 0) {
    console.error('Error: Expiration days must be a positive integer.')
    process.exit(1)
  }

  const token = `AICTE-ADMIN-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
  const inv = dbService.createAdminInvitation('ROOT_SERVER_OPERATOR', days, token)

  console.log('\n[SUCCESS] Cryptographic Administrator Invitation Token generated:')
  console.log(`  Invitation Token:   ${inv.code}`)
  console.log(`  Generated For:      AICTE Administrative Enrollment`)
  console.log(`  Expires At:         ${inv.expiresAt} (${days} days)`)
  console.log(`  Usage:              One-time use during registration on /register?portal=platform_admin\n`)
}

async function handleListPending(): Promise<void> {
  const pending = dbService.getPendingAdminRequests()
  console.log(`\nFound ${pending.length} pending administrator enrollment requests:\n`)
  if (pending.length === 0) {
    console.log('  No pending requests.')
    return
  }

  pending.forEach((req, idx) => {
    console.log(`  [${idx + 1}] ID: ${req.id}`)
    console.log(`      Name:         ${req.fullName}`)
    console.log(`      Email:        ${req.email}`)
    console.log(`      Username:     ${req.username}`)
    console.log(`      Employee ID:  ${req.employeeId || 'N/A'}`)
    console.log(`      Designation:  ${req.designation || 'N/A'}`)
    console.log(`      Requested At: ${req.createdAt}`)
    console.log('')
  })
}

async function handleApprove(args: string[]): Promise<void> {
  const userId = args[0]
  if (!userId) {
    console.error('Error: Please provide the user ID to approve.')
    process.exit(1)
  }

  const res = dbService.approveAdminRequest(userId, 'ROOT_SERVER_OPERATOR')
  if (!res.success) {
    console.error(`Error: ${res.error}`)
    process.exit(1)
  }

  console.log(`\n[SUCCESS] Administrator ${res.user?.fullName} (${res.user?.email}) has been approved and activated!`)
  console.log(`  Account status is now: ACTIVE\n`)
}

async function handleResetLockout(args: string[]): Promise<void> {
  const identifier = args[0]
  if (!identifier) {
    console.error('Error: Please provide an email or username.')
    process.exit(1)
  }

  const clean = identifier.trim().toLowerCase()
  const user = dbService.getUsers().find(
    (u) => u.email.toLowerCase() === clean || u.username?.toLowerCase() === clean
  )

  if (!user) {
    console.error(`Error: User with identifier "${identifier}" not found.`)
    process.exit(1)
  }

  dbService.updateUser(user.id, {
    failedLoginAttempts: 0,
    lockoutUntil: 0,
  })

  console.log(`\n[SUCCESS] Lockout cleared for ${user.fullName} (${user.email}). Failed attempts reset to 0.\n`)
}

async function main(): Promise<void> {
  const [,, command, ...args] = process.argv

  switch (command) {
    case 'create':
      await handleCreate(args)
      break
    case 'invite':
      await handleInvite(args)
      break
    case 'list-pending':
      await handleListPending()
      break
    case 'approve':
      await handleApprove(args)
      break
    case 'reset-lockout':
      await handleResetLockout(args)
      break
    case 'help':
    case '--help':
    case '-h':
      printHelp()
      break
    default:
      if (!command) {
        printHelp()
      } else {
        console.error(`Unknown command: "${command}". Run with "help" to view options.`)
        process.exit(1)
      }
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err)
  process.exit(1)
})
