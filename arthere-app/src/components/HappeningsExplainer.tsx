/**
 * "What's coming" band under the happenings list: what the happenings tab is
 * for, and a sample-data preview of the timeline on the map and the network.
 */
export function HappeningsExplainer() {
  const gif = 'rounded-xl border border-[#dedad4] bg-[#111] w-full h-auto block';
  return (
    <section className="bg-[#f7f6f3]">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
        <div className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-[#555]">What we&rsquo;re building</div>
        <h2 className="mt-3 font-display text-[2.4rem] sm:text-[3.2rem] leading-[0.95] tracking-[0.03em]">
          Get the 10k foot view of the local arts scene
        </h2>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] font-light leading-[1.8] text-[#444]">
          Happenings are the local art events, shows, workshops, and open studios in your area. Places that support
          local artists share what&rsquo;s happening, and we add it to the Art Here map and network graph, so art
          lovers can engage more in the local arts ecosystem.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/happenings-timeline-map.gif" alt="Sliding the happenings timeline on the Portland map: pins light up where something is on" className={gif} loading="lazy" />
            <figcaption className="mt-4">
              <h3 className="font-heading text-[1.25rem] font-extrabold leading-tight">On the map</h3>
              <p className="mt-1.5 text-[0.95rem] leading-[1.7] text-[#555]">
                Slide the timeline and pins light up wherever something is on &mdash; today, this weekend, this month.
                Spot the neighborhoods that are buzzing and find what&rsquo;s near you.
              </p>
            </figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/happenings-timeline-network.gif" alt="Sliding the happenings timeline on the network: artists and places with something on light up and connect" className={gif} loading="lazy" />
            <figcaption className="mt-4">
              <h3 className="font-heading text-[1.25rem] font-extrabold leading-tight">In the network</h3>
              <p className="mt-1.5 text-[0.95rem] leading-[1.7] text-[#555]">
                The same timeline lights up the web of artists and places. Follow a thread from a show to the
                artists in it, and from them to the other places that show their work.
              </p>
            </figcaption>
          </figure>
        </div>

        <p className="mt-8 text-[0.85rem] text-[#777] max-w-[40rem]">
          The animations use sample data to show the idea. Real happenings appear here as places add them &mdash; and
          there&rsquo;s more to come.
        </p>
      </div>
    </section>
  );
}
