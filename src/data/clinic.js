// Single source of truth for clinic details.
// Everything here is taken from the clinic signboard and visiting card.
// Items marked VERIFY must be confirmed with the client before publishing.

const address = {
  mr: 'ए/३, सौभाग्य आर्केड, पालखेड रोड, समर्थ फर्टिलायझर शेजारी, दिंडोरी, जि. नाशिक, महाराष्ट्र',
  en: 'A/3, Saubhagya Arcade, Palkhed Road, near Samarth Fertilizer, Dindori, District Nashik, Maharashtra, India',
}

// Coordinates from the GPS-camera photo taken in the clinic's examination room
// (Dindori 422202), used for both the map embed and the directions link.
// VERIFY: confirm with the client that this photo was taken at the clinic.
const mapQuery = '20.245862,73.848773'

export const clinic = {
  name: {
    // Spelling follows the clinic's own signboard and visiting card.
    mr: 'पुर्वा आय केअर सेंटर',
    en: 'Purva Eye Care Center',
  },
  tagline: { mr: 'डोळ्यांचा दवाखाना', en: 'Eye Clinic' },
  motto: { mr: 'एक पाऊल दृष्टीसाठी', en: 'A step towards better vision' },

  optometrist: {
    name: 'Thore S. G.',
    qualification: 'D.Opt., Nashik',
    role: { mr: 'कन्सल्टंट ऑप्टोमेट्रिस्ट', en: 'Consultant Optometrist' },
    affiliation: 'PMEC Arvind Eye Care Sys.',
  },

  phones: [
    { display: '96899 48286', tel: '+919689948286' },
    { display: '70202 80517', tel: '+917020280517' },
  ],

  // VERIFY: confirm this number is WhatsApp-enabled before publishing.
  whatsappNumber: '919689948286',

  address,
  postalCode: '422202',
  coordinates: mapQuery,

  // Paste the clinic's Google Business "Ask for reviews" link here to show a review button.
  googleReviewUrl: null,

  mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`,

  // VERIFY: set opening hours once the client supplies them, e.g.
  // { mr: 'सोम–शनि, सकाळी १० ते संध्या. ७', en: 'Mon–Sat, 10 AM – 7 PM' }
  hours: null,
}

export const telLink = (phone = clinic.phones[0]) => `tel:${phone.tel}`

export const whatsappLink = (message = '') =>
  `https://wa.me/${clinic.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`
