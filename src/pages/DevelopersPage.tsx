// Edit this list to put the real developer names, roles and photos.
// For a photo: put the image in /public (e.g. /public/dev1.jpg) and set photo: '/dev1.jpg'
type Developer = { name: string; role: string; photo?: string; email?: string }

const developers: Developer[] = [
  { name: 'Developer Name', role: 'Project Leader / Hardware' },
  { name: 'Developer Name', role: 'Web Developer' },
  { name: 'Developer Name', role: 'Database & Documentation' },
  { name: 'Developer Name', role: 'Research & Testing' },
]

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function DevelopersPage() {
  return (
    <>
      <section className="glass-section page-intro">
        <span className="eyebrow dark">The Team</span>
        <h1>Developers</h1>
        <p className="lede">The people who built the hardware, database and web dashboard for this project.</p>
      </section>

      <section className="glass-section">
        <div className="dev-grid">
          {developers.map((d, i) => (
            <div className="dev-card" key={i}>
              {d.photo ? (
                <img src={d.photo} alt={d.name} className="dev-photo" />
              ) : (
                <div className="dev-photo dev-initials">{initials(d.name)}</div>
              )}
              <h3>{d.name}</h3>
              <span className="dev-role">{d.role}</span>
              {d.email && (
                <a href={`mailto:${d.email}`} className="dev-email">
                  {d.email}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
