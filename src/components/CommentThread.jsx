import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Send, MessageCircle } from "lucide-react";

export default function CommentThread({ photoId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Comment.filter(
        { photo_id: photoId },
        "created_date",
        500
      );
      setComments(list);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [photoId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.Comment.create({ photo_id: photoId, text: text.trim() });
      setText("");
      await load();
    } catch (e) {
      // ignore
    }
    setSubmitting(false);
  };

  const remove = async (id) => {
    try {
      await base44.entities.Comment.delete(id);
      await load();
    } catch (e) {
      // ignore
    }
  };

  const canDelete = (c) =>
    currentUser && (currentUser.id === c.created_by_id || currentUser.role === "admin");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
        <MessageCircle className="h-4 w-4" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-stone-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-stone-400">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-white p-3 ring-1 ring-stone-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-stone-500">
                  {c.created_by || "Unknown"}
                  {c.created_date
                    ? " · " + new Date(c.created_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                    : ""}
                </span>
                {canDelete(c) && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-stone-400 transition hover:text-red-600"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}