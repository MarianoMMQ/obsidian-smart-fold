import type SmartFoldPlugin from "./main";
import { smartFold } from "./foldLogic";

export function registerSmartFoldCommand(plugin: SmartFoldPlugin) {
  plugin.addCommand({
    id: "toggle-smart-fold",
    name: "Toggle Smart Fold",
    editorCallback: (editor, view) => {
      if (view && "getViewType" in view) {
        // Ensure `view` is of type `MarkdownView`
        smartFold(plugin, editor, view);
      } else {
        console.error("Invalid view type passed to smartFold");
      }
    }
  });
}