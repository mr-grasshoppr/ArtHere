import styles from './AnimatedLogoMask.module.css';

// Renders the plain masked wordmark (solid fill — see .mask in the CSS
// module). Previously scrolled a specific artist's image behind the mark;
// pulled pending their confirmation before any artwork goes back behind it.

interface Props {
  /** Controls the rendered width; aspect ratio is always 1668/1457. */
  width?: string;
  className?: string;
}

export function AnimatedLogoMask({ width = 'min(60vw, 520px)', className = '' }: Props) {
  return <div className={`${styles.mask} ${className}`} style={{ width }} />;
}
