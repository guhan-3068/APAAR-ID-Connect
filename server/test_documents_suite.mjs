import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

console.log('=================================================================')
console.log('   APAAR CONNECT AI — DOCUMENT MANAGEMENT VERIFICATION SUITE    ')
console.log('=================================================================\n')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`)
    passed++
  } else {
    console.error(`[FAIL] ${message}`)
    failed++
  }
}

// 1. Inspect StudentDocuments.tsx
const studentDocPath = path.join(root, 'src', 'pages', 'student', 'StudentDocuments.tsx')
const studentDocContent = fs.readFileSync(studentDocPath, 'utf-8')

console.log('--- 1. Verification of Replace and Delete Removal ---')
assert(!studentDocContent.includes('Submit Replacement'), 'Submit Replacement button removed from Student Documents page')
assert(!studentDocContent.includes('setDocToReplace'), 'setDocToReplace state and trigger removed')
assert(!studentDocContent.includes('setDocToDelete'), 'setDocToDelete state and trigger removed')
assert(!studentDocContent.includes('<Trash2'), 'Trash2 (delete icon button) removed from student document table rows')
assert(!studentDocContent.includes('Upload Replacement'), 'Upload Replacement modal removed from student document page')
assert(!studentDocContent.includes('Confirm Document Removal'), 'Delete confirmation modal removed from student document page')

console.log('\n--- 1b. Verification of Submit Document Section Removal ---')
assert(!studentDocContent.includes('Submit Academic Document for Verification'), '"Submit Academic Document for Verification" heading completely removed')
assert(!studentDocContent.includes('Upload certificates or marksheets for college registrar scrutiny'), 'Upload description completely removed')
assert(!studentDocContent.includes('Upload for Verification'), '"Upload for Verification" button completely removed')
assert(!studentDocContent.includes('doc-file-upload'), 'File picker zone input completely removed')
assert(!studentDocContent.includes('handleUploadSubmit'), 'handleUploadSubmit handler completely removed')
assert(!studentDocContent.includes('handleFileChange'), 'handleFileChange handler completely removed')
assert(!studentDocContent.includes('isUploading'), 'isUploading state completely removed')

console.log('\n--- 2. Preservation of View and Download Buttons ---')
assert(studentDocContent.includes('setPreviewDoc(doc)'), 'View button preserved and opens document preview')
assert(studentDocContent.includes('handleDownloadDoc(doc)'), 'Download button preserved for authorized documents')
assert(studentDocContent.includes('Locked'), 'Locked indicator preserved for official verified records')

console.log('\n--- 3. Display of Correction Reasons and Contact Instructions ---')
assert(studentDocContent.includes('Correction Required'), 'Displays "Correction Required" status clearly')
assert(studentDocContent.includes('Correction Reason:'), 'Displays "Correction Reason:" heading')
assert(studentDocContent.includes('Action Required — Please Contact Your College'), 'Displays "Action Required — Please Contact Your College" heading')
assert(
  studentDocContent.includes('Please visit your college management office to resolve the issue with your document. The college management will review the original document, make the necessary corrections, and update your digital record so that verification can be completed as soon as possible.'),
  'Displays exact required contact college instructions'
)
assert(
  studentDocContent.includes('Please contact your college management for further information about this document.'),
  'Provides fallback when correction reason is not specified'
)

console.log('\n--- 4. Verification of 4 Required Document Statuses ---')
const studentMockDataPath = path.join(root, 'src', 'services', 'studentMockData.ts')
const studentMockDataContent = fs.readFileSync(studentMockDataPath, 'utf-8')

assert(studentMockDataContent.includes("'verified'"), 'Includes documents with status "verified"')
assert(studentMockDataContent.includes("'pending'"), 'Includes documents with status "pending"')
assert(studentMockDataContent.includes("'requires_review'"), 'Includes documents with status "requires_review" (Correction Required)')
assert(studentMockDataContent.includes("'missing'"), 'Includes documents with status "missing" (Missing)')
assert(studentMockDataContent.includes('The uploaded document is blurry and some information is unreadable.'), 'Community Certificate contains specific blurry document reason')
assert(studentMockDataContent.includes('Discrepancy detected in internal evaluation component marks and institutional seal.'), 'Different document (Semester 4 Marksheet) contains distinct correction reason')

console.log('\n--- 5. Verification of College Management Review & Update Responsibility ---')
const adminDocReviewPath = path.join(root, 'src', 'pages', 'admin', 'AdminDocumentReview.tsx')
const adminDocReviewContent = fs.readFileSync(adminDocReviewPath, 'utf-8')
const adminContextPath = path.join(root, 'src', 'context', 'AdminContext.tsx')
const adminContextContent = fs.readFileSync(adminContextPath, 'utf-8')

assert(adminDocReviewContent.includes('Upload Corrected Copy & Verify'), 'Admin Review modal includes option to upload corrected digital copy')
assert(adminDocReviewContent.includes('Edit Correction Reason'), 'Admin Review modal includes option to update correction reasons')
assert(adminContextContent.includes('updateDocumentReview'), 'AdminContext provides updateDocumentReview action')
assert(adminContextContent.includes('apaar_college_doc_update'), 'Dispatches event and syncs update to Student Portal')
assert(adminContextContent.includes('apaar_student_notifications'), 'Dispatches notification to student upon college update')

console.log('\n=================================================================')
console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log('=================================================================')

if (failed > 0) {
  process.exit(1)
}
