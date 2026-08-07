import { render } from "@react-email/components";
import type { ReactElement } from "react";

// Render an email component to HTML + plaintext ourselves rather than
// handing Resend the `react` prop — Resend v6 dynamically imports
// `@react-email/render` at send time, which isn't resolvable in our bundle
// and throws "Failed to render React component". Rendering here with the
// installed `@react-email/components` sidesteps that entirely.
export async function renderEmail(element: ReactElement): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
