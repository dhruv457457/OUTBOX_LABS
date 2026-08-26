"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { ColorPicker, FontSizeSelect, ImproveButton, LinkButton, ToolbarButton } from "./EditorToolbar";

interface Item {
  /** Name passed to editor.isActive(), plus attrs where the mark needs them. */
  name: string;
  attrs?: Record<string, unknown>;
  icon: string;
  label: string;
  run: (e: Editor) => void;
  /** History and one-shot commands have no on/off state to report. */
  stateless?: boolean;
}

const groups: Item[][] = [
  [
    { name: "undo", icon: "M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 9", label: "Undo", stateless: true, run: (e) => e.chain().focus().undo().run() },
    { name: "redo", icon: "M21 7v6h-6M21 13a9 9 0 1 1-3-6.7l3 2.7", label: "Redo", stateless: true, run: (e) => e.chain().focus().redo().run() },
  ],
  [
    { name: "bold", icon: "M7 4h6a3.5 3.5 0 0 1 0 7H7zM7 11h7a3.5 3.5 0 0 1 0 7H7z", label: "Bold", run: (e) => e.chain().focus().toggleBold().run() },
    { name: "italic", icon: "M11 4h6M5 20h6M14 4 8 20", label: "Italic", run: (e) => e.chain().focus().toggleItalic().run() },
    { name: "underline", icon: "M6 4v7a6 6 0 0 0 12 0V4M4 20h16", label: "Underline", run: (e) => e.chain().focus().toggleUnderline().run() },
    { name: "strike", icon: "M6 12h12M8 6.5C8.6 5 10 4 12 4c2.5 0 4.5 1.3 4.5 3.5M8 17.5C8.6 19 10 20 12 20c2.5 0 4.5-1.3 4.5-3.5", label: "Strikethrough", run: (e) => e.chain().focus().toggleStrike().run() },
  ],
  [
    { name: "heading", attrs: { level: 2 }, icon: "M6 4v16M18 4v16M6 12h12", label: "Heading", run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: "code", icon: "m9 8-5 4 5 4M15 8l5 4-5 4", label: "Inline code", run: (e) => e.chain().focus().toggleCode().run() },
  ],
  [
    { name: "textAlign", attrs: { textAlign: "left" }, icon: "M4 6h16M4 12h10M4 18h14", label: "Align left", run: (e) => e.chain().focus().setTextAlign("left").run() },
    { name: "textAlign", attrs: { textAlign: "center" }, icon: "M4 6h16M7 12h10M5 18h14", label: "Align centre", run: (e) => e.chain().focus().setTextAlign("center").run() },
    { name: "textAlign", attrs: { textAlign: "right" }, icon: "M4 6h16M10 12h10M6 18h14", label: "Align right", run: (e) => e.chain().focus().setTextAlign("right").run() },
  ],
  [
    { name: "bulletList", icon: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01", label: "Bullet list", run: (e) => e.chain().focus().toggleBulletList().run() },
    { name: "orderedList", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01", label: "Numbered list", run: (e) => e.chain().focus().toggleOrderedList().run() },
    { name: "blockquote", icon: "M7 7h5v5H8c0 2-1 3-3 3v2c3 0 5-2 5-5V7ZM15 7h5v5h-4c0 2-1 3-3 3v2c3 0 5-2 5-5V7Z", label: "Quote", run: (e) => e.chain().focus().toggleBlockquote().run() },
    { name: "horizontalRule", icon: "M4 12h16", label: "Divider", stateless: true, run: (e) => e.chain().focus().setHorizontalRule().run() },
  ],
];

interface Props {
  onChange: (html: string) => void;
  /** Passed through to the assistant so it can improve the subject line too. */
  subject?: string;
  onSubjectChange?: (subject: string) => void;
  onNotice?: (message: string, tone?: "success" | "error") => void;
}

export function RichTextEditor({ onChange, subject, onSubjectChange, onNotice }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // avoids an SSR hydration mismatch in the app router
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Type your message..." }),
    ],
    editorProps: {
      attributes: { class: "tiptap min-h-40 px-3 py-3 text-sm outline-none" },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  if (!editor) return <div className="h-52 rounded-lg border border-border bg-surface" />;

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5 border-r border-border pr-1">
            {group.map((item) => (
              <ToolbarButton
                key={item.name + JSON.stringify(item.attrs ?? "")}
                icon={item.icon}
                label={item.label}
                active={!item.stateless && editor.isActive(item.name, item.attrs)}
                onClick={() => item.run(editor)}
              />
            ))}
          </div>
        ))}

        <div className="flex items-center gap-0.5 border-r border-border pr-1">
          <FontSizeSelect editor={editor} />
          <ColorPicker editor={editor} />
          <LinkButton editor={editor} />
        </div>

        <ImproveButton
          editor={editor}
          subject={subject}
          onSubjectChange={onSubjectChange}
          onError={(message) => onNotice?.(message, "error")}
          onDone={() => {
            onChange(editor.getHTML());
            onNotice?.("Draft polished — undo with Ctrl+Z if you prefer the original.");
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
