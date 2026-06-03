import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Image Tagging ────────────────────────────────────────────────────────────

export interface ArtworkTags {
  medium: string[];           // e.g. ["oil painting", "canvas"]
  colors: string[];           // e.g. ["deep blue", "burnt orange", "cream"]
  scale: string;              // "small" | "medium" | "large" | "monumental"
  orientation: string;        // "landscape" | "portrait" | "square" | "irregular"
  style: string[];            // e.g. ["abstract", "impressionist", "figurative"]
  subjects: string[];         // e.g. ["landscape", "figure", "still life", "geometric"]
  indoor_outdoor: string;     // "indoor" | "outdoor" | "both"
  mood: string[];             // e.g. ["serene", "dramatic", "playful"]
  wall_art: boolean;          // suitable for wall display?
  functional: boolean;        // is it a functional object?
  description: string;        // 1-sentence natural language description
}

export async function tagArtworkImage(imageUrl: string): Promise<ArtworkTags> {
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `Analyze this artwork image and return a JSON object with these exact fields:
{
  "medium": ["list", "of", "materials/techniques"],
  "colors": ["list", "of", "3-6 dominant colors", "in plain language"],
  "scale": "small|medium|large|monumental",
  "orientation": "landscape|portrait|square|irregular",
  "style": ["list", "of", "art styles"],
  "subjects": ["list", "of", "subject matter"],
  "indoor_outdoor": "indoor|outdoor|both",
  "mood": ["list", "of", "2-4 mood descriptors"],
  "wall_art": true/false,
  "functional": true/false,
  "description": "One concise sentence describing this artwork for search purposes"
}

Return ONLY the JSON object, no other text. Be specific about colors (e.g. "dusty rose" not just "pink"). For scale, consider: small = under 18 inches, medium = 18-36 inches, large = 36-72 inches, monumental = over 72 inches.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as ArtworkTags;
}

// ─── Natural Language Search ──────────────────────────────────────────────────

export interface SearchIntent {
  query: string;
  filters: {
    medium?: string[];
    colors?: string[];
    scale?: string[];
    style?: string[];
    subjects?: string[];
    indoor_outdoor?: string;
    mood?: string[];
    wall_art?: boolean;
    functional?: boolean;
    commissions_open?: boolean;
  };
  explanation: string; // brief explanation of how the query was interpreted
}

export async function parseSearchQuery(query: string): Promise<SearchIntent> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are helping match art buyers with Portland artists. Parse this search query into structured filters.

Query: "${query}"

Return a JSON object:
{
  "query": "${query}",
  "filters": {
    "medium": ["optional", "list"] or null,
    "colors": ["optional", "dominant colors"] or null,
    "scale": ["small", "medium", "large", "monumental"] or null,
    "style": ["optional", "styles"] or null,
    "subjects": ["optional", "subjects"] or null,
    "indoor_outdoor": "indoor|outdoor|both" or null,
    "mood": ["optional", "moods"] or null,
    "wall_art": true/false/null,
    "functional": true/false/null,
    "commissions_open": true/false/null
  },
  "explanation": "Brief plain-English explanation of search interpretation"
}

Only include filters that the query clearly implies. Return ONLY the JSON.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as SearchIntent;
}

export interface ScoredArtwork {
  artworkId: string;
  artistId: string;
  score: number; // 0-100
  reason: string;
}

export async function rankResultsWithClaude(
  query: string,
  candidates: Array<{
    artworkId: string;
    artistId: string;
    artistName: string;
    imageUrl: string;
    aiTags: ArtworkTags | null;
    intake: object | null;
  }>
): Promise<ScoredArtwork[]> {
  if (candidates.length === 0) return [];

  const summaries = candidates.map((c, i) => ({
    index: i,
    artworkId: c.artworkId,
    artistId: c.artistId,
    artistName: c.artistName,
    tags: c.aiTags,
    intake: c.intake,
  }));

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `Rank these artworks for relevance to the search query: "${query}"

Artworks:
${JSON.stringify(summaries, null, 2)}

Return a JSON array of objects, one per artwork, sorted by relevance descending:
[{ "artworkId": "...", "artistId": "...", "score": 0-100, "reason": "brief reason" }]

Score 80+ only for strong matches. Return ONLY the JSON array.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";
  return JSON.parse(text) as ScoredArtwork[];
}
