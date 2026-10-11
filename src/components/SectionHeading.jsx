import Reveal from './Reveal'

export default function SectionHeading({ id, eyebrow, title, intro, align = 'center', dark = false }) {
  const centered = align === 'center'
  return (
    <Reveal className={`mb-10 max-w-2xl sm:mb-12 ${centered ? 'mx-auto text-center' : ''}`}>
      <p className={`mb-2 text-sm font-semibold tracking-wide uppercase ${dark ? 'text-teal-100' : 'text-teal-700'}`}>{eyebrow}</p>
      <h2 id={id} className={`text-2xl font-bold sm:text-3xl lg:text-[2.1rem] ${dark ? 'text-white' : ''}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-base sm:text-lg ${dark ? 'text-navy-100' : 'text-slate-600'}`}>{intro}</p>}
    </Reveal>
  )
}
