# Eduro — AI-Powered Personalized Learning Platform

> **"AI agents that make learning more personalized. They can explain topics in different ways, create practice questions, help with exam preparation, and adjust to a student's learning pace and level."**

Eduro is a full-stack educational web application built with **Next.js (App Router, Tailwind CSS, TypeScript)** and a **Flask REST API (Python)**, powered by **Google Cloud Vertex AI (Gemini)** via **GCP Application Default Credentials (ADC)**.

---

## 🌟 Core Features & User Journey

### 1. Subject & Chapter Catalog
- Browse core academic curricula: **Physics**, **Computer Science**, **Biology**, and **Mathematics**.
- Each subject contains comprehensive chapters with estimated study times, difficulty tags, and learning objectives.
- Ability to **upload custom textbook PDFs** for any subject.

### 2. Dual-Pane Chapter Workspace
- **Interactive PDF Viewer**: Multi-page textbook reading with zoom controls, fullscreen mode, jump-to-page, download, and a dedicated *"Ask AI About This Page"* trigger.
- **Context-Aware AI Tutor**: Grounded in the exact textbook chapter text.
- **5 Pedagogical Modes**:
  - 🧸 **ELI5 (Like I'm 5)**: Real-world analogies, simplified vocabulary, intuitive concepts.
  - 💡 **Analogy Mode**: Relatable metaphors and mental models.
  - 🔬 **Deep Dive**: Rigorous mathematical derivations, formal proofs, and boundary conditions.
  - 🎯 **Exam Focus**: High-yield marks points, examiner pitfalls, and model answer structure.
  - 🧭 **Socratic Guide**: Probing guided questions that help the student deduce answers independently.

### 3. Hamburger Menu Study Suite
Click the **Study Tools (Hamburger)** button in the header to access:
- 📝 **Adaptive Practice Questions**:
  - Automatically calibrated to the student's current **Rank Level**.
  - Interactive MCQs & conceptual questions.
  - Instant **AI Evaluation**: Points out misconceptions, provides model solutions, and awards XP.
  - **Dynamic Rank Progression**: Rank levels (Novice Explorer ➔ Apprentice Scholar ➔ Skilled Adept ➔ Master Practitioner ➔ Grandmaster) adapt question difficulty dynamically.
- ⚡ **Rapid Exam Prep**:
  - High-yield concept cheat sheets.
  - Essential formulas & scientific laws table.
  - Frequent exam traps and misconceptions to avoid.
  - Memory mnemonics.
- 🎴 **Active Recall Flashcards**:
  - Flippable 3D memory cards for spaced repetition.
  - Mastered vs Needs Review tracking.
- 📊 **Mastery Diagnostics & Learning Pace**:
  - Topic mastery matrix (0-100%).
  - AI-diagnosed concept gaps from practice quiz misses.
  - Learning Pace setting: *Casual Pace*, *Balanced Pace*, or *Exam Rush*.

---

## 🏗️ Architecture

```
eduro/
├── backend/
│   ├── app.py                     # Flask REST API with CORS & PDF streaming
│   ├── config.py                  # GCP ADC configuration & fallback diagnostics
│   ├── requirements.txt           # Python dependencies
│   ├── generate_pdfs.py           # Academic textbook PDF generator (ReportLab)
│   ├── services/
│   │   ├── gemini_service.py      # Vertex AI Gemini client via GCP ADC
│   │   ├── pdf_service.py         # PDF text extraction (pypdf) & generation
│   │   └── adaptive_engine.py     # Student rank, XP, mastery & difficulty engine
│   └── data/
│       ├── subjects.json          # Subject & chapter catalog
│       ├── student_profile.json   # Persistent student profile, rank & history
│       └── pdfs/                  # Multi-page textbook chapter PDFs
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Subject & Chapter Selection Hub
│   │   │   └── chapter/[id]/page.tsx # Split-screen PDF reader & AI Tutor
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Breadcrumbs, GCP ADC pill & hamburger trigger
│   │   │   ├── PdfViewer.tsx      # Multi-page PDF viewer with zoom & actions
│   │   │   ├── ChatPanel.tsx      # AI Tutor Chat with 5 pedagogical modes
│   │   │   ├── PracticeDrawer.tsx # Adaptive quiz, instant AI grading & rank-up
│   │   │   ├── ExamPrepDrawer.tsx # High-yield cheat sheets & formulas
│   │   │   ├── FlashcardsDrawer.tsx # Flippable 3D active recall cards
│   │   │   ├── MasteryAnalyticsDrawer.tsx # Topic mastery & pace controls
│   │   │   ├── HamburgerMenu.tsx  # Hamburger slide-in menu
│   │   │   ├── RankBadge.tsx      # Rank, level & XP progression bar
│   │   │   └── UploadModal.tsx    # Custom PDF textbook uploader
│   │   └── lib/
│   │       ├── api.ts             # Typed API client
│   │       └── types.ts           # Core TypeScript types
├── start.sh                       # Single-command launcher for frontend & backend
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.9+ or 3.11+
- **Google Cloud CLI (`gcloud`)** (for GCP ADC authentication)

### 2. Configure GCP Application Default Credentials (ADC)
In your terminal, authenticate your Google Cloud account:
```bash
gcloud auth application-default login
gcloud config set project YOUR_GCP_PROJECT_ID
```
*(Optional: set `GOOGLE_CLOUD_PROJECT=YOUR_GCP_PROJECT_ID` in your environment or in `.env`)*.

> **Note**: Even if your GCP project credentials are being initialized or pending quota, Eduro includes a built-in intelligent tutor fallback engine so the app is always functional and ready for testing!

### 3. Launch with One Command
Run the runner script in the project root:
```bash
./start.sh
```

Or run manually in two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_pdfs.py   # Generates sample chapter PDFs if not present
PYTHONPATH=. python app.py
```
*Backend runs on `http://127.0.0.1:5001`.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🎯 Verification & API Endpoints

- `GET /api/health` — Checks GCP ADC credentials, active project, and Gemini model.
- `GET /api/subjects` — Fetches subjects, chapters, and student mastery.
- `GET /api/pdf/<chapter_id>` — Streams the textbook chapter PDF inline.
- `POST /api/chat` — Context-aware chat grounded in the chapter with 5 style modes.
- `POST /api/practice/generate` — Generates rank-adaptive practice questions.
- `POST /api/practice/evaluate` — AI grading, XP calculation, and rank progression.
- `POST /api/exam-prep` — High-yield cheat sheets, formulas, and examiner traps.
- `POST /api/flashcards` — Active recall flashcards.
- `GET /api/student/profile` — Student rank, XP, and topic mastery matrix.
- `POST /api/upload` — Upload custom PDF textbooks.
