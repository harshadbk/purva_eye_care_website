import { Aperture, Baby, Eye, Focus, Gauge, Glasses, ScanEye, Target } from 'lucide-react'

// Services exactly as listed on the clinic signboard.
// Surgical items are worded as examination / guidance: the signage does not
// state that surgery is performed on-site. Confirm with the client before changing.
export const services = [
  {
    id: 'eye-exam',
    icon: ScanEye,
    title: { mr: 'सुसज्ज नेत्र तपासणी', en: 'Comprehensive Eye Examination' },
    desc: {
      mr: 'दृष्टी, चष्म्याचा नंबर आणि डोळ्यांच्या आरोग्याची सविस्तर तपासणी.',
      en: 'A thorough check of your vision, spectacle power and overall eye health.',
    },
  },
  {
    id: 'cataract',
    icon: Aperture,
    title: { mr: 'मोतीबिंदू तपासणी व शस्त्रक्रिया मार्गदर्शन', en: 'Cataract Examination & Surgical Guidance' },
    desc: {
      mr: 'मोतीबिंदूची तपासणी आणि शस्त्रक्रियेबाबत योग्य मार्गदर्शन व संदर्भ.',
      en: 'Cataract assessment with guidance and referral for surgery when needed.',
    },
  },
  {
    id: 'pterygium',
    icon: Focus,
    // VERIFY: signage reads "लासुर तपासणी व शस्त्रक्रिया" (pterygium).
    title: { mr: 'लासूर तपासणी व शस्त्रक्रिया मार्गदर्शन', en: 'Pterygium Examination & Surgical Guidance' },
    desc: {
      mr: 'डोळ्यावर वाढणाऱ्या पडद्याची (लासूर) तपासणी आणि उपचाराबाबत मार्गदर्शन.',
      en: 'Examination of pterygium (tissue growth on the eye) with treatment guidance.',
    },
  },
  {
    id: 'lasik',
    icon: Target,
    title: { mr: 'लॅसिक ऑपरेशनबाबत मार्गदर्शन', en: 'LASIK Surgery Guidance' },
    desc: {
      mr: 'चष्म्यापासून सुटका हवी असल्यास लॅसिकबाबत माहिती आणि योग्य सल्ला.',
      en: 'Information and advice if you are considering LASIK to reduce dependence on glasses.',
    },
  },
  {
    id: 'children',
    icon: Baby,
    title: { mr: 'लहान मुलांच्या डोळ्यांची तपासणी', en: "Children's Eye Examination" },
    desc: {
      mr: 'शाळकरी व लहान मुलांच्या दृष्टीची काळजीपूर्वक आणि सहज तपासणी.',
      en: 'Gentle, child-friendly vision checks for young and school-going children.',
    },
  },
  {
    id: 'squint',
    icon: Eye,
    title: { mr: 'तिरळेपणा तपासणी व उपचार', en: 'Squint Examination & Treatment' },
    desc: {
      mr: 'डोळ्यांच्या तिरळेपणाची तपासणी आणि योग्य उपचाराबाबत मार्गदर्शन.',
      en: 'Assessment of squint (misaligned eyes) and guidance on suitable treatment.',
    },
  },
  {
    id: 'glaucoma',
    icon: Gauge,
    title: { mr: 'काचबिंदू तपासणी व उपचार', en: 'Glaucoma Examination & Treatment' },
    desc: {
      mr: 'काचबिंदूची वेळेवर तपासणी — दृष्टी जपण्यासाठी महत्त्वाची.',
      en: 'Timely glaucoma screening, which is important for protecting long-term vision.',
    },
  },
  {
    id: 'spectacles',
    icon: Glasses,
    title: { mr: 'सर्व प्रकारचे नंबरचे चष्मे व गॉगल्स होलसेल', en: 'Prescription Spectacles & Goggles (Wholesale)' },
    desc: {
      mr: 'नंबरचे चष्मे, फ्रेम्स, लेन्स आणि गॉगल्स — होलसेलमध्येही उपलब्ध.',
      en: 'Prescription glasses, frames, lenses and goggles, also available wholesale.',
    },
  },
]
