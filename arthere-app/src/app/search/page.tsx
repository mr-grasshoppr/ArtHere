"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type ArtworkResult = {
  score: number;
  reason: string;
  artwork: { id: string; url: string; altText: string | null };
  artist: {
    id: string;
    slug: string;
    name: string;
    commissionStatus: string;
    placeRelations: Array<{ place: { name: string } }>;
  };
};

const EXAMPLE_QUERIES = [
  "a large colorful painting for over a fireplace",
  "small ceramic pieces as a housewarming gift",
  "an artist available for pet portrait commissions",
  "bold abstract work for an outdoor space",
  "subtle earth-tone prints for a bedroom",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtworkResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    setExplanation("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      setResults(data.results);
      setExplanation(data.intent?.explanation ?? "");
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  function useExample(q: string) {
    setQuery(q);
    doSearch(q);
    inputRef.current?.focus();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="text-stone-400 text-sm hover:text-stone-600 transition-colors">
          ← Art Here Portland
        </Link>
      </div>

      <h1 className="text-3xl font-medium text-stone-900 mb-2">Find art</h1>
      <p className="text-stone-500 mb-8">
        Describe what you&rsquo;re looking for in plain language.
      </p>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. a large oil painting with warm colors for my living room"
            className="flex-1 px-4 py-3 border border-stone-200 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 text-base"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-stone-900 text-white rounded-md font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {/* Example queries */}
      {!results && !loading && (
        <div className="mb-10">
          <p className="text-stone-400 text-sm mb-3">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => useExample(q)}
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-full text-stone-600 hover:border-stone-400 hover:text-stone-900 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-600 mb-6">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mb-4" />
          <p className="text-stone-400">Finding matching artwork…</p>
        </div>
      )}

      {/* Results */}
      {results !== null && !loading && (
        <>
          {explanation && (
            <p className="text-stone-500 text-sm mb-6 italic">{explanation}</p>
          )}

          {results.length === 0 ? (
            <p className="text-stone-500 py-8">
              No strong matches found. Try rephrasing — for example, mention the medium, color, or size.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {results.map((r, i) => (
                <Link
                  key={i}
                  href={`/artists/${r.artist.slug}`}
                  className="group block rounded-lg overflow-hidden border border-stone-100 hover:border-stone-300 transition-colors"
                >
                  <div className="aspect-square bg-stone-100">
                    <Image
                      src={r.artwork.url}
                      alt={r.artwork.altText ?? r.artist.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-stone-900 text-sm group-hover:text-stone-600 transition-colors">
                      {r.artist.name}
                    </p>
                    {r.artist.placeRelations[0] && (
                      <p className="text-stone-400 text-xs mt-0.5">
                        {r.artist.placeRelations[0].place.name}
                      </p>
                    )}
                    {r.artist.commissionStatus === "OPEN" && (
                      <span className="inline-block mt-1.5 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Open for commissions
                      </span>
                    )}
                    <p className="text-stone-400 text-xs mt-1.5 italic">{r.reason}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
