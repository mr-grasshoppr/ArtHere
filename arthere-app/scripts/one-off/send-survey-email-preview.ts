// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

// One-off: send a rendered preview of the survey thank-you email.
//   npx tsx --env-file=.env.local scripts/one-off/send-survey-email-preview.ts <to>
import React from 'react';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { SurveyThankYouEmail } from '../../src/emails/SurveyThankYouEmail';

const to = process.argv[2];
if (!to) throw new Error('Usage: send-survey-email-preview.ts <recipient>');

async function main() {
  const element = React.createElement(SurveyThankYouEmail);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to,
    subject: '[Preview] Thank you for completing the PDX Community Survey!',
    html,
    text,
  });

  if (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
  console.log('SENT:', data?.id);
}

main();