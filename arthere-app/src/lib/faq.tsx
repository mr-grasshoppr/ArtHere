import type { ReactNode } from 'react';
import Link from 'next/link';

export const INSTAGRAM_URL = 'https://www.instagram.com/arthereproject';

export interface FaqItem {
  id: string;
  q: string;
  /** Rendered answer. */
  a: ReactNode;
  /** Plain-text answer, for FAQPage structured data. */
  text: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

const linkCls = 'underline underline-offset-[3px] decoration-[#bbb] hover:opacity-60 transition-opacity';

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1">{children}</ul>;
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'About Art Here',
    items: [
      {
        id: 'what-is-art-here',
        q: 'What is Art Here?',
        text: 'Art Here is a community initiative that helps people discover the artists down the street. We celebrate local artists, highlight the places and businesses that support them, and map how it all connects.',
        a: <p>Art Here is a community initiative that helps people discover the artists down the street. We celebrate local artists, highlight the places and businesses that support them, and map how it all connects.</p>,
      },
      {
        id: 'why-art-here-why-now',
        q: 'Why Art Here? Why now?',
        text: 'We live in a time of economic disruption that is hitting artists and creatives especially hard. Art Here helps build tighter communities around artists and opens new economic opportunities by connecting them with the people, places, and businesses nearby.',
        a: <p>We live in a time of economic disruption that is hitting artists and creatives especially hard. Art Here helps build tighter communities around artists and opens new economic opportunities by connecting them with the people, places, and businesses nearby.</p>,
      },
      {
        id: 'how-is-this-different',
        q: 'How is this different from other artist directories?',
        text: 'Most directories are lists. Art Here is a map of relationships. We partner with local organizations, conduct community research, and share artists’ stories so that galleries, studios, and artists can find and support each other.',
        a: <p>Most directories are lists. Art Here is a map of relationships. We partner with local organizations, conduct community research, and share artists&rsquo; stories so that galleries, studios, and artists can find and support each other.</p>,
      },
      {
        id: 'what-is-the-network-map',
        q: 'What is the network map?',
        text: 'The Art Here network map shows how artists, places, and organizations in your community connect. Click on any artist or community place to learn more. Discover new art to love, places to visit, and artists to meet.',
        a: <p>The Art Here network map shows how artists, places, and organizations in your community connect. Click on any artist or community place to learn more. Discover new art to love, places to visit, and artists to meet.</p>,
      },
      {
        id: 'how-can-i-use-art-here',
        q: 'How can I use Art Here?',
        text: 'Discover artists who live and work near you. Find galleries, studios, and shops that support local artists. Buy work, take a class, or commission a piece.',
        a: (
          <List>
            <li>Discover artists who live and work near you</li>
            <li>Find galleries, studios, and shops that support local artists</li>
            <li>Buy work, take a class, or commission a piece</li>
          </List>
        ),
      },
      {
        id: 'how-else-can-i-support-local-artists',
        q: 'How else can I support local artists?',
        text: 'Visit the places you discover on Art Here. Take our survey to share your experiences with the arts in your area. Follow @arthereproject on Instagram. Share local art with #ArtHere.',
        a: (
          <List>
            <li>Visit the places you discover on Art Here</li>
            <li>
              <Link href="/survey?src=faq" className={linkCls}>Take our survey</Link> to share your experiences with the arts in your area
            </li>
            <li>
              Follow{' '}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={linkCls}>@arthereproject</a>{' '}
              on Instagram
            </li>
            <li>Share local art with #ArtHere</li>
          </List>
        ),
      },
    ],
  },
  {
    title: 'Our Story',
    items: [
      {
        id: 'where-is-art-here-happening',
        q: 'Where is Art Here happening?',
        text: 'Art Here launched in Portland, Oregon, at the Multnomah Days festival in August 2026. We’re now growing across the Portland area and beyond.',
        a: <p>Art Here launched in Portland, Oregon, at the Multnomah Days festival in August 2026. We&rsquo;re now growing across the Portland area and beyond.</p>,
      },
      {
        id: 'who-is-behind-art-here',
        q: 'Who is behind Art Here?',
        text: 'Art Here was created by Maryanna Rogers, PhD, a researcher and designer who lives in SW Portland. It’s built with help from local filmmakers, designers, urban planners, developers, and the artists and organizations who make up each community.',
        a: <p>Art Here was created by Maryanna Rogers, PhD, a researcher and designer who lives in SW Portland. It&rsquo;s built with help from local filmmakers, designers, urban planners, developers, and the artists and organizations who make up each community.</p>,
      },
      {
        id: 'who-supports-art-here',
        q: 'Who supports Art Here?',
        text: 'Art Here is independently funded and supported by community partners who help us reach artists and art lovers. As we grow, we’re working with cities, foundations, and businesses that share our commitment to local artists.',
        a: <p>Art Here is independently funded and supported by community partners who help us reach artists and art lovers. As we grow, we&rsquo;re working with cities, foundations, and businesses that share our commitment to local artists.</p>,
      },
    ],
  },
  {
    title: 'For Artists',
    items: [
      {
        id: 'how-can-i-join',
        q: 'How can I join as a featured artist?',
        text: 'We’d love to feature your work! Head to our Get Featured page to introduce yourself. Because we personally connect with every artist, we’re expanding the directory thoughtfully. We’ll be in touch when it’s time to set up your profile.',
        a: (
          <p>
            We&rsquo;d love to feature your work! Head to our{' '}
            <Link href="/contact?type=featured" className={linkCls}>Get Featured</Link>{' '}
            page to introduce yourself.
            Because we personally connect with every artist, we&rsquo;re expanding the directory thoughtfully.
            We&rsquo;ll be in touch when it&rsquo;s time to set up your profile.
          </p>
        ),
      },
      {
        id: 'does-it-cost-anything',
        q: 'Does it cost anything?',
        text: 'Art Here is free for artists, always. We’re here to help artists earn more, not pay more.',
        a: <p>Art Here is free for artists, always. We&rsquo;re here to help artists earn more, not pay more.</p>,
      },
      {
        id: 'who-owns-my-work',
        q: 'Who owns my work and profile?',
        text: 'You do. Your artwork, images, and stories belong to you. Art Here only publishes what you approve, and you can edit, update, or delete your profile anytime.',
        a: <p>You do. Your artwork, images, and stories belong to you. Art Here only publishes what you approve, and you can edit, update, or delete your profile anytime.</p>,
      },
      {
        id: 'how-do-i-update-my-profile',
        q: 'How do I update my profile?',
        text: 'Your profile is linked to your email address. Anytime you’d like to make a change, go to the My Art Here page and enter your email. We’ll send you a magic link, a one-time login link that takes you straight to your profile. No password to remember.',
        a: (
          <p>
            Your profile is linked to your email address. Anytime you&rsquo;d like to make a change, go to the{' '}
            <Link href="/my-art-here" className={linkCls}>My Art Here</Link>{' '}
            page and enter your email.
            We&rsquo;ll send you a magic link, a one-time login link that takes you straight to your profile.
            No password to remember.
          </p>
        ),
      },
    ],
  },
  {
    title: 'For Organizations and Cities',
    items: [
      {
        id: 'can-my-organization-be-listed',
        q: 'Can my organization or business be listed?',
        text: 'Yes! Art Here highlights the galleries, studios, shops, and venues that support local artists, so people can find you along with the artists you work with. Get in touch to learn more.',
        a: (
          <p>
            Yes! Art Here highlights the galleries, studios, shops, and venues that support local artists, so
            people can find you along with the artists you work with.{' '}
            <Link href="/contact?type=partner" className={linkCls}>Get in touch</Link>{' '}
            to learn more.
          </p>
        ),
      },
      {
        id: 'can-art-here-come-to-my-city',
        q: 'Can Art Here come to my city?',
        text: 'Interested in bringing Art Here to your community? We’d love to hear from cities and local organizations that want to celebrate and map their artist ecosystem.',
        a: (
          <p>
            Interested in bringing Art Here to your community? We&rsquo;d love to{' '}
            <Link href="/contact?type=bring" className={linkCls}>hear from</Link>{' '}
            cities and local organizations that want to celebrate and map their artist ecosystem.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Contact',
    items: [
      {
        id: 'how-do-i-get-in-touch',
        q: 'How do I get in touch?',
        text: 'Have questions? Feedback or ideas to share? Want to partner? We’re here for it all! hello@artishere.org',
        a: (
          <p>
            Have questions? Feedback or ideas to share? Want to partner? We&rsquo;re here for it all!{' '}
            <a href="mailto:hello@artishere.org" className={linkCls}>hello@artishere.org</a>
          </p>
        ),
      },
    ],
  },
];

/** Shown on the home page; each links to its full answer on /faq. */
export const TEASER_IDS = ['what-is-art-here', 'does-it-cost-anything', 'how-can-i-join'];

export function faqItem(id: string): FaqItem {
  for (const s of FAQ_SECTIONS) {
    const found = s.items.find(i => i.id === id);
    if (found) return found;
  }
  throw new Error(`Unknown FAQ id: ${id}`);
}
