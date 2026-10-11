import { Suspense, lazy, useState } from 'react'
import { LockKeyhole } from 'lucide-react'

// The panel's code is only downloaded when the clinic clicks this button.
const AdminPanel = lazy(() => import('../admin/AdminPanel'))

// Small and neutral so it doesn't distract patients, but easy for the clinic to find.
export default function AdminButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="container-page flex justify-end pt-2 pb-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-600 transition-colors hover:border-navy-700 hover:text-navy-800"
        >
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Admin login
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <AdminPanel onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
