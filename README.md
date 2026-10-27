# APAAR CONNECT AI

> **Smart India Hackathon (SIH)**  
> **Problem Statement ID:** SIH26263  
> **Title:** Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions.  
> **Category:** Software / Higher Education & Governance  

---

## 📌 Executive Summary

**APAAR CONNECT AI** is a comprehensive, institutional-grade web platform designed for AICTE-approved higher educational institutions across India. It addresses the challenge of managing and securely verifying the 12-digit **Automated Permanent Academic Account Registry (APAAR)** ID — the digital identity backbone introduced under the National Education Policy (NEP 2020) and the Academic Bank of Credits (ABC).

The platform bridges three critical tiers of the academic ecosystem:
1. **Students**: Self-service profile management, transcript tracking, secure document uploads, verification request submission, and DPDP Act 2023 compliant third-party data sharing consent.
2. **College Administrators (Registrar / Dean's Office)**: Student registry management, academic record credentialing, multi-stage document scrutiny, duplicate & data quality detection engine, immutable administrative audit trail, and authorized CSV exports.
3. **AICTE Central Platform Administrators**: Nationwide institutional monitoring, state/district compliance rankings, accreditation tracking, and high-level academic integrity surveillance.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Modern concurrent React with functional components & custom hooks |
| **Language & Typings** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict type-safety across all entities, API schemas, and state contexts |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Sub-second HMR and optimized production bundle splitting |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) | Curated Indian government/academic palette with responsive layout tokens |
| **State & Service Layer** | React Context + Service Architecture | `StudentContext`, `AdminContext`, `PlatformContext` backed by `appDataService` |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) | Consistent, accessible iconography |
| **Code Quality** | Oxlint + TypeScript Compiler (`tsc -b`) | Zero TypeScript errors, high static analysis confidence |

---

## 🏗️ System Architecture & Implementation

### 1. Data Layer & Reactive Contexts (Stage 9)
- **`appDataService.ts`**: Unified abstraction service simulating backend CRUD operations, search filters, pagination, cryptographic hash generation, and CSV/JSON data serialization.
- **`StudentContext.tsx`**: Provides reactive state management for enrolled student profiles, academic marksheets, uploaded credentials, verification requests, in-app notifications, and DPDP sharing requests.
- **`AdminContext.tsx`**: Manages institutional student dossiers, pending verification queues, data quality anomalies, document scrutiny, and admin audit history.
- **`PlatformContext.tsx`**: Manages nationwide AICTE metrics, institution directory, onboarding statuses, and compliance scoring.

### 2. Notifications & Live Updates (Stage 10)
- **Interactive Notification Center**: Real-time notification counters in Student and Admin navigation headers, filterable by all/unread, with mark-as-read and mark-all-read capabilities.
- **Dynamic Action Feedback**: Instant floating toast banners and audit trail log dispatch whenever verifications are approved, rejected, documents uploaded, or consent status toggled.
- **Authorized Data Export**: One-click CSV and JSON exports for student rosters, verification queues, academic marksheets, audit trails, and institution directories.
- **Visual Analytics**: Pure SVG donut charts and responsive bar charts visualizing verification distribution, SGPA progression, and AICTE compliance scores.

### 3. Testing, Verification & Code Quality (Stage 11)
- Strict TypeScript compilation (`tsc -b`) passing with **0 errors**.
- Linter validation (`npm run lint`) passing with **0 errors**.
- Defensive validations on all input formats (12-digit APAAR ID, email syntax, file MIME types, credit score bounds).

### 4. Hackathon Demonstration Layer (Stage 12)
- **Evaluator Quick-Access Hub**: Dedicated portal switcher card directly on the landing page hero section, enabling seamless transitions between Student, College Admin, and Central AICTE views without re-authenticating.
- **Comprehensive Demonstration Dataset**: High-fidelity fictional student profiles, accredited institutions (IIT Bombay, COEP Pune, VJTI Mumbai, etc.), historical marksheets, and pending verification requests.

---

## 🧭 Navigation Routes & Portals

### 🌟 Public & Authentication Routes
| Route | Page | Description |
|---|---|---|
| `/` | **Landing Page** | Platform introduction, key features, architecture overview, and **Evaluator Demo Switcher** |
| `/verification` | **Public APAAR Verifier** | Instant 12-digit APAAR ID validation tool with tamper-evident cryptographic seal inspection |
| `/login` | **Sign In** | Role-aware authentication portal with demo preset credentials |
| `/register` | **Registration** | Student and Institutional admin onboarding with AICTE affiliation verification |
| `/forgot-password` | **Password Recovery** | Demonstration recovery flow with simulated OTP dispatch |

### 🎓 Student Portal (`/student/*`)
| Route | View | Capabilities |
|---|---|---|
| `/student` | **Overview** | Credit tally, degree completion meter, recent verification updates & quick actions |
| `/student/profile` | **Profile & APAAR Card** | Digital APAAR identity card with masking toggle, QR code, and personal details |
| `/student/records` | **Academic Records** | Semester marksheets, SGPA/CGPA breakdowns, credit points, and SHA-256 hashes |
| `/student/documents` | **Documents Vault** | Secure credential upload with format validation, status badges, and deletion |
| `/student/requests` | **Verification & Consent** | Submit institutional verification requests & manage **DPDP Act 2023 third-party data sharing consents** |
| `/student/notifications` | **Notification Center** | In-app alerts for verification decisions, security audits, and institutional notices |
| `/student/settings` | **Privacy & Settings** | Data sharing preferences, notification controls, and credentials update |

### 🏛️ College Administrator Portal (`/admin/*`)
| Route | View | Capabilities |
|---|---|---|
| `/admin` | **Admin Dashboard** | Institution KPIs, pending scrutiny count, data quality alerts, and recent activities |
| `/admin/students` | **Student Directory** | Searchable roster with department filters, full dossier view, and **CSV Export** |
| `/admin/academic-records` | **Academic Scrutiny** | Semester results, transcript ledger, credit verification, and **CSV Export** |
| `/admin/documents` | **Document Review** | Certificate authenticity check, marksheet review, and status updates |
| `/admin/verifications` | **Verification Workflow** | Multi-step scrutiny queue with approval and mandatory rejection reason logging |
| `/admin/data-quality` | **Data Quality Engine** | Heuristic duplicate detection, missing field alerts, and anomaly resolution |
| `/admin/audit` | **Immutable Audit Log** | Tamper-evident log of all institutional actions with **CSV & JSON Exports** |
| `/admin/analytics` | **Institutional Analytics**| Departmental verification distribution, trend breakdown, and compliance health |
| `/admin/notifications` | **Admin Notifications** | Urgent institutional alerts, verification submissions, and sync notices |
| `/admin/settings` | **College Settings** | Institutional AICTE affiliation, registrar profile, and threshold configurations |

### 🇮🇳 AICTE Central Platform Portal (`/platform/*`)
| Route | View | Capabilities |
|---|---|---|
| `/platform` | **Central Overview** | Nationwide totals, verified student ratios, active institutions, and macro trends |
| `/platform/institutions` | **Institution Registry** | All affiliated colleges with NAAC accreditation, enrollment counts, and **CSV Export** |
| `/platform/analytics` | **National Analytics** | State-wise distribution, autonomous vs. government breakdown, and compliance rankings |
| `/platform/compliance` | **Integrity Audits** | Real-time surveillance of institution compliance flags and anomaly monitoring |

---

## 🚀 How to Run and Test Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/` to view the application with active hot module replacement (HMR).

### 4. Build for Production
To verify strict TypeScript compilation and create the optimized production bundle:
```bash
npm run build
```

### 5. Run Static Code Analysis (Linter)
```bash
npm run lint
```

### 6. Preview Production Build
```bash
npm run preview
```

---

## 🎯 Hackathon Demonstration Guide (For Evaluators)

When demonstrating **APAAR CONNECT AI** to jury members and evaluators, use the following recommended walkthrough:

### Step 1: Evaluator Portal Switcher
1. Navigate to the landing page at `http://localhost:5173/`.
2. In the hero section, observe the **"SIH Evaluator Demo Portals"** quick-access card.
3. Click any portal button to jump directly into the respective role without needing to enter passwords.

### Step 2: Test Sample APAAR IDs (Public Verifier)
Navigate to `/verification` and test any of the following pre-loaded synthetic IDs:
- `2024-9843-1205` — **Aarav Mehta** (B.Tech Computer Science, COEP Pune) — *Verified*
- `2024-1189-7642` — **Priya Sharma** (B.Tech Information Technology, VJTI Mumbai) — *Verified*
- `2024-5541-9920` — **Rohan Verma** (B.Tech Mechanical Engineering, SPPU Pune) — *Under Review*
- `2024-7721-3349` — **Ananya Deshmukh** (B.Tech Electronics & Telecommunication) — *Pending*

### Step 3: Student Experience Walkthrough
1. Switch to `/student`.
2. Inspect the **Degree Progress** and **Academic Bank of Credits (ABC)** tally.
3. Go to `/student/requests` and switch to the **"DPDP Act Consent & Sharing"** tab.
4. Review pending third-party data access requests (e.g., *Tata Consultancy Services Campus Recruitment*).
5. Click **"Approve Consent"** to observe live cryptographic token generation, audit log entry creation, and real-time toast feedback.
6. Notice the bell notification badge updating dynamically in the top navigation bar.

### Step 4: College Administrator Walkthrough
1. Switch to `/admin`.
2. In `/admin/verifications`, review pending verification requests. Click **"Approve"** or **"Reject"** (with mandatory reason) to observe immediate status updates and notification broadcasts.
3. In `/admin/students` and `/admin/academic-records`, test the **"Export CSV"** button to download clean, structured academic datasets.
4. In `/admin/data-quality`, observe heuristic duplicate detection and click **"Resolve Issue"**.
5. In `/admin/audit`, click **"Export JSON"** or **"Export CSV"** to inspect the audit trail.

### Step 5: AICTE Platform Administrator Walkthrough
1. Switch to `/platform`.
2. Review nationwide institutional compliance scores and accreditation filters.
3. In `/platform/institutions`, test the search filter and click **"Export CSV"**.

---

## 🔒 Functional Scope & Simulation Boundaries

In adherence to Hackathon evaluation standards, the platform clearly distinguishes between fully functional client-side logic and simulated external government infrastructures:

| Feature | Implementation Status | Technical Details |
|---|---|---|
| **12-Digit APAAR ID Formatting & Validation** | **Fully Functional** | Implements the Luhn checksum-ready 12-digit format with automated hyphen insertion (`XXXX-XXXX-XXXX`). |
| **State Management & Live Updates** | **Fully Functional** | React Context architecture with reactive mutations, real-time unread counts, and instant UI synchronization. |
| **Data Export (CSV & JSON)** | **Fully Functional** | Generates compliant RFC 4180 CSV strings and JSON blobs with automatic browser download triggers. |
| **DPDP Act 2023 Consent Workflow** | **Fully Functional** | Demonstrates purpose-limited, time-bound third-party access tokens and immutable consent revocation logs. |
| **Cryptographic Hash Sealing** | **Functional Simulation** | Generates verifiable SHA-256 fingerprint strings mimicking DigiLocker e-Signatures. |
| **UIDAI Aadhaar e-KYC & OTP Delivery** | **Simulated for Demo** | Uses realistic simulated OTPs (`482910`) and fictional demographics; does not connect to live UIDAI production gateways (restricted to licensed AUAs/KUAs). |
| **DigiLocker / ABC National Depository API** | **Simulated for Demo** | Mimics live API responses from `https://nad.digilocker.gov.in/` using local realistic mock schemas. |
| **AI Inference & OCR Scrutiny** | **Heuristic Simulation** | Uses deterministic heuristic rule engines to detect duplicates, discrepancies, and missing document seals. |

---

## 👥 Contributors & Credits

- **Project:** APAAR CONNECT AI
- **Smart India Hackathon Problem Statement:** SIH26263
- **Developed for:** All India Council for Technical Education (AICTE) & Ministry of Education, Government of India.
