/**
 * "What's coming" band under the happenings list: what the happenings tab is
 * for, and a sample-data preview of the timeline on the map and the network.
 */
export function HappeningsExplainer() {
  const media = 'rounded-xl border border-[#dedad4] bg-[#111] w-full h-auto block';
  return (
    <section className="bg-[#f7f6f3]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-10 py-14 sm:py-16">
        <div className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-[#555]">What we&rsquo;re building</div>
        <h2 className="mt-3 font-display text-[2.4rem] sm:text-[3.2rem] leading-[0.95] tracking-[0.03em]">
          Get the 10k foot view of the local arts scene
        </h2>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] font-light leading-[1.8] text-[#444]">
          Happenings are the local art events, shows, workshops, and open studios in your area. Places that support
          local artists share what&rsquo;s happening, and we add it to the Art Here map and network graph, so art
          lovers can engage more in the local arts ecosystem.
        </p>

        <div className="mt-12 flex flex-col gap-14 md:gap-20">
          <figure className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
            <video className={`${media} order-1 md:order-2 md:w-[58%] md:shrink-0`} src="/images/happenings-timeline-map.mp4" poster="/images/happenings-preview-map.jpg" aria-label="Sliding the happenings timeline on the Portland map: pins light up where something is on" autoPlay muted loop playsInline preload="metadata" />
            <figcaption className="order-2 md:order-1 md:flex-1">
              <h3 className="font-display text-[2rem] sm:text-[2.6rem] leading-none tracking-[0.03em]">On the map</h3>
              <p className="mt-3 text-[1.05rem] leading-[1.75] text-[#555]">
                Slide the timeline and pins light up wherever something is on &mdash; today, this weekend, this month.
                Spot the neighborhoods that are buzzing and find what&rsquo;s near you.
              </p>
            </figcaption>
          </figure>
          <figure className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
            <video className={`${media} order-1 md:order-1 md:w-[58%] md:shrink-0`} src="/images/happenings-timeline-network.mp4" poster="/images/happenings-preview-network.jpg" aria-label="Sliding the happenings timeline on the network: artists and places with something on light up and connect" autoPlay muted loop playsInline preload="metadata" />
            <figcaption className="order-2 md:order-2 md:flex-1">
              <h3 className="font-display text-[2rem] sm:text-[2.6rem] leading-none tracking-[0.03em]">In the network</h3>
              <p className="mt-3 text-[1.05rem] leading-[1.75] text-[#555]">
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
