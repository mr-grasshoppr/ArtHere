import { requireAdminPage } from "@/lib/admin";
import { getContacts, INTEREST_TAGS } from "@/lib/contact-tracking";
import ContactTracker from "./ContactTracker";

export const dynamic = "force-dynamic";

export default async function ContactTrackingPage() {
  await requireAdminPage();
  const contacts = await getContacts();

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Contact Tracking</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[720px]">
        Everyone who has expressed interest, from the survey, the website contact form, and
        newsletter signups, merged into one row per email address. This is a read-only view of
        those sources &mdash; the Survey and Contacts tabs are unaffected. Select people, write a
        message, and it goes out individually in the Art Here template; what you sent is recorded
        under each person&rsquo;s history.
      </p>
      <ContactTracker contacts={contacts} interestTags={INTEREST_TAGS} />
    </div>
  );
}
