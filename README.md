# Purva Eye Care Center: Website

This is the website for **पुर्वा आय केअर सेंटर (Purva Eye Care Center)**, an eye clinic and optical store on Palkhed Road, Dindori, Nashik. It is a responsive single-page site in Marathi and English, built with React, Vite, Tailwind CSS v4, Framer Motion and Lucide icons.

## Setup

Requires Node.js 18 or newer.

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

Deploy by uploading the `dist/` folder to any static host, such as Netlify, Vercel, GitHub Pages or cPanel.

## Project structure

```
public/
  favicon.svg        vector site icon redrawn from the clinic logo (source for all icons below)
  favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest
  images/            optimized photos from the clinic (board, slit lamp, optical display),
                     logo cut from the visiting card, og-image.jpg for social previews
source-photos/       original WhatsApp photos from the client (not served; kept to re-crop or re-export)
src/
  components/        Navbar, Hero, About, Services, OpticalStore, WhyChooseUs,
                     AppointmentForm, Contact, Footer, MobileActionBar (+ Logo, Reveal, SectionHeading)
  data/
    clinic.js        phone numbers, address, WhatsApp number, map links, hours
    services.js      the 8 services from the signboard
    content.js       all Marathi/English UI text
  i18n/              language context (Marathi default, choice saved in localStorage)
  lib/booking.js     appointment validation + WhatsApp message builder
  App.jsx, main.jsx, index.css (theme colors and fonts)
index.html           title, meta description, Open Graph, JSON-LD (local SEO)
```

## Editing content

- **Contact details, hours and WhatsApp number:** edit `src/data/clinic.js`.
- **Services:** edit `src/data/services.js`.
- **Any other text, in either language:** edit `src/data/content.js`.

## Helping a clinic off the main road get found

- **Hero landmark line** and a **"How to find us"** box (landmarks, PIN code, call-for-directions) in Contact.
- **Exact map pin** from the GPS photo (20.245862, 73.848773), also in the JSON-LD `geo` field.
- **Share with family** (WhatsApp share of clinic details + map link) and **Save contact** (downloads a `.vcf` card).
- **Eye-care tips** and **FAQ** sections: useful content in Marathi and English that also helps search ranking. The FAQ outputs `FAQPage` structured data.
- **Google review button:** hidden until `googleReviewUrl` in `clinic.js` is set.

Beyond the website, the biggest wins are offline/Google: create and verify a **Google Business Profile** at the same pin, ask satisfied patients for genuine reviews, put the website link and a QR code on the board and visiting card, and share the site on WhatsApp status.

## Appointment booking

The form checks the name, a 10-digit Indian mobile number, a date (today or later), a time slot and a reason. When the patient submits, the site opens WhatsApp with a ready-made message addressed to the clinic. The page also tells the patient that the appointment is only confirmed after the clinic replies.

To move to a backend later, replace the body of `submitAppointment()` in `src/lib/booking.js` with an API call. The form component does not need to change.

## Before publishing: confirm with the client

- [ ] **WhatsApp:** check that 96899 48286 has WhatsApp. If not, change `whatsappNumber` in `clinic.js`.
- [ ] **Map pin:** the coordinates come from a GPS-camera photo of an eye exam. Confirm it was taken inside this clinic.
- [ ] **Patient photo consent:** `eye-exam-in-progress.jpg` (About section) shows a patient's face. Get the patient's written consent before publishing, or replace the photo.
- [ ] **Google review link:** paste it into `googleReviewUrl` once the Google Business Profile exists.
- [ ] **Developer credit:** the footer shows "Harshad Khatale" in English in both languages. Change `footer.developer` in `content.js` to add a Marathi spelling.
- [ ] **Opening hours:** add them to `clinic.hours` once supplied. Until then, the site asks visitors to call ahead.
- [ ] **Name spelling:** the signboard and card spell the name **पुर्वा**, so the site uses that. The brief had **पूर्वा**. Ask which spelling the client wants.
- [ ] **Pterygium service:** the board reads **"लासुर तपासणी व शस्त्रक्रिया"**. The brief had "लॅसर", which looks like a misreading. The site uses "लासूर".
- [ ] **Surgery wording:** cataract and pterygium are worded as *examination and surgical guidance*. Change this only if the client confirms that surgery is done on-site.
- [ ] **Optical store:** confirm the product range and that wholesale is available. The site lists no brands or prices.
- [ ] **Domain:** once it is known, add `<link rel="canonical">` and `og:url` to `index.html`, and make `og:image` an absolute URL.
- [ ] **Photos:** the gallery uses cropped phone photos of the clinic's display. Better-quality photos can be dropped into `public/images/` under the same names.
