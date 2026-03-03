# Cure-it [https://cure-it-theta.vercel.app/]

Cure-it is a modern, AI-powered healthcare management platform designed to streamline the interaction between patients and doctors while providing advanced clinical insights and public health monitoring.

## 🚀 Features

### 📅 Appointment & Queue Management

- **Real-time Queue:** Doctors can manage their daily patient flow with an interactive queue, marking patients as done or skipping when necessary.
- **Easy Booking:** Patients can book in-person, video, or emergency appointments directly through their dashboard.

### 🔐 Patient Consent & Privacy

- **Granular Access Control:** Patients have full control over who sees their medical records. They can grant, revoke, or delete access for specific doctors at any time.
- **Secure Sharing:** Temporary access tokens for sharing specific medical information with specialists or third parties.

### 📜 Complete Medical History

- **Unified Health Record:** Centralized storage for medical records, test results, and prescriptions.
- **Self-Upload:** Patients can upload their own records and test results to keep their history up to date.

### 💊 Quick Pharmacy Support

- **Digital Prescriptions:** Instant access to prescriptions for patients to share with pharmacies.
- **Medication Tracking:** Integrated history of prescribed medications within the clinical record.

### 🤖 AI-Powered Healthcare

- **Patient AI Helper:** An assistant for patients that stays updated with their latest medical records to answer health-related queries and explain test results.
- **Doctor AI Assistant:** A specialized tool for clinicians to search, summarize, and find patterns within massive medical histories, saving time and improving diagnostic accuracy.
- **Global Trend Analysis:** AI-based analysis of anonymized mass symptom reports to detect local outbreaks and global epidemics in real-time.

## 🛠 Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Engine:** [Google Gemini API](https://ai.google.dev/)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI

## 🏃 Getting Started

1.  **Clone the repository**
2.  **Install dependencies:** `npm install`
3.  **Configure environment variables:** Copy `.env.example` to `.env` and fill in your Supabase and Google AI credentials.
4.  **Run migrations:** Apply the `supabase-schema.sql` to your Supabase project.
5.  **Launch dev server:** `npm run dev`

---

Built to empower patients and assist doctors with the next generation of medical intelligence.
