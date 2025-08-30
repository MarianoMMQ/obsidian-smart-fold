import { App, PluginSettingTab, Setting } from "obsidian";
import type SmartFoldPlugin from "./main";

export interface SmartFoldSettings {
  doubleTapFoldsParent: boolean;
  doubleTapWindowMs: number;
}

export const DEFAULT_SETTINGS: SmartFoldSettings = {
  doubleTapFoldsParent: true,
  doubleTapWindowMs: 350,
};

export class SmartFoldSettingTab extends PluginSettingTab {
  plugin: SmartFoldPlugin;

  constructor(app: App, plugin: SmartFoldPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Smart Fold — Settings" });
    
    new Setting(containerEl)
      .setName("Double-tap folds parent")
      .setDesc("If on, pressing the hotkey twice quickly will fold the parent of the current item/heading.")
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.doubleTapFoldsParent)
          .onChange(async (v) => {
            this.plugin.settings.doubleTapFoldsParent = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Double-tap window (ms)")
      .setDesc("Max delay between taps to trigger parent fold.")
      .addText((t) =>
        t
          .setPlaceholder("350")
          .setValue(String(this.plugin.settings.doubleTapWindowMs))
          .onChange(async (v) => {
            const n = Number(v);
            if (!Number.isNaN(n) && n > 0) {
              this.plugin.settings.doubleTapWindowMs = Math.min(
                1500,
                Math.max(120, Math.round(n)),
              );
              await this.plugin.saveSettings();
            }
          }),
      );
  }
}