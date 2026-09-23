# 🩺 MedPrep Web — AI-Powered Medical Examination & Syllabus Testing Engine

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.1+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PDF.js-Client--Side-E44D26?style=for-the-badge" alt="PDF.js" />
  <img src="https://img.shields.io/badge/Lucide_Icons-F43F5E?style=for-the-badge" alt="Lucide" />
</p>

---

## 📌 Overview

**MedPrep Web** is an interactive, browser-based medical examination simulator and intelligent study platform designed for medical students, FCPS Part 1 candidates, and USMLE aspirants. 

The application enables doctors and students to ingest medical literature, clinical guidelines, and high-yield notes directly from `.pdf` and `.docx` documents. Powered by **Google Gemini AI**, it dynamically synthesizes clinical vignette MCQs, timed mock examinations, flashcard drills, and deep conceptual explanations with zero server dependencies.

---

## ✨ Core Features

### 1. Document & Syllabus Ingestion
- **Client-Side PDF Extraction:** Uses `pdfjs-dist` to parse medical textbook chapters and notes locally in the browser with high accuracy.
- **Word Document (.docx) Parsing:** Uses `mammoth` to extract clean structured text, tables, and syllabi from lecture slides and documents.

### 2. AI Clinical MCQ Generation
- **Dynamic Question Synthesis:** Direct integration with Google Gemini Pro / Flash models to generate high-yield single-best-answer (SBA) MCQs based on uploaded study material.
- **Detailed Clinical Rationale:** Each question provides an evidence-based explanation for the correct option and rationales debunking distractors.

### 3. Examination & Mock Simulation
- **Timed Exam Simulator:** Real-time countdown clock, question flagging, unanswered question trackers, and instant score summaries.
- **Subject-Wise Filtering:** Practice by medical disciplines including Anatomy, Physiology, Pathology, Pharmacology, Surgery, Medicine, and Pediatrics.
- **Performance Analytics:** Visual breakdowns of accuracy rates, time spent per clinical scenario, and weak topic identification.

---

## 🏗️ Tech Stack

- **Framework:** React 19 (Modern hooks and concurrent rendering)
- **Bundler & Dev Server:** Vite 8
- **Document Extractors:** `pdfjs-dist` (PDF extraction) & `mammoth` (DOCX parsing)
- **AI Engine:** Google Gemini Generative AI API
- **Icons & UI:** Lucide React & Tailwind CSS styling

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- A Google Gemini API Key ([Get one from Google AI Studio](https://aistudio.google.com/))

### Installation
```bash
# Clone the repository
git clone https://github.com/muhammadokashapak/MedPrep-Web.git
cd MedPrep-Web

# Install dependencies
npm install

# Configure environment variables
# Create a .env file in the root directory:
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run development server
npm run dev
```

Open `http://localhost:5173` to launch MedPrep Web in your browser.

---

## 🔒 Privacy & Offline Processing
All document ingestion (PDF/DOCX) takes place strictly in the user's browser without uploading proprietary files to third-party web servers.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
