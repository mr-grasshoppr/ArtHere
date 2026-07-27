// SAFETY GUARD — one-off scripts here mutate production data/images and have
// caused data loss before (overwritten image originals, reverted DB content).
// They will NOT run without an explicit opt-in. See README.md in this folder.
if (process.env.RUN_ONE_OFF !== "1") {
  console.error("Refusing to run one-off script. Set RUN_ONE_OFF=1 to run intentionally, and make sure you understand what it overwrites.");
  process.exit(1);
}

// One-off: render the survey thank-you email to an HTML file for visual preview.
//   npx tsx scripts/one-off/render-survey-email.ts <out.html>
import { writeFileSync } from 'fs';
import React from 'react';
import { render } from '@react-email/components';
import { SurveyThankYouEmail } from '../../src/emails/SurveyThankYouEmail';

const out = process.argv[2];
if (!out) throw new Error('Usage: render-survey-email.ts <out.html>');

render(React.createElement(SurveyThankYouEmail)).then(html => {
  writeFileSync(out, html);
  console.log('WROTE:', out);
});