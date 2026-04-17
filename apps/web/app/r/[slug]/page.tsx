type PageProps = {
  params: {
    slug: string
  }
}

export default function PublicReportPage({ params }: PageProps) {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>AutoCare Verified Report</h1>
      <p>Report slug: {params.slug}</p>
      <p>Status: verified</p>
      <p>Timeline, photos, and hash verification will render here.</p>
    </main>
  )
}
