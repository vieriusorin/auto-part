'use client'

import { useParams, useSearchParams } from 'next/navigation'

const ReportViewerPage = () => {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const generatedAt = searchParams.get('generatedAt')

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '0 auto', maxWidth: 720, padding: 24 }}>
      <h1>Maintenance report</h1>
      <p>This is a read-only maintenance report view intended for shared report links.</p>
      <dl style={{ display: 'grid', gap: 8, gridTemplateColumns: 'max-content 1fr' }}>
        <dt>Vehicle</dt>
        <dd>{params.id}</dd>
        <dt>Generated</dt>
        <dd>{generatedAt ?? 'unknown'}</dd>
      </dl>
      <section style={{ marginTop: 24 }}>
        <h2>Summary</h2>
        <ul>
          <li>Timeline evidence is available from authenticated vehicle document endpoints.</li>
          <li>Reminder and action feed urgency are computed server-side.</li>
          <li>Forecast currently uses deterministic rule-based estimates.</li>
        </ul>
      </section>
    </main>
  )
}

export default ReportViewerPage
