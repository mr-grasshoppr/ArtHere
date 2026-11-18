import styles from './HappeningsExplainer.module.css';

/**
 * "What we're building" band under the happenings list: what the happenings
 * tab is for, and a sample-data preview of the timeline on the map and the
 * network. One spacing unit throughout (see the CSS module).
 */
const PANELS = [
  {
    tag: 'Map',
    title: 'On the map',
    text: 'Slide the timeline and pins light up wherever something is on — today, this weekend, this month. Spot the neighborhoods that are buzzing and find what’s near you.',
    src: '/images/happenings-timeline-map.mp4',
    poster: '/images/happenings-preview-map.jpg',
    label: 'Sliding the happenings timeline on the Portland map: pins light up where something is on',
  },
  {
    tag: 'Network',
    title: 'In the network',
    text: 'The same timeline lights up the web of artists and places. Follow a thread from a show to the artists in it, and from them to the other places that show their work.',
    src: '/images/happenings-timeline-network.mp4',
    poster: '/images/happenings-preview-network.jpg',
    label: 'Sliding the happenings timeline on the network: artists and places with something on light up and connect',
  },
];

export function HappeningsExplainer() {
  return (
    <div className={styles.root}>
    <div className={styles.stripe} aria-hidden />
    <section className={styles.explainer} aria-labelledby="building-title">
      <div className={styles.wrap}>
        <header className={styles.head}>
          <div>
            <div className={styles.eyebrow}>What we&rsquo;re building</div>
            <h2 id="building-title" className={styles.title}>Get the 10k foot view of the local arts scene</h2>
          </div>
          <p className={styles.intro}>
            Happenings are the local art events, shows, workshops, and open studios in your area. Places that support
            local artists share what&rsquo;s happening, and we add it to the Art Here map and network graph, so art
            lovers can engage more in the local arts ecosystem.
          </p>
        </header>

        <div className={styles.panels}>
          {PANELS.map(p => (
            <figure key={p.tag} className={styles.panel}>
              <div className={styles.media}>
                <span className={styles.tag}>Sample data</span>
                <video src={p.src} poster={p.poster} aria-label={p.label} autoPlay muted loop playsInline preload="metadata" />
              </div>
              <figcaption className={styles.cap}>
                <h3 className={styles.capTitle}>{p.title}</h3>
                <p className={styles.capText}>{p.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className={styles.foot}>
          <span className={styles.dot} aria-hidden />
          <p>
            <strong>Note:</strong> The above animations use sample data to demonstrate this feature. Map and network
            will be live as partners onboard.
          </p>
        </div>
      </div>
    </section>
    </div>
  );
}
