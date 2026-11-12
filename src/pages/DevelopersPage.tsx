import { APP_NAME } from '../lib/types'

// To add a photo: put the image in /public (e.g. /public/members/delacruz.jpg)
// and set photo: '/members/delacruz.jpg'
type Member = { name: string; role: string; photo?: string }

const members: Member[] = [
  { name: 'Dela Cruz, Danaya', role: 'Leader' },
  { name: 'Gojo Cruz, John Paul E.', role: 'Assistant Leader' },
  { name: 'Abo-abo, Princess Bhlez', role: 'Member' },
  { name: 'Caber, Jake Bryan', role: 'Member' },
  { name: 'Cabrillos, Matt Eivan John', role: 'Member' },
  { name: 'Gumapas, Aldriel G.', role: 'Member' },
  { name: 'Indig, Trisha Mae R.', role: 'Member' },
  { name: 'Pertez, Prince Lorenze', role: 'Member' },
  { name: 'Rollon, Rhadjie', role: 'Member' },
  { name: 'Tolentino, Pia Cathlyn', role: 'Member' },
]

/** "Dela Cruz, Danaya" -> "DD" (first name + last name initials) */
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
        <img src={m.photo} alt={m.name} className="dev-photo" />
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
        <span className="eyebrow dark">The Team</span>
        <h1>Developers</h1>
        <p className="lede">The members behind the {APP_NAME} project.</p>
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
