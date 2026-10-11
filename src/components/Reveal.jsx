import { motion } from 'framer-motion'

// Subtle fade-up on scroll. MotionConfig in App disables it for reduced-motion users.
export default function Reveal({ as = 'div', delay = 0, className, children, ...rest }) {
  const Component = motion[as]
  return (
    <Component
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  )
}
