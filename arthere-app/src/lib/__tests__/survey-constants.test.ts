import { describe, it, expect } from "vitest";
import {
  ARTIST_STATUS_OPTIONS,
  NOT_MAKING_ART_VALUES,
  INVOLVEMENT_OPTIONS,
  INVOLVEMENT_FEATURED,
  INVOLVEMENT_VOLUNTEER,
  INVOLVEMENT_NEWS,
  INVOLVEMENT_PARTNER,
  RAFFLE_OPTIONS,
  RAFFLE_YES,
} from "../survey-constants";

// Guard against the class of bug where admin dashboards compare against
// strings the form never stores (this shipped once: the funnel used
// "No, I'm not making art" while the form stored "No").
describe("survey constants consistency", () => {
  it("every NOT_MAKING_ART value is an actual artist-status option", () => {
    for (const v of NOT_MAKING_ART_VALUES) {
      expect(ARTIST_STATUS_OPTIONS).toContain(v);
    }
  });

  it("involvement sentinels are actual involvement options", () => {
    for (const v of [INVOLVEMENT_FEATURED, INVOLVEMENT_VOLUNTEER, INVOLVEMENT_NEWS, INVOLVEMENT_PARTNER]) {
      expect(INVOLVEMENT_OPTIONS).toContain(v);
    }
  });

  it("raffle yes value is an actual raffle option", () => {
    expect(RAFFLE_OPTIONS).toContain(RAFFLE_YES);
  });
});
