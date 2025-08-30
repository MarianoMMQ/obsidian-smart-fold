import { Editor, MarkdownView } from "obsidian";
import type SmartFoldPlugin from "./main";
import type { EditorView } from "@codemirror/view";
import {
  findFallbackParent,
  findImmediateParent,
  findToggleTarget,
  isLineFoldedAtBoundary,
  toggleFoldAtLineWithSafeCursor,
} from "./foldingUtils";

const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

export async function smartFold(
  plugin: SmartFoldPlugin,
  editor: Editor,
  view: MarkdownView | null,
) {
  if (!view) return;

  if (plugin.app.workspace.getActiveViewOfType(MarkdownView) !== view) {
    plugin.app.workspace.setActiveLeaf(view.leaf, { focus: true });
    await nextFrame();
  }
  view.editor?.focus?.();
  await nextFrame();

  const cm: EditorView | undefined = (editor as any)?.cm;
  if (!cm) return;

  const original = editor.getCursor();

  let target =
    findToggleTarget(editor, original.line) ??
    findFallbackParent(editor, original.line);
  if (target == null) return;

  const now = Date.now();
  const withinWindow =
    now - plugin.lastInvokeTime <= plugin.settings.doubleTapWindowMs;

  if (plugin.settings.doubleTapFoldsParent && withinWindow) {
    const parent = findImmediateParent(editor, target);
    if (parent != null) target = parent;
  }

  const wasFolded = isLineFoldedAtBoundary(cm, target);

  const ok = await toggleFoldAtLineWithSafeCursor(
    plugin.app,
    editor,
    cm,
    target,
    original,
  );
  if (!ok) return;

  await nextFrame();

  const isNowFolded = isLineFoldedAtBoundary(cm, target);

  if (!wasFolded && isNowFolded) {
    plugin.lastInvokeTime = now;
  } else if (wasFolded && !isNowFolded) {
    if (!withinWindow) plugin.lastInvokeTime = now;
  } else {
    plugin.lastInvokeTime = 0;
  }
}
