import type { Settings } from '@/lib/types';
import './footer.css';

interface FooterProps {
  settings: Settings;
}

/**
 * The only chrome on the page. At the document end, NOT sticky — full-bleed is the point.
 *
 * Two lines, both from `site.txt`. There is no lock icon here: the full edition puts one in
 * this corner because there is an admin layer behind it, and a lock on a static site would
 * be a button that opens nothing. An inert control is worse than no control.
 */
export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <span className="footer-copy">
        © {year} {settings.name}
      </span>
      <span className="footer-contact">{settings.contact}</span>
    </footer>
  );
}
