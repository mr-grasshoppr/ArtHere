/**
 * The four "Join Us" audiences. Each gets its own page at /join/<slug> (see
 * app/join/[audience]) with copy, a "what to expect" list and a form whose
 * fields suit who's asking. Submissions go through /api/contact, tagged with
 * `intent` so the admin inbox and notification emails keep their subjects.
 */

export type JoinField = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  /** Sent as its own /api/contact field instead of a line in the message. */
  maps?: 'name' | 'email' | 'social' | 'affiliations';
};

export type JoinAudience = {
  slug: string;
  /** /api/contact intent key, also what the old /contact?type= links used. */
  intent: 'featured' | 'place' | 'partner' | 'bring';
  audience: string;
  title: string;
  intro: string;
  expect: string[];
  fields: JoinField[];
  /** Optional pick-any list of services the audience can ask about (chips on the form). */
  services?: { label: string; options: string[] };
  messageLabel: string;
  messageHint: string;
  messagePlaceholder: string;
  submitLabel: string;
  sent: string;
};

export const JOIN_AUDIENCES: JoinAudience[] = [
  {
    slug: 'artists',
    intent: 'featured',
    audience: 'Artists',
    title: 'Get featured',
    intro:
      'Art Here puts local artists on the map. Your profile, your work and the places that show it, in a public directory. It’s free for artists, always.',
    expect: [
      'Tell us a little about you and your work.',
      'We review it and reach out by email with an invite link.',
      'You build your own profile: photos, bio, links, and the places you’re connected to.',
      'Your page goes live in the directory and on the map.',
    ],
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'Jane Smith', maps: 'name' },
      { id: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', maps: 'email' },
      { id: 'social', label: 'Portfolio link', type: 'text', placeholder: 'https://yoursite.com or @yourhandle', maps: 'social', hint: 'Helps us see your work.' },
      { id: 'medium', label: 'What kind of art do you make?', type: 'text', required: true, placeholder: 'Painting, ceramics, printmaking…' },
      { id: 'neighborhood', label: 'Where are you based (zipcode)?', type: 'text', required: true, placeholder: '97217' },
      {
        id: 'affiliations',
        label: 'Local affiliations',
        type: 'textarea',
        placeholder: 'Multnomah Arts Center, Maplewood Coffee and Tea, Ford Gallery',
        hint: 'Optional. Galleries, studios, collectives, shops or organizations where you’re involved.',
        maps: 'affiliations',
      },
    ],
    messageLabel: 'Anything else we should know?',
    messageHint: 'Optional.',
    messagePlaceholder: 'Tell us about your practice, upcoming shows, or how you heard about us.',
    submitLabel: 'Send',
    sent: 'Thanks! We’ll review your details and be in touch soon.',
  },
  {
    slug: 'places',
    intent: 'place',
    audience: 'Places',
    title: 'Showcase your space',
    intro:
      'Galleries, studios, cafés, shops and community spaces are where local art gets seen. Get your place on Art Here and connect it to the artists you show and support.',
    expect: [
      'Tell us about your space.',
      'We review it and email you a link to set up your place’s page.',
      'You add photos, a description, hours and the artists you work with.',
      'Post your events so they show up on the city’s events page.',
    ],
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'Jane Smith', maps: 'name' },
      { id: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', maps: 'email' },
      { id: 'place', label: 'Name of your place', type: 'text', required: true, placeholder: 'Alberta Street Gallery' },
      { id: 'social', label: 'Website or Instagram', type: 'text', placeholder: 'https://yourplace.com or @yourhandle', maps: 'social', hint: 'Optional.' },
      { id: 'address', label: 'Address or neighborhood', type: 'text', placeholder: '123 NE Alberta St, Portland' },
      {
        id: 'kind',
        label: 'What kind of place is it?',
        type: 'select',
        options: ['Gallery', 'Studio or maker space', 'Café, restaurant or bar', 'Shop', 'Community arts center', 'Library, school or university', 'Other'],
      },
    ],
    messageLabel: 'Tell us about the art at your place',
    messageHint: 'Optional.',
    messagePlaceholder: 'Artists you show, events you host, what you’d like to get out of Art Here.',
    submitLabel: 'Send',
    sent: 'Thanks! We’ll look over your place and be in touch soon.',
  },
  {
    slug: 'organizations',
    intent: 'partner',
    audience: 'Partners',
    title: 'Collaborate with us',
    intro:
      'Art Here works with arts councils, nonprofits, businesses, community leaders, artists and neighbors. We can tell your story, co-host events with you, share your happenings and calls for art, and collaborate with you on a grant proposal.',
    expect: [
      'Tell us about you or your organization and which services interest you.',
      'We’ll reply by email to set up a short conversation.',
      'Together we decide what a partnership looks like: stories, events, calls for art or a grant proposal.',
    ],
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'Jane Smith', maps: 'name' },
      { id: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', maps: 'email' },
      { id: 'organization', label: 'Organization or project', type: 'text', required: true, placeholder: 'Name of your organization, business or project' },
      { id: 'social', label: 'Website', type: 'text', placeholder: 'https://yourorg.org', maps: 'social', hint: 'Optional.' },
      {
        id: 'kind',
        label: 'Who are you?',
        type: 'select',
        options: ['Arts council or agency', 'Nonprofit', 'Business or chamber', 'Government', 'School or university', 'Foundation or funder', 'Individual or collective', 'Other'],
      },
    ],
    services: {
      label: 'Which services interest you?',
      options: [
        'Storytelling',
        'Co-hosting events',
        'Sharing happenings and calls for art',
        'Collaborating on a grant proposal',
      ],
    },
    messageLabel: 'Tell us more about what you have in mind',
    messageHint: 'Optional.',
    messagePlaceholder: 'An event, a neighborhood project, a funding deadline, shared audiences…',
    submitLabel: 'Send',
    sent: 'Thanks! We’ll be in touch to set up a conversation.',
  },
  {
    slug: 'cities',
    intent: 'bring',
    audience: 'Cities & Neighborhoods',
    title: 'Invite Art Here',
    intro:
      'Art Here launched in Portland and is growing. If you’d like your city or neighborhood on the map, tell us where, and who’s ready to help.',
    expect: [
      'Tell us about your city or neighborhood.',
      'We’ll email you to learn about the local arts scene and who’s involved.',
      'If it’s a fit, we plan a launch with local partners and a first round of artists.',
    ],
    fields: [
      { id: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'Jane Smith', maps: 'name' },
      { id: 'email', label: 'Your email', type: 'email', required: true, placeholder: 'you@example.com', maps: 'email' },
      { id: 'where', label: 'City or neighborhood', type: 'text', required: true, placeholder: 'Where should Art Here go next?' },
      { id: 'group', label: 'Organization or group', type: 'text', placeholder: 'If you’re part of one', hint: 'Optional.' },
      { id: 'social', label: 'Website or social media', type: 'text', placeholder: 'https://…', maps: 'social', hint: 'Optional.' },
    ],
    messageLabel: 'Why would Art Here be a good fit?',
    messageHint: 'Optional.',
    messagePlaceholder: 'The arts scene there, people who’d help, what you’d like to see.',
    submitLabel: 'Send',
    sent: 'Thanks! We’ll be in touch about bringing Art Here to you.',
  },
];

export function getJoinAudience(slug: string): JoinAudience | undefined {
  return JOIN_AUDIENCES.find(a => a.slug === slug);
}

/** Old /contact?type=<intent> links → their /join page. */
export function joinSlugForIntent(intent: string | undefined): string | undefined {
  return JOIN_AUDIENCES.find(a => a.intent === intent)?.slug;
}
