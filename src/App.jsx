import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import OpticalStore from './components/OpticalStore'
import WhyChooseUs from './components/WhyChooseUs'
import EyeCareTips from './components/EyeCareTips'
import FAQ from './components/FAQ'
import ShareClinic from './components/ShareClinic'
import AppointmentForm from './components/AppointmentForm'
import Contact from './components/Contact'
import Footer from './components/Footer'
import MobileActionBar from './components/MobileActionBar'
import { LanguageProvider } from './i18n/LanguageContext'

export default function App() {
  // Wrapped in an object so choosing the same service twice still re-applies it.
  const [preselected, setPreselected] = useState(null)
  const selectReason = (id) => setPreselected({ id })

  return (
    <LanguageProvider>
      <MotionConfig reducedMotion="user">
        <Navbar />
        <main id="main">
          <Hero />
          <About />
          <Services onSelect={selectReason} />
          <OpticalStore />
          <WhyChooseUs />
          <EyeCareTips onSelect={selectReason} />
          <AppointmentForm preselectedReason={preselected} />
          <FAQ />
          <Contact />
          <ShareClinic />
        </main>
        <Footer />
        <MobileActionBar />
      </MotionConfig>
    </LanguageProvider>
  )
}
