// Artist invite message bodies — paragraphs separated by a blank line. Kept
// free of React/email imports so the admin invite-preview modal (a client
// component) can offer them as a picker without bundling the email template.

/** For artists we've pre-built a profile for from their website. */
export const ARTIST_DRAFT_PROFILE_BODY_TEXT =
  "Thanks for expressing interest in joining Art Here as a featured artist!" +
  "\n\nI created a draft profile from the content on your website to help you get started." +
  "\n\nYou are welcome to edit and adjust as you like, and you'll always be able to access it through your email address." +
  "\n\nSubmit when you're ready, and then your profile and artwork will appear live on Art Here alongside other Portland-area artists." +
  "\n\nWe're excited to have you!";

/** For artists who want to build their profile from a blank slate. */
export const ARTIST_FROM_SCRATCH_BODY_TEXT =
  "Thanks for expressing interest in joining Art Here as a featured artist!" +
  "\n\nYou can start creating your profile by clicking the button below, and you'll always be able to access it through your email address." +
  "\n\nSubmit when you're ready, and then your profile and artwork will appear live on Art Here alongside other Portland-area artists." +
  "\n\nWe're excited to share your work with the community!";

export const ARTIST_INVITE_TEMPLATES = [
  { label: "Draft profile", bodyText: ARTIST_DRAFT_PROFILE_BODY_TEXT },
  { label: "From scratch", bodyText: ARTIST_FROM_SCRATCH_BODY_TEXT },
];
