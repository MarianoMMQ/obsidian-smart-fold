import { App, Editor, EditorPosition } from "obsidian";
import { foldedRanges } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";

/* ---------- Helpers ---------- */

export function foldFriendlyAnchors(text: string): { anchors: number[]; headerAnchor: number } {
  const mList = text.match(/^(\s*)(?:[-*+]\s+|\d+\.\s+)/);
  const afterList = mList ? mList[0].length : null;

  const mHead = text.match(/^(#{1,6})\s+/);
  const afterHashes = mHead ? mHead[1].length + 1 : null; // hashes + space

  const firstNon = Math.max(0, text.search(/\S/));
  const anchors = [afterList, afterHashes, firstNon, 0].filter(
    (v): v is number => v !== null,
  );

  const headerAnchor = afterList ?? afterHashes ?? firstNon ?? 0;
  return { anchors: [...new Set(anchors)], headerAnchor };
}

export function setSelectionSilent(cm: EditorView, absolutePos: number) {
  cm.dispatch({ selection: { anchor: absolutePos }, scrollIntoView: false });
}

export function isOffsetInsideAnyFold(cm: EditorView, pos: number): boolean {
  let inside = false;
  foldedRanges(cm.state).between(pos, pos + 1, () => {
    inside = true;
  });
  return inside;
}

export function isLineFoldedAtBoundary(cm: EditorView, line: number): boolean {
  const l = cm.state.doc.line(line + 1);
  const pos = l.to;
  let inside = false;
  foldedRanges(cm.state).between(pos, pos + 1, () => {
    inside = true;
  });
  return inside;
}

/* ---------- Targeting logic ---------- */

export function lineInfo(editor: Editor, line: number) {
  const text = editor.getLine(line) ?? "";
  const leading = text.match(/^[ \t]*/)?.[0] ?? "";
  const indent = [...leading].reduce((acc, ch) => acc + (ch === "\t" ? 2 : 1), 0);
  const isList = /^\s*(?:[-*+]\s+|\d+\.\s+)/.test(text);
  const h = text.match(/^(#{1,6})\s+/);
  const headingLevel = h ? h[1].length : 0;
  const isHeading = headingLevel > 0;
  return { indent, isList, isHeading, headingLevel, raw: text };
}

export function listHasChildren(editor: Editor, line: number, indent: number): boolean {
  const last = editor.lineCount() - 1;
  for (let l = line + 1; l <= last; l++) {
    const info = lineInfo(editor, l);
    if (!info) continue;
    if (info.raw.trim() === "") continue;
    if (info.isHeading) return false;
    if (!info.isList) return false;
    if (info.indent > indent) return true;
    if (info.indent <= indent) return false;
  }
  return false;
}

export function headingHasChildren(editor: Editor, line: number, level: number): boolean {
  const last = editor.lineCount() - 1;
  for (let l = line + 1; l <= last; l++) {
    const info = lineInfo(editor, l);
    if (!info) continue;
    if (info.isHeading && info.headingLevel <= level) return false;
    if (info.raw.trim() !== "") return true;
  }
  return false;
}

export function findListParent(
  editor: Editor,
  fromLine: number,
  childIndent: number,
): number | null {
  for (let l = fromLine - 1; l >= 0; l--) {
    const info = lineInfo(editor, l);
    if (!info) continue;
    if (info.isHeading) break;
    if (info.raw.trim() === "") continue;
    if (info.isList && info.indent < childIndent) return l;
    if (!info.isList && info.indent <= childIndent) break;
  }
  return null;
}

export function findHeadingAbove(editor: Editor, fromLine: number): number | null {
  for (let l = fromLine; l >= 0; l--) {
    const info = lineInfo(editor, l);
    if (info?.isHeading) return l;
  }
  return null;
}

export function findToggleTarget(editor: Editor, line: number): number | null {
  const info = lineInfo(editor, line);
  if (!info) return null;
  if (info.isList && listHasChildren(editor, line, info.indent)) return line;
  if (info.isHeading && headingHasChildren(editor, line, info.headingLevel)) return line;

  const parentList = info.isList ? findListParent(editor, line, info.indent) : null;
  if (parentList != null) return parentList;

  const parentHeading = findHeadingAbove(editor, line);
  if (parentHeading != null) return parentHeading;

  if (info.isList && info.indent === 0) return line;
  return null;
}

export function findFallbackParent(editor: Editor, fromLine: number): number | null {
  const info = lineInfo(editor, fromLine);
  if (!info) return null;

  const listParent = info.isList ? findListParent(editor, fromLine, info.indent) : null;
  if (listParent != null) return listParent;

  return findHeadingAbove(editor, fromLine);
}

// climb exactly one level
export function findImmediateParent(editor: Editor, childLine: number): number | null {
  const info = lineInfo(editor, childLine);
  if (!info) return null;

  if (info.isList) {
    const listParent = findListParent(editor, childLine, info.indent);
    if (listParent != null) return listParent;

    const headingParent = findHeadingAbove(editor, childLine);
    return headingParent ?? null;
  }

  if (info.isHeading) {
    const childLevel = info.headingLevel;
    for (let l = childLine - 1; l >= 0; l--) {
      const p = lineInfo(editor, l);
      if (!p) continue;
      if (p.isHeading && p.headingLevel < childLevel) return l;
    }
    return null;
  }

  return findHeadingAbove(editor, childLine);
}

/* ---------- Folding executor ---------- */

export async function toggleFoldAtLineWithSafeCursor(
  app: App,
  editor: Editor,
  cm: EditorView,
  line: number,
  original: EditorPosition,
): Promise<boolean> {
  const origAbs = editor.posToOffset(original);

  if (original.line !== line) {
    const text = editor.getLine(line) ?? "";
    const { headerAnchor } = foldFriendlyAnchors(text);
    const targetPos = cm.state.doc.line(line + 1).from + headerAnchor;
    setSelectionSilent(cm, targetPos);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

const fired = (app as unknown as { commands: { executeCommandById(id: string): boolean } })
  .commands.executeCommandById("editor:toggle-fold");

if (!fired) {
  editor.setCursor(original);
  return false;
}

  // Restore cursor after fold render if it wouldn't land inside the fold
  setTimeout(() => {
    if (!isOffsetInsideAnyFold(cm, origAbs)) {
      editor.setCursor(editor.offsetToPos(origAbs));
    }
  }, 0);

  return true;
}
