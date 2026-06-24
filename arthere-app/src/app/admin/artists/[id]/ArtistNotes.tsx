"use client";

import { useState, useTransition } from "react";
import { addNote, deleteNote } from "./actions";

type Note = {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function ArtistNotes({
  artistId,
  initialNotes,
}: {
  artistId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!body.trim()) return;
    const trimmed = body.trim();
    startTransition(async () => {
      const note = await addNote(artistId, trimmed);
      setNotes((prev) => [note, ...prev]);
      setBody("");
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    });
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-5">
      <h2 className="font-medium mb-4">Communication Notes</h2>

      {/* Add note */}
      <div className="mb-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about communication with this artist…"
          rows={3}
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm resize-none focus:outline-none focus:border-[#999] bg-[#fafafa]"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={!body.trim() || isPending}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {isPending ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 && (
        <p className="text-sm text-[#999]">No notes yet.</p>
      )}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border border-[#f0f0f0] rounded-lg p-4">
            <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap leading-relaxed">{note.body}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-[#bbb]">
                {new Date(note.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
                className="text-xs text-[#ccc] hover:text-red-400 transition-colors disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
