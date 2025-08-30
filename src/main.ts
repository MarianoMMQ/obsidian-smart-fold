import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, SmartFoldSettingTab, type SmartFoldSettings } from "./settings";
import { registerSmartFoldCommand } from "./commands";

export default class SmartFoldPlugin extends Plugin {
  public settings!: SmartFoldSettings; 

  public lastInvokeTime = 0;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SmartFoldSettingTab(this.app, this));
    registerSmartFoldCommand(this);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

