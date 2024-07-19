class GPTPlugin {
  attachedConversation = null;

  require(pluginClz) {
    for (const plugin of this.attachedConversation?.plugins) {
      if (plugin instanceof pluginClz) return plugin;
    }
  }

  async send(entry) {
    await this.attachedConversation.send(entry);
  }

  // Overwritable funcs

  async execute(assistantEntry) {}

  start() {}

  buildCustomPrompt() {
    return "";
  }
}

export { GPTPlugin };
