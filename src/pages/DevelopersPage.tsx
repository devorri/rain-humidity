import { APP_NAME } from '../lib/types'

type Member = { name: string; role: string; photo?: string }

const members: Member[] = [
  { name: 'Dela Cruz, Danaya', role: 'Leader', photo: '/members/delacruz-danaya.jpg' },
  { name: 'Gojo Cruz, John Paul E.', role: 'Assistant Leader', photo: '/members/gojocruz-johnpaul.jpg' },
  { name: 'Abo-abo, Princess Bhlez', role: 'Member', photo: '/members/aboabo-princess.jpg' },
  { name: 'Caber, Jake Bryan', role: 'Member', photo: '/members/caber-jake.jpg' },
  { name: 'Cabrillos, Matt Eivan John', role: 'Member', photo: '/members/cabrillos-matt.jpg' },
  { name: 'Gumapas, Aldriel G.', role: 'Member', photo: '/members/gumapas-aldriel.jpg' },
  { name: 'Indig, Trisha Mae R.', role: 'Member', photo: '/members/indig-trisha.jpg' },
  { name: 'Pertez, Prince Lorenze', role: 'Member', photo: '/members/pertez-prince.jpg' },
  { name: 'Rollon, Rhadjie', role: 'Member', photo: '/members/rollon-rhadjie.jpg' },
  { name: 'Tolentino, Pia Cathlyn', role: 'Member', photo: '/members/tolentino-pia.jpg' },
]

/** "Dela Cruz, Danaya" -> "DD" (first name + last name initials fallback) */
function initials(name: string) {
  const [last = '', first = ''] = name.split(',').map((s) => s.trim())
  const a = first.charAt(0) || last.charAt(0)
  const b = last.charAt(0)
  return `${a}${first ? b : ''}`.toUpperCase()
}

function MemberCard({ m, lead }: { m: Member; lead?: boolean }) {
  return (
    <div className={`dev-card ${lead ? 'lead' : ''}`}>
      {m.photo ? (
        <img
          src={m.photo}
          alt={m.name}
          className="dev-photo"
          onError={(e) => {
            // fallback if image fails to load
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="dev-photo dev-initials">{initials(m.name)}</div>
      )}
      <h3>{m.name}</h3>
      <span className="dev-role">{m.role}</span>
    </div>
  )
}

export default function DevelopersPage() {
  const leaders = members.filter((m) => m.role !== 'Member')
  const rest = members.filter((m) => m.role === 'Member')

  return (
    <>
      <section className="glass-section page-intro">
        <div className="dev-org-logos">
          <img src="/school-logo.png" alt="School Logo" className="org-badge-logo" title="School" />
          <img src="/logo.png" alt={APP_NAME} className="org-badge-logo" title={APP_NAME} />
          <img src="/strand-logo.png" alt="Strand Logo" className="org-badge-logo" title="Strand" />
        </div>
        <span className="eyebrow dark">The Team</span>
        <h1>Developers</h1>
        <p className="lede">The researchers and developers behind the {APP_NAME} project.</p>
      </section>

      <section className="glass-section">
        <h2>Project Leaders</h2>
        <div className="dev-grid leaders">
          {leaders.map((m) => (
            <MemberCard key={m.name} m={m} lead />
          ))}
        </div>
      </section>

      <section className="glass-section">
        <h2>Members</h2>
        <div className="dev-grid">
          {rest.map((m) => (
            <MemberCard key={m.name} m={m} />
          ))}
        </div>
      </section>
    </>
  )
}
