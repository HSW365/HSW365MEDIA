<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wlpBoMCDYa9sX0SGZYjYL80cy0ZI9k-z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## HSW365 Promo Engine (`/promo`)

AI marketing co-founder that promotes every HSW365 app. Open `promo/index.html` (served at `/promo/` on any static host).

- **General:** product brief (researched from the live link), buyer personas, competitor research, landing-page conversion audit, week-by-week action plan that drops into Tasks
- **Content:** one post adapted natively to Instagram, TikTok, YouTube Shorts, X, Threads, Facebook, LinkedIn, Reddit and email, with a vertical video script, per-platform rewrite, character limits and one-click post/copy
- **Autopilot:** one run writes fresh, non-repeating posts for every selected app, interleaves them and schedules them on the calendar
- **Calendar:** month view, `.ics` export for your phone, CSV export for Buffer / Metricool bulk upload
- **Analytics:** UTM-tagged links per platform (auto-applied to generated posts), results logging and dashboard
- **Distribution:** Catches (live threads where people ask for what you built, with a founder reply) and a Virality scorer
- **Memory:** everything created is kept in the browser, exportable as a backup, and synced to the HSW365 clone agent (`/remember`) when sync is on

AI runs on a free Google Gemini key (aistudio.google.com/apikey) or a free Groq key, entered in Settings and stored only in your browser. The app catalog lives in `promo/apps.js`.
