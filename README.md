# 🩺 MedPrep Web — AI Clinical Vignette Generator & Medical Syllabus Ingestion Engine

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Generative%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![PDF.js](https://img.shields.io/badge/PDF.js-Client--Side%20Parsing-E44D26?style=for-the-badge)](https://mozilla.github.io/pdf.js/)
[![Mammoth](https://img.shields.io/badge/Mammoth-DOCX%20Extractor-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Muhammad%20Okasha-blueviolet?style=for-the-badge)](https://github.com/muhammadokashapak)

<p align="center">
  <strong>Client-Side Document Parsing & Generative AI Synthesis for Dynamic High-Yield Medical Single-Best-Answer Examinations</strong>
</p>

[📖 Overview](#-overview) •
[🧠 Generative AI Pipeline](#-ai-ingestion--synthesis-pipeline) •
[✨ Key Capabilities](#-key-capabilities) •
[📂 Directory Structure](#-directory-structure) •
[🚀 Quickstart](#-quickstart--setup) •
[👨‍💻 Author](#-author--connect)

---

</div>

## 📖 Overview

Medical knowledge expands exponentially every year. Standard medical question banks frequently take months or years to reflect new clinical trials, updated WHO guidelines, and revised disease staging criteria.

**MedPrep Web** revolutionizes medical exam preparation through real-time Generative AI ingestion. Rather than relying solely on static static databases, doctors and students can upload any clinical guideline, medical textbook chapter (`.pdf`), or lecture summary (`.docx`). The platform parses the document locally in the browser and leverages **Google Gemini AI** to dynamically synthesize Board-standard Single-Best-Answer (SBA) clinical scenarios, complete with distractors and comprehensive evidence-based rationales.

---

## 🧠 AI Ingestion & Synthesis Pipeline

```mermaid
graph TD
    subgraph Ingestion Layer (100% Client-Side)
        U[User Uploads PDF Textbook / DOCX Notes] --> P1{File Extension}
        P1 -->|*.pdf| PDF[PDF.js In-Memory Text Stream Parser]
        P1 -->|*.docx| MAM[Mammoth DOCX Raw HTML & Text Extractor]
        PDF --> CHUNK[Medical Section Chunking & Token Windowing]
        MAM --> CHUNK
    end

    subgraph Generative Synthesis Layer
        CHUNK --> PROMPT[Clinical Prompt Engineering & Medical Taxonomy Mapping]
        PROMPT --> GEMINI[Google Gemini Pro / Flash AI API]
        GEMINI --> JSON[Structured JSON Schema Validation]
    end

    subgraph Interactive Examination
        JSON --> EXAM[Dynamic Timed MCQ Quiz Engine]
        EXAM --> RAT[Evidence-Based Explanations & High-Yield Pearls]
    end
```

---

## ✨ Key Capabilities

- 📄 **Universal Client-Side Document Ingestion:** Uses `pdfjs-dist` and `mammoth` to extract dense biomedical texts directly in browser RAM with zero third-party cloud file storage.
- 🤖 **Board-Standard Clinical Scenario Generation:** Synthesizes realistic patient presentations (Age, Gender, Vitals, Chief Complaint, Lab Values, Imaging Findings).
- 🎯 **Plausible Distractor Engineering:** Crafts sophisticated distractor options that test common diagnostic pitfalls and subtle differential diagnoses.
- ⏱️ **Integrated Mock Examination Simulator:** Full countdown clock, flag question for review, instant score calculation, and missed questions breakdown.
- 🔒 **Zero Data Retention:** Protects proprietary medical notes and unpublished syllabi since document processing never leaves the browser.

---

## 📂 Directory Structure

```
MedPrep-Web/
│
├── src/
│   ├── utils/
│   │   └── geminiApi.js       # Google Gemini Generative AI client & prompt templates
│   ├── App.jsx                # Interactive examination interface & parser controller
│   ├── main.jsx               # React 19 application bootstrap
│   └── index.css              # Custom medical styling & responsive layout
├── public/                    # Static assets & favicon
├── package.json               # React 19, Vite, PDF.js, and Mammoth dependencies
├── vite.config.js             # Vite 8 build & bundler configuration
└── README.md                  # VIP Master Architecture Documentation
```

---

## 🚀 Quickstart & Setup

### 1. Clone & Install
```bash
git clone https://github.com/muhammadokashapak/MedPrep-Web.git
cd MedPrep-Web

npm install
```

### 2. Configure Gemini API Key
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Upload any medical PDF or DOCX file to generate your customized mock examination!

---

## 👨‍💻 Author & Connect

**Muhammad Okasha**  
*AI & Medical Technology Software Architect*  
- **GitHub:** [@muhammadokashapak](https://github.com/muhammadokashapak)
- **Repository:** [MedPrep-Web](https://github.com/muhammadokashapak/MedPrep-Web)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
