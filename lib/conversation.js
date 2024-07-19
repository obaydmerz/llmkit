import { GPTPlugin } from "../plugins/index.js";

class ConvEntry {
  role = "user";
  content = "";

  // A list to track activated plugins
  activatedPlugins = [];

  static user(content) {
    const entry = new ConvEntry();
    entry.role = "user";
    entry.content = content;
    return entry;
  }

  static assistant(content) {
    const entry = new ConvEntry();
    entry.role = "assistant";
    entry.content = content;
    return entry;
  }

  static system(content) {
    const entry = new ConvEntry();
    entry.role = "system";
    entry.content = content;
    return entry;
  }
}

class Conversation {
  plugins = [];
  completionOptions = {};

  #customPrompt = "";

  get customPrompt() {
    return this.#customPrompt;
  }

  messages = [];

  #started = false;
  get started() {
    return this.#started;
  }

  get messagesArray() {
    return this.messages.map((x) => {
      return { role: x.role, content: x.content };
    });
  }

  async executeCompletion({
    pushAssistantMsg = true,
    failureIfAssistantIsLast = true,
  } = {}) {
    if (!this.started) throw new Error("Conversation not started");

    if (
      failureIfAssistantIsLast &&
      this.messages[this.messages.length - 1].role == "assistant"
    )
      throw new Error("Assistant is last one in conversation");

    const response = await this.completionFunc(
      this.messagesArray,
      this.completionOptions
    );

    const entry = ConvEntry.assistant(response);

    if (pushAssistantMsg) {
      this.messages.push(entry);
    }

    return entry;
  }

  async #postprocess(assistantEntry) {
    for (const mod of this.plugins) {
      await mod.execute(assistantEntry);
    }
  }

  async send(entry) {
    if (entry instanceof ConvEntry) {
      this.messages.push(entry);
    } else if (typeof entry == "string") {
      this.messages.push(ConvEntry.user(entry));
    } else {
      throw new Error("Invalid entry");
    }

    let assistantEntry = await this.executeCompletion();

    await this.#postprocess(assistantEntry);

    return this.lastMsg; // Didn't use assistantEntry for a good reason
  }

  async start() {
    if (this.#started) return;
    this.#started = true;

    for (const mod of this.plugins) {
      await mod?.start();
      this.#customPrompt += "\n" + mod.buildCustomPrompt();
    }

    await this.send(ConvEntry.user(this.#customPrompt));
  }

  get lastMsg() {
    return this.messages[this.messages.length - 1];
  }

  static create(
    completionFunc = (messages, options) => {},
    { options = {}, customPrompt = ``, plugins = [] }
  ) {
    const conversation = new Conversation();
    conversation.completionOptions = options;
    conversation.plugins = Array.isArray(plugins)
      ? plugins.filter((m) => m instanceof GPTPlugin)
      : [];
    conversation.#customPrompt =
      typeof customPrompt == "string" ? customPrompt : "";
    conversation.completionFunc =
      typeof completionFunc == "function" ? completionFunc : () => {};

    for (const mod of plugins) {
      mod.attachedConversation = conversation;
    }
    return conversation;
  }
}

export { Conversation, GPTPlugin, ConvEntry };
