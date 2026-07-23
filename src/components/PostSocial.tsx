import { useMemo, useRef, useState } from "react";
import { MessageCircle, Share2, ThumbsUp, Trash2, CornerDownRight, Send } from "lucide-react";
import { toast } from "sonner";
import { useClearReaction, useReactions, useSetReaction } from "@/hooks/useReactions";
import { useAddComment, useComments, useDeleteComment } from "@/hooks/useComments";
import { getDeviceId, getDisplayName, setDisplayName } from "@/lib/identity";
import { shareLink } from "@/lib/share";
import { timeAgo } from "@/lib/format";
import { REACTIONS, REACTION_EMOJI, type Comment, type ReactionType } from "@/types";

export default function PostSocial({
  matchId,
  shareInfo,
}: {
  matchId: string;
  shareInfo: { title: string; text: string; url: string };
}) {
  const deviceId = getDeviceId();
  const { data: reactions = [] } = useReactions(matchId);
  const setReaction = useSetReaction(matchId);
  const clearReaction = useClearReaction(matchId);
  const { data: comments = [] } = useComments(matchId);

  const [showPicker, setShowPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const longFired = useRef(false);

  const myReaction = reactions.find((r) => r.device_id === deviceId);
  const total = reactions.length;

  // อิโมจิเด่น (เรียงตามจำนวน) โชว์สูงสุด 3
  const topEmojis = useMemo(() => {
    const count: Record<string, number> = {};
    reactions.forEach((r) => (count[r.type] = (count[r.type] ?? 0) + 1));
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => REACTION_EMOJI[t as ReactionType]);
  }, [reactions]);

  function toggleLike() {
    if (myReaction) clearReaction.mutate();
    else setReaction.mutate("like");
  }
  function pick(type: ReactionType) {
    setReaction.mutate(type);
    setShowPicker(false);
  }

  // กดค้าง = เปิด picker, แตะสั้น = ไลค์/เลิกไลค์
  function onDown() {
    longFired.current = false;
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      setShowPicker(true);
    }, 350);
  }
  function onUp() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    if (!longFired.current) toggleLike();
  }
  function onLeave() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }

  async function share() {
    await shareLink({ title: shareInfo.title, text: shareInfo.text, url: shareInfo.url });
  }

  const myLabel = myReaction
    ? REACTIONS.find((r) => r.type === myReaction.type)!
    : null;

  return (
    <div className="border-t border-[hsl(var(--border))]">
      {/* สรุปยอด */}
      {(total > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[hsl(var(--text-muted))]">
          <div className="flex items-center gap-1">
            {topEmojis.length > 0 && <span>{topEmojis.join("")}</span>}
            {total > 0 && <span>{total}</span>}
          </div>
          {comments.length > 0 && (
            <button onClick={() => setShowComments((s) => !s)}>
              {comments.length} ความคิดเห็น
            </button>
          )}
        </div>
      )}

      {/* แถบปุ่ม ไลค์ / คอมเมนต์ / แชร์ */}
      <div className="relative grid grid-cols-3 border-t border-[hsl(var(--border))]">
        {/* reaction picker (กดค้าง) */}
        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute -top-12 left-2 z-20 flex gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-1 shadow-card animate-fade-in">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => pick(r.type)}
                  className="text-2xl transition hover:scale-125"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={onLeave}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex select-none items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition active:bg-[hsl(var(--surface-2))] ${
            myLabel ? "text-brand" : "text-[hsl(var(--text-muted))]"
          }`}
        >
          {myLabel ? (
            <>
              <span className="text-base">{myLabel.emoji}</span> {myLabel.label}
            </>
          ) : (
            <>
              <ThumbsUp size={18} /> ถูกใจ
            </>
          )}
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[hsl(var(--text-muted))] transition active:bg-[hsl(var(--surface-2))]"
        >
          <MessageCircle size={18} /> คอมเมนต์
        </button>

        <button
          onClick={share}
          className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[hsl(var(--text-muted))] transition active:bg-[hsl(var(--surface-2))]"
        >
          <Share2 size={18} /> แชร์
        </button>
      </div>

      {showComments && <CommentSection matchId={matchId} comments={comments} deviceId={deviceId} />}
    </div>
  );
}

function CommentSection({
  matchId,
  comments,
  deviceId,
}: {
  matchId: string;
  comments: Comment[];
  deviceId: string;
}) {
  const addComment = useAddComment(matchId);
  const delComment = useDeleteComment(matchId);
  const [name, setName] = useState(getDisplayName());
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const roots = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  async function submit() {
    if (!body.trim()) return;
    const author = name.trim() || "ผู้เล่น";
    setDisplayName(author);
    try {
      await addComment.mutateAsync({
        body: body.trim(),
        author_name: author,
        parent_id: replyTo?.id ?? null,
      });
      setBody("");
      setReplyTo(null);
    } catch (e) {
      toast.error("ส่งไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  function Bubble({ c }: { c: Comment }) {
    const mine = c.device_id === deviceId;
    return (
      <div className="group">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-2))] text-xs font-bold text-[hsl(var(--text-muted))]">
            {c.author_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-block rounded-2xl bg-[hsl(var(--surface-2))] px-3 py-1.5">
              <div className="text-xs font-semibold">{c.author_name}</div>
              <div className="whitespace-pre-wrap break-words text-sm">{c.body}</div>
            </div>
            <div className="mt-0.5 flex items-center gap-3 pl-1 text-[11px] text-[hsl(var(--text-muted))]">
              <span>{timeAgo(c.created_at)}</span>
              <button onClick={() => setReplyTo({ id: c.id, name: c.author_name })}>ตอบกลับ</button>
              {mine && (
                <button
                  className="opacity-0 transition group-hover:opacity-100"
                  onClick={() => delComment.mutate(c.id)}
                >
                  <Trash2 size={12} className="inline" /> ลบ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 py-3">
      {roots.length === 0 && (
        <p className="text-center text-xs text-[hsl(var(--text-muted))]">
          ยังไม่มีความคิดเห็น — เริ่มคุยเป็นคนแรก
        </p>
      )}

      {roots.map((c) => (
        <div key={c.id} className="space-y-2">
          <Bubble c={c} />
          {repliesOf(c.id).length > 0 && (
            <div className="ml-6 space-y-2 border-l border-[hsl(var(--border))] pl-3">
              {repliesOf(c.id).map((r) => (
                <Bubble key={r.id} c={r} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* กล่องพิมพ์ */}
      <div className="space-y-2 rounded-xl border border-[hsl(var(--border))] p-2">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--surface-2))] px-2 py-1 text-xs text-[hsl(var(--text-muted))]">
            <span className="flex items-center gap-1">
              <CornerDownRight size={12} /> กำลังตอบ {replyTo.name}
            </span>
            <button onClick={() => setReplyTo(null)}>ยกเลิก</button>
          </div>
        )}
        <input
          className="input py-2"
          placeholder="ชื่อของคุณ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex items-end gap-2">
          <textarea
            className="input min-h-[38px] resize-none py-2"
            rows={1}
            placeholder="เขียนความคิดเห็น..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            className="btn-brand shrink-0"
            onClick={submit}
            disabled={addComment.isPending || !body.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
