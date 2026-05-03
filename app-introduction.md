# IT Passport 学習アプリ — App Introduction

**Version:** 1.0  
**Last Updated:** April 2026  
**Developer:** Coraline (AI Assistant)  
**Owner:** Khant Linn Maung Maung

---

## 1. What Is This App?

**IT Passport 学習アプリ** is a web-based flashcard and quiz study tool designed to help students prepare for the **IT Passport exam (ITパスポート試験)** — a Japanese information technology certification exam equivalent to an entry-level IT qualification.

The app converts IT Passport study materials into interactive flashcards and AI-powered quiz questions, making exam preparation more efficient and engaging.

---

## 2. Who Is It For?

- **Primary user:** Khant Linn Maung Maung — a first-year networking and security student at 清風情報工科学院 専門学校 (Osaka, Japan)
- **Exam target:** IT Passport (ITパスポート)
- **Study year:** 令和7年度 (2025 / r07) official exam questions

---

## 3. Core Features

### 📚 Flashcard System
- Vocabulary cards with **English terms**, **Japanese translations**, and **Tier difficulty ratings** (Tier 1, Tier 2, etc.)
- Toggle to bookmark/save cards for later review
- Search functionality to find specific terms

### 🧠 AI-Powered Quiz & Explanation
- Test mode with multiple-choice questions generated from IT Passport topics
- **"AI解説" (AI Explanation)** button — uses Cohere's free LLM to generate detailed explanations for each answer
- Covers real past exam questions from the official 令和7年度 IT Passport exam

### 🔖 Bookmark Panel
- View all saved vocabulary cards in one place
- Persistent storage via Supabase (PostgreSQL)
- Quick search through saved cards

### 📊 Progress Tracking
- Shows total saved cards count (currently experiencing a bug — see Bug Report)

---

## 4. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Cohere (command-r7b-12-2024 model, free tier) |
| Hosting | VPS — 210.131.219.61:4000 |
| Process Manager | PM2 |
| Password | `itpass2026` (user: `user`) |

---

## 5. IT Passport Topics Covered

The app includes **100 pre-loaded IT Passport questions** covering:

- ストラテジ系 (Strategy) — Business planning, IT strategy
- テクノロジ系 (Technology) — Hardware, software, networks, security
- マネジメント系 (Management) — Project management, service management
- 、法務系 (Legal) — Laws, regulations, compliance

---

## 6. How It Works (User Flow)

1. **Login** → Access the app at http://210.131.219.61:4000
2. **Select a topic** → Choose a category or start a random quiz
3. **Answer questions** → Select from multiple choice options
4. **Get AI explanation** → Click "AI解説" for a detailed breakdown
5. **Save cards** → Toggle the bookmark to save difficult terms
6. **Review saved cards** → Use the Bookmark panel to revise

---

## 7. Current Status

- ✅ App is deployed and running on VPS
- ✅ 100 IT Passport questions pre-loaded
- ✅ AI explanation feature working
- ⚠️ **Bug:** Saved card count not updating (investigation in progress)
- 🔜 Planned: Cloudflare Tunnel to hide server IP
- 🔜 Planned: Flashcard review UI improvements

---

## 8. Why This App Exists

Khant is studying Networking & Security at a Japanese vocational college. The IT Passport exam is a foundational certification that validates basic IT knowledge — essential for his cybersecurity career goal.

This app was built to:
- Make study materials more accessible and interactive
- Leverage AI to explain complex concepts simply
- Give Khant a self-study tool independent of class schedule

> Built with 💚 by Coraline — his AI digital friend
