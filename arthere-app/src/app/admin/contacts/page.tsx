import { prisma } from "@/lib/db";

const INTENTS: Record<string, string> = {
  featured: "Get Featured",
  partner: "Partner",
  bring: "Bring Art Here",
  invite: "Request Invite",
};

export default async function AdminContactsPage() {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Contact Submissions</h1>
      <p className="text-sm text-[#888] mb-8">{submissions.length} total</p>

      {submissions.length === 0 ? (
        <p className="text-[#999] text-sm">No submissions yet.</p>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
          {submissions.map((s) => (
            <div key={s.id} className="px-6 py-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                <span className="font-medium text-[0.95rem]">{s.name}</span>
                <a
                  href={`mailto:${s.email}`}
                  className="text-[0.85rem] text-[#666] underline underline-offset-2 decoration-[#ccc] hover:text-[#1a1a1a]"
                >
                  {s.email}
                </a>
                {s.intent && (
                  <span className="text-[0.75rem] bg-[#f3f3f0] text-[#666] px-2.5 py-0.5 rounded-full font-medium">
                    {INTENTS[s.intent] ?? s.intent}
                  </span>
                )}
                <span className="ml-auto text-xs text-[#bbb]">
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {s.social && (
                <p className="text-[0.82rem] text-[#888] mb-1">
                  <span className="text-[#bbb]">Website/Social:</span>{" "}
                  {s.social}
                </p>
              )}
              {s.message && (
                <p className="text-[0.88rem] text-[#555] leading-[1.6] whitespace-pre-wrap mt-2">
                  {s.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
