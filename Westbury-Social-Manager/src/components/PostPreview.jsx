import React from "react";
import { StatusPill, fmtDate } from "./ui.jsx";

// Renders a generated post (image + caption + meta) exactly as the automation
// produced it. `post` is the object from output/post.json plus an `image` data URL.
export default function PostPreview({ post, footer }) {
  if (!post) return <div className="empty">No post yet. Generate one from the Generator page.</div>;
  return (
    <div className="post-preview">
      <div>
        {post.image ? (
          <img src={post.image} alt={post.altText || "Westbury post"} />
        ) : (
          <div className="empty">No image</div>
        )}
      </div>
      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <StatusPill status={post.status} />
          <span className="when">{post.category || ""}</span>
        </div>
        <div className="caption" style={{ marginTop: 14 }}>{post.caption || "—"}</div>
        <div className="meta-line">
          {post.date && <>Date: {post.date} &nbsp;·&nbsp; </>}
          {post.id && <>Topic: {post.id}</>}
        </div>
        {post.altText && <div className="meta-line">Alt text: {post.altText}</div>}
        {footer}
      </div>
    </div>
  );
}
