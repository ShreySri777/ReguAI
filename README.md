# 🤖 ReguAI

## AI-Powered Compliance & Regulatory Management Platform

ReguAI is a full-stack compliance management platform that uses **AI-powered semantic analysis** to evaluate documents against regulatory requirements.

It helps users analyze documents, identify compliance gaps, calculate compliance scores, prioritize risks, track compliance history, and generate audit reports.

---

## ✨ Features

- 📄 Document Upload & Management
- 🤖 AI-Powered Compliance Analysis
- 🔍 Semantic Evidence Retrieval
- 📋 Regulatory Requirement Management
- 🏛️ Framework-Based Compliance Checking
- 📊 Compliance Score Calculation
- ⚠️ Risk Assessment & Prioritization
- 📚 Compliance History Tracking
- 📝 Compliance Gap Identification
- 📑 Automated Audit Report Generation
- 📥 PDF Audit Report Download
- 🔄 Framework-Specific Analysis
- 📌 Requirement Severity Management
- 🧾 Evidence-Based Compliance Results

---

## 🧠 AI Features

ReguAI uses a **local Transformer-based NLP pipeline** for semantic document analysis.

### AI Workflow

```text
Document
   ↓
Text Extraction
   ↓
Text Chunking
   ↓
Transformer Embeddings
   ↓
Semantic Search
   ↓
Relevant Evidence
   ↓
Compliance Evaluation
   ↓
Score & Risk Assessment

```
---

###AI Model

sentence-transformers/all-MiniLM-L6-v2
Hugging Face Transformers
PyTorch
384-dimensional embeddings
Local inference
No paid AI API required

---

###🏗️ Modules
###📄 Document Module
Upload documents
Extract document text
Store document information
Analyze compliance documents
Track document workflow

###🏛️ Framework Module
Create compliance frameworks
Activate/deactivate frameworks
Associate requirements with frameworks
Perform framework-specific compliance checks

###📋 Requirement Module
Create requirements
Edit requirements
Delete requirements
Categorize requirements
Assign severity levels
Framework-specific requirements

###🤖 Compliance Module
Analyze documents against requirements
Retrieve relevant evidence
Classify requirements as:
Matched
Review
Missing
Calculate compliance scores
Identify compliance gaps

###⚠️ Risk Module
Requirement-level risk calculation
Severity-based risk assessment
Compliance status-based risk calculation
Risk levels:
Minimal
Low
Medium
High
Critical
Persistent risk history

###📑 Audit Report Module
Generate audit reports
View previous reports
Include compliance results
Include compliance gaps
Include risk information
Download reports as PDF

---

###🛠️ Technologies Used
🐍 Python
⚡ FastAPI
⚛️ React
🚀 Vite
🗄️ SQLite
🔗 SQLAlchemy
🤗 Hugging Face Transformers
🔥 PyTorch
📄 PyMuPDF
📑 ReportLab
📦 Pydantic
🔧 Git & GitHub

---

###⚙️ Installation & Setup
1. Clone Repository
git clone https://github.com/ShreySri777/ReguAI.git
cd ReguAI

2. Backend Setup
cd backend
py -3.13 -m venv .venv313
.venv313\Scripts\activate
python -m pip install -r requirements.txt

Start the backend:
python -m uvicorn app.main:app

Backend:
http://127.0.0.1:8000

API Documentation:
http://127.0.0.1:8000/docs

3. Frontend Setup
Open another terminal:
cd frontend
npm install
npm run dev

Frontend:
http://localhost:5173

---
##Application Workflow
```text
Upload Document
       ↓
Extract Text
       ↓
Select Compliance Framework
       ↓
Run AI Compliance Check
       ↓
Retrieve Evidence
       ↓
Evaluate Requirements
       ↓
Calculate Compliance Score
       ↓
Assess Risk
       ↓
View Compliance Gaps
       ↓
Generate Audit Report
       ↓
Download PDF
```

###👨‍💻 Author

Shrey Srivastava

GitHub:
https://github.com/ShreySri777
