import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import CataractCare from './components/CataractCare'
import Services from './components/Services'
import OpticalStore from './components/OpticalStore'
import WhyChooseUs from './components/WhyChooseUs'
import EyeCareTips from './components/EyeCareTips'
import FAQ from './components/FAQ'
import ShareClinic from './components/ShareClinic'
import AppointmentForm from './components/AppointmentForm'
import Contact from './components/Contact'
import Footer from './components/Footer'
import AdminButton from './components/AdminButton'
import MobileActionBar from './components/MobileActionBar'
import Reviews from './components/Reviews'
import ServiceArea from './components/ServiceArea'
import { LanguageProvider } from './i18n/LanguageContext'
import { flushPendingAppointments } from './lib/booking'

export default function App() {
  // Wrapped in an object so choosing the same service twice still re-applies it.
  const [preselected, setPreselected] = useState(null)
  const selectReason = (id) => setPreselected({ id })

  // Bookings made while the backend was down are re-sent to the database when possible.
  useEffect(() => {
    flushPendingAppointments()
    window.addEventListener('online', flushPendingAppointments)
    return () => window.removeEventListener('online', flushPendingAppointments)
  }, [])

  return (
    <LanguageProvider>
      <MotionConfig reducedMotion="user">
        <Navbar />
        <main id="main">
          <Hero />
          <CataractCare onSelect={selectReason} />
          <About />
          <ServiceArea />
          <ShareClinic />
          <Services onSelect={selectReason} />
          <OpticalStore />
          <WhyChooseUs />
          <EyeCareTips onSelect={selectReason} />
          <Reviews />
          <AppointmentForm preselectedReason={preselected} />
          <FAQ />
          <Contact />
        </main>
        <AdminButton />
        <Footer />
        <MobileActionBar />
      </MotionConfig>
    </LanguageProvider>
  )
}
