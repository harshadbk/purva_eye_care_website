# Purva Eye Care Center: Website

This is the website for **पुर्वा आय केअर सेंटर (Purva Eye Care Center)**, an eye clinic and optical store on Palkhed Road, Dindori, Nashik. It is a responsive single-page site in Marathi and English, built with React, Vite, Tailwind CSS v4, Framer Motion and Lucide icons.

## Folders

The project has two separate parts that run, install and deploy independently:

| Folder | What it is | Runs on |
|---|---|---|
| `frontend/` | The website (React + Vite) | http://localhost:5173 |
| `backend/` | The API (Express + MongoDB): saves appointments, admin login | http://localhost:5000 |

Requires Node.js 22.9 or newer.

## Run it locally

First time only:

```bash
cd frontend && npm install
cd ../backend && npm install
cp .env.example .env     # then fill in MongoDB URI, admin login, SESSION_SECRET
```

Then use two terminals:

```bash
# Terminal 1: backend
cd backend
npm run dev          # restarts automatically when server.js changes

# Terminal 2: website
cd frontend
npm run dev          # open http://localhost:5173 (calls to /api are passed to the backend)
```

## Deploy

- **Backend:** deploy `backend/` to a Node host (Render, Railway, a VPS). Start command: `npm start`. Put every variable from `backend/.env` in the host's environment settings, and set `CORS_ORIGIN` to the website's real address (for example `https://purvaeyecare.in`). In **MongoDB Atlas → Network Access**, allow the host's IP.
- **Frontend:** deploy `frontend/` to any static host (Netlify, Vercel, cPanel). Build command `npm run build`, output folder `dist`. Set `VITE_API_URL` to the backend's address (for example `https://purva-eye-care-api.onrender.com`) **before** building.

### WhatsApp and the database are independent

- Booking always opens WhatsApp first, straight from the browser, without waiting for the backend.
- The database copy is sent in the background with an 8-second timeout. If the server or MongoDB is down, the request is kept in the patient's browser and sent again on their next visit or when they come back online. Each request carries an ID, so retries never create duplicates.
- The backend itself keeps running when MongoDB is unreachable. It retries the connection every 30 seconds; meanwhile admin login works and database routes answer `503`. `GET /api/health` reports `{ ok, db }`, and the admin panel shows a banner while the database is offline.

## Admin panel

A small **"Admin login"** button (lock icon) sits just above the dark-blue footer, on the right. It opens a login; after signing in the clinic sees:

- counts of **total / today / pending / confirmed** appointment requests, with search by name or phone,
- each request (name, phone, preferred date and time, reason, notes, when it was received),
- **Confirm on WhatsApp**: opens WhatsApp to the patient with a ready confirmation message in the language they booked in (date, time, address, map link) and marks the request confirmed in the database.
- **Ratings** tab: patient reviews from the website. New reviews stay hidden until you **Approve & show** them; you can also hide or delete them. Only approved reviews and their average appear on the site. **Add feedback received from a patient** lets the clinic enter genuine feedback given on WhatsApp, by phone, in person or on Google (with the patient's permission); it is shown with its source.

Opening the backend's own address (e.g. http://localhost:5000) shows a status page: database status, appointment/review counts and the list of API endpoints. Patient details are only in the admin panel.

The admin username and password live in `backend/.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) and are checked by the backend; they never appear in the website code. Login lasts 12 hours per browser tab, and repeated wrong passwords are blocked for 15 minutes.

**Never commit `.env`.** It is listed in `.gitignore`.

## Project structure

```
frontend/
  index.html         title, meta description, Open Graph, JSON-LD (local SEO)
  vite.config.js     dev proxy: /api -> http://localhost:5000
  .env.example       VITE_API_URL (backend address for production builds)
  public/
    favicon.svg      vector site icon redrawn from the clinic logo (source for all icons below)
    favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest
    images/          optimized clinic photos, logo, og-image.jpg for social previews
  src/
    components/      Navbar, Hero, About, Services, OpticalStore, WhyChooseUs, EyeCareTips,
                     AppointmentForm, FAQ, Contact, ShareClinic, Footer, MobileActionBar, AdminButton,
                     ServiceArea (nearby villages, for local search), Reviews (ratings)
    admin/           admin panel (lazy-loaded) and its API client
    data/
      clinic.js      phone numbers, address, WhatsApp number, map links, hours
      services.js    the 8 services from the signboard
      content.js     all Marathi/English text
    i18n/            language context (Marathi default, choice saved in localStorage)
    lib/
      api.js         backend address (VITE_API_URL)
      booking.js     appointment validation, WhatsApp message, background save + retry queue
      reviews.js     load approved reviews, submit a rating
      share.js       WhatsApp share text and "Save contact" card
    App.jsx, main.jsx, index.css (theme colors and fonts)
backend/
  server.js          Express API: save appointment, admin login, list, confirm
  .env / .env.example  secrets (git-ignored) / template
source-photos/       original WhatsApp photos from the client (not served)
```

## Editing content

- **Contact details, hours and WhatsApp number:** edit `frontend/src/data/clinic.js`.
- **Services:** edit `frontend/src/data/services.js`.
- **Any other text, in either language:** edit `frontend/src/data/content.js`.

## Helping a clinic off the main road get found

- **Hero landmark line** and a **"How to find us"** box (landmarks, PIN code, call-for-directions) in Contact.
- **Exact map pin** from the GPS photo (20.245862, 73.848773), also in the JSON-LD `geo` field.
- **Share with family** (WhatsApp share of clinic details + map link) and **Save contact** (downloads a `.vcf` card).
- **Eye-care tips** and **FAQ** sections: useful content in Marathi and English that also helps search ranking. The FAQ outputs `FAQPage` structured data.
- **Google review button:** hidden until `googleReviewUrl` in `clinic.js` is set.

Beyond the website, the biggest wins are offline/Google: create and verify a **Google Business Profile** at the same pin, ask satisfied patients for genuine reviews, put the website link and a QR code on the board and visiting card, and share the site on WhatsApp status.

## Appointment booking

The form checks the name, a 10-digit Indian mobile number, a date (today or later), a time slot and a reason. When the patient submits, the site opens WhatsApp with a ready-made message to the clinic and, in the background, saves the request to MongoDB (status `pending`) so it appears in the admin panel. The page tells the patient warmly that the clinic will reply on WhatsApp to fix their time. The server re-validates every field.

## Before publishing: confirm with the client

- [ ] **WhatsApp:** check that 96899 48286 has WhatsApp. If not, change `whatsappNumber` in `clinic.js`.
- [ ] **Map pin:** the coordinates come from a GPS-camera photo of an eye exam. Confirm it was taken inside this clinic.
- [ ] **Patient photo consent:** `eye-exam-in-progress.jpg` (About section) shows a patient's face. Get the patient's written consent before publishing, or replace the photo.
- [ ] **Google review link:** paste it into `googleReviewUrl` once the Google Business Profile exists.
- [ ] **Developer credit:** the footer shows "Harshad Khatale" in English in both languages. Change `footer.developer` in `content.js` to add a Marathi spelling.
- [ ] **Opening hours:** add them to `clinic.hours` once supplied. Until then, the site asks visitors to call ahead.
- [ ] **Name spelling:** the signboard and card spell the name **पुर्वा**, so the site uses that. The brief had **पूर्वा**. Ask which spelling the client wants.
- [ ] **Pterygium service:** the board reads **"लासुर तपासणी व शस्त्रक्रिया"**. The brief had "लॅसर", which looks like a misreading. The site uses "लासूर".
- [x] **Cataract surgery:** confirmed by the client (11 Oct 2026): "मोतीबिंदू तपासणी व शस्त्रक्रिया", MICS Phaco, and free cataract surgery for economically weaker patients. Pterygium and LASIK are still worded as examination / guidance.
- [ ] **Free surgery eligibility:** the site says "call for eligibility". Add the actual criteria if the client wants them shown.
- [ ] **Optical store:** the site says "स्वस्त दरात" (affordable rates) and wholesale, as the client wrote. It lists no brands or prices.
- [ ] **Domain:** once it is known, add `<link rel="canonical">` and `og:url` to `index.html`, and make `og:image` an absolute URL.
- [ ] **Photos:** the gallery uses cropped phone photos of the clinic's display. Better-quality photos can be dropped into `public/images/` under the same names.

## Getting found in local search

The site has local-search basics: structured data (`Optician` + `MedicalClinic`, address, map coordinates, nearby areas, services), Marathi and English keywords, the "Near you" section naming nearby villages, FAQ structured data, and `robots.txt`. Once the domain is live:

1. Add `<link rel="canonical">` in `index.html` and a `Sitemap:` line in `public/robots.txt`.
2. Claim and verify the clinic's **Google Business Profile** (category "Eye care center" / "Optician"), add the website link, photos and opening hours. This matters most for "near me" searches on Google Maps.
3. Submit the site in **Google Search Console**.
4. Paste the Business Profile's review link into `googleReviewUrl` in `frontend/src/data/clinic.js` to show "Rate us on Google" buttons.
