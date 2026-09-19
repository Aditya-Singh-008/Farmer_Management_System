import { Link } from 'react-router-dom'

const highlights = [
  ['01', 'Know every field', 'Track crops, irrigation, soil health, and field activity from one calm workspace.'],
  ['02', 'Plan with confidence', 'Turn seasonal work into clear tasks, useful reports, and better decisions.'],
  ['03', 'Grow together', 'Keep your team, inventory, and marketplace operations moving in sync.'],
]

export default function Landing() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="brand-lockup" to="/" aria-label="Farmstead home">
          <span className="brand-mark">F</span>
          <span>Farmstead</span>
        </Link>
        <div className="landing-links">
          <a href="#approach">Approach</a>
          <a href="#features">Features</a>
          <Link to="/login">Sign in</Link>
        </div>
        <Link className="landing-nav-cta" to="/signup">Start managing</Link>
      </nav>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-rule" /> Built for the people who grow our future</p>
          <h1 id="landing-title">Make your farm<br /><em>work smarter.</em></h1>
          <p className="hero-description">Farmstead brings your fields, crops, inventory, and team into one living picture—so you can spend less time chasing updates and more time growing what matters.</p>
          <div className="hero-actions">
            <Link className="landing-primary" to="/signup">Create your workspace <span aria-hidden="true">↗</span></Link>
            <a className="landing-secondary" href="#approach">See how it works <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-art" aria-label="Aerial view of organized farm fields" role="img">
          <div className="field field-one" /><div className="field field-two" /><div className="field field-three" /><div className="field field-four" />
          <div className="hero-art-label"><span>FIELD NOTE 01</span><strong>More clarity<br />in every season.</strong></div>
          <span className="hero-coordinate">34° 03′ 08″ N&nbsp;&nbsp; 118° 14′ 37″ W</span>
        </div>
      </section>

      <section className="landing-intro" id="approach">
        <p className="eyebrow">The modern farm office</p>
        <div className="intro-grid"><h2>Good work starts<br /><em>with a clear view.</em></h2><p>From the first planting plan to the last delivery, Farmstead keeps the details close and the bigger picture visible. Simple tools, thoughtfully connected.</p></div>
      </section>

      <section className="highlight-section" id="features" aria-label="Farmstead features">
        {highlights.map(([number, title, description]) => <article className="highlight-card" key={number}><span className="highlight-number">{number}</span><h3>{title}</h3><p>{description}</p><span className="highlight-arrow" aria-hidden="true">↗</span></article>)}
      </section>

      <section className="landing-cta"><div><p className="eyebrow">A better season starts here</p><h2>Put your farm<br /><em>in motion.</em></h2></div><Link className="landing-primary landing-primary-light" to="/signup">Get started today <span aria-hidden="true">↗</span></Link></section>
      <footer className="landing-footer"><span>Farmstead / Farm management, thoughtfully made.</span><span>© 2026 Farmstead</span></footer>
    </main>
  )
}
