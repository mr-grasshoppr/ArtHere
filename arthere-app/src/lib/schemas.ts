import { z } from "zod";

// Request-body schemas for the public/authenticated API routes. These bound
// field sizes and shapes up front so route handlers can assume well-formed
// input; routes still do their own trimming/normalization afterward.

const shortText = z.string().max(300);
const mediumText = z.string().max(2000);
const longText = z.string().max(10_000);
const stringList = z.array(z.string().max(300)).max(50);
// Numeric fields arrive as numbers or numeric strings from form inputs.
const numberish = z.union([z.number(), z.string().max(20)]).nullish();

export const profileSchema = z
  .object({
    name: z.string().min(1).max(200),
    bio: longText.nullish(),
    medium: shortText.nullish(),
    neighborhood: shortText.nullish(),
    hireFor: mediumText.nullish(),
    website: z.string().max(500).nullish(),
    instagram: shortText.nullish(),
    commissionStatus: z.enum(["OPEN", "CLOSED", "ON_REQUEST", "UNSPECIFIED"]).nullish(),
    priceRangeMin: numberish,
    priceRangeMax: numberish,
    sizeRangeMin: numberish,
    sizeRangeMax: numberish,
    placeRelations: z
      .array(
        z.object({
          placeId: z.string().max(50).optional(),
          placeName: shortText.optional(),
          relationship: z.string().max(50),
          relationshipLabel: shortText.nullish(),
        })
      )
      .max(30)
      .nullish(),
    intake: z
      .object({
        commissionTypes: stringList.nullish(),
        turnaroundWeeks: numberish,
        shipsInternationally: z.boolean().nullish(),
        worksInPerson: z.boolean().nullish(),
        notes: mediumText.nullish(),
      })
      .nullish(),
  })
  .loose();

export const contactSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().min(3).max(254),
    social: shortText.nullish(),
    message: z.string().max(5000).nullish(),
    intent: z.string().max(50).nullish(),
    website: z.string().max(500).nullish(), // honeypot
  })
  .loose();

export const surveySchema = z
  .object({
    zipCode: z.string().max(10).nullish(),
    neighborhoods: mediumText.nullish(),
    occupation: stringList.nullish(),
    occupationOther: shortText.nullish(),
    artistStatus: shortText.nullish(),
    artistStatusOther: shortText.nullish(),
    artMedium: stringList.nullish(),
    artMediumOther: shortText.nullish(),
    portlandFamiliarity: shortText.nullish(),
    discoveryEase: shortText.nullish(),
    discoveryChannel: stringList.nullish(),
    discoveryChannelOther: shortText.nullish(),
    portlandHelpers: longText.nullish(),
    portlandSupport: stringList.nullish(),
    portlandSupportOther: shortText.nullish(),
    careerStage: shortText.nullish(),
    careerStageOther: shortText.nullish(),
    practiceActivities: stringList.nullish(),
    practiceActivitiesOther: shortText.nullish(),
    practiceGoals: stringList.nullish(),
    practiceGoalsOther: shortText.nullish(),
    practiceSupport: longText.nullish(),
    involvementInterests: stringList.nullish(),
    involvementInterestsOther: shortText.nullish(),
    raffleOptIn: shortText.nullish(),
    email: z.string().max(254).nullish(),
    learnedAbout: stringList.nullish(),
    openFeedback: longText.nullish(),
    completed: z.boolean().nullish(),
    draftToken: z.string().max(100).nullish(),
  })
  .loose();

export const placeProfileSchema = z
  .object({
    name: shortText.nullish(),
    neighborhood: shortText.nullish(),
    description: longText.nullish(),
    website: z.string().max(500).nullish(),
    heroImageUrl: z.string().max(1000).nullish(),
    galleryImages: z.array(z.string().max(1000)).max(12).nullish(),
  })
  .loose();

/** Parse a request body; returns data or null (caller responds 400). */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T | null {
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}
