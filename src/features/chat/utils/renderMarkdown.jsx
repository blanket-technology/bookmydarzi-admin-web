// Minimal markdown-to-JSX renderer for AI/agent chat messages. Chat replies
// (from the AI or quick-reply templates) come back with basic markdown -
// **bold**, numbered/bulleted lists, paragraph breaks, occasional bare
// URLs - which used to render as literal asterisks and un-clickable text
// (see MessageRow in ConversationView.jsx). A full markdown library is
// overkill for this bounded, known set of patterns actually produced by the
// AI - and this only ever builds React elements from parsed text (never
// dangerouslySetInnerHTML), so there's no injection risk from customer- or
// AI-authored content.

function renderInline(text, keyPrefix) {
  // Split on **bold** and bare URLs in one pass, alternating plain-text
  // segments with the matched tokens so both can appear in any order.
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {part}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export default function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let listBuffer = [];
  let listType = null; // "ol" | "ul"

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`pl-5 my-1 space-y-0.5 ${listType === "ol" ? "list-decimal" : "list-disc"}`}
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </Tag>,
    );
    listBuffer = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const numbered = line.match(/^\s*\d+\.\s+(.*)/);
    const bulleted = line.match(/^\s*[-*]\s+(.*)/);

    if (numbered) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(numbered[1]);
      return;
    }
    if (bulleted) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(bulleted[1]);
      return;
    }

    flushList();
    if (line.trim() === "") {
      // Collapse to a small paragraph gap rather than an empty <p> - avoids
      // large dead whitespace when the AI double-newlines between sections.
      blocks.push(<div key={`gap-${idx}`} className="h-1.5" />);
    } else {
      blocks.push(<p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>);
    }
  });
  flushList();

  return <>{blocks}</>;
}
