import { EventEmitter } from "events";
import {
  ExFunc,
  ExternalFunctionFunctionality,
  parseMessage,
} from "./tools/external.js";
import { ConvTool } from "./tools/tool.js";

class ConvEntry {
  role = "user";
  content = "";

  // A list to track activated tools
  // Suitable to use on assistant entries.
  exfRunHistory = [];

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

const MIPStatus = {
  QUEUED: 0,
  GENERATING: 1,
  EXECUTING_FUNCTION: 2,
  DONE: 3,
};

class MessageInProgress extends EventEmitter {
  attachedConversation = null;

  #status = MIPStatus.QUEUED;
  get status() {
    return this.#status;
  }

  toString() {
    return this.#muteData(this.resolves.join(" "));
  }

  get result() {
    return parseMessage(
      this.toString(),
      this.attachedConversation.exfRunHistory || []
    );
  }

  set status(newStat) {
    if (this.#status == newStat) return;
    if (this.#status == MIPStatus.DONE)
      throw new TypeError("Cannot set status after being done");
    if (newStat == MIPStatus.QUEUED)
      throw new TypeError("Cannot set status to back to QUEUED");

    this.#status = newStat;

    if (this.#status == MIPStatus.DONE) this.emit("end", this.data);
    else {
      this.emit("switchStatus", this.#status);
    }
  }

  resolves = [];

  get lastResolve() {
    return this.resolves[this.resolves.length - 1];
  }

  #muteData = (x) => x;

  constructor({ muteData, attachedConversation }) {
    super();

    this.#muteData = muteData;
    this.attachedConversation = attachedConversation;
  }

  async waitUntilFinished() {
    await new Promise((resolve) => {
      this.once("end", resolve);
    });
  }

  newResolve() {
    this.resolves.push("");
  }

  add(chunk, sliceOldText = true) {
    if (this.#status == MIPStatus.DONE) return;

    if (this.resolves.length == 0) this.newResolve();

    chunk = sliceOldText ? chunk.substring(this.lastResolve.length) : chunk;

    this.resolves[this.resolves.length - 1] += chunk;

    const data = this.#muteData(this.resolves[this.resolves.length - 1]);
    if (data.length) {
      this.emit("chunkString", data);

      const pData = parseMessage(data, this.attachedConversation.exfRunHistory || []);
      if(pData.length) this.emit(
        "chunk",
        pData
      );
    }
  }
}

class Conversation extends EventEmitter {
  #customPrompt = "";
  get customPrompt() {
    return this.#customPrompt;
  }

  #extras = {
    mutingOptions: {
      /**
       * Whether to use `<external:ID>` format or `<external>`.
       *
       * Incompatible with `hideExternalCommands`.
       * Requires `muteExternalCommands`.
       */
      useIndexingOnExternalCommands: false,
      /**
       * Replaces `<external ...>` strings with `<external:ID>` or `<external>`.
       *
       * Incompatible with `hideExternalCommands`
       */
      muteExternalCommands: true,
      /**
       * Hides <external ...> strings, form assistant outputs.
       *
       * Incompatible with `muteExternalCommands`
       */
      hideExternalCommands: false,
      /**
       * Merge assistant-assistant messages
       * Generally those messages appear when system messages are hidden
       * So it's required to set `hideSystemMessages` to true
       */
      mergeAssistantAssistantMessages: true,
      /**
       * Hide messages with role `system`
       */
      hideSystemMessages: true,
      /**
       * Hide the first message, which includes configuration.
       */
      hideFirstMessage: true,
      /**
       * Hide the second message, which includes assistant welcome message
       *
       * Requires `hideFirstMessage`
       */
      hideSecondMessage: false,
      /**
       * Mute uncompleted `<external ...` calls
       */
      muteUncompletedExternalCalls: true,
    },
    tools: [],
  };

  tl(tool) {
    for (const iterator of this.#extras.tools) {
      if (iterator?.id == tool) return iterator;
      if (
        typeof tool === "object" &&
        iterator?.constructor &&
        iterator instanceof tool
      )
        return iterator;
    }
  }

  get mutingOptions() {
    // Make class user able to modify muting options
    return this.#extras.mutingOptions;
  }

  // Full un-filtered messages
  fullMessages = [];

  mutePhrase(phrase, role = "assistant") {
    let ecrMatch = /<result>(.*?)<\/result>/.exec(phrase);
    if (ecrMatch) {
      let replace = ecrMatch[1];
      try {
        replace = JSON.parse(replace);
      } catch (error) {}
      phrase = phrase.replace(ecrMatch[0], replace);
    }

    if (this.#extras.mutingOptions.muteUncompletedExternalCalls) {
      phrase = phrase.replace(/<[^>]*$/s, "");
    }

    if (role == "assistant") {
      if (this.#extras.mutingOptions.hideExternalCommands) {
        phrase = phrase.replace(/<func(.*?)>/g, "");
      } else if (this.#extras.mutingOptions.muteExternalCommands) {
        let index = this.#extras.mutingOptions.useIndexingOnExternalCommands
          ? 0
          : -1;
        const [string, newIndex] =
          ExternalFunctionFunctionality.muteExternalCommands(phrase, index);
        index = newIndex;
        phrase = string;
      }
    }

    return phrase;
  }

  // Messages with muting options on
  get messages() {
    let messagesCopy = [...this.fullMessages];
    if (this.#extras.mutingOptions.hideFirstMessage) {
      messagesCopy.shift();
      if (this.#extras.mutingOptions.hideSecondMessage) messagesCopy.shift();
    }

    if (this.#extras.mutingOptions.hideSystemMessages)
      messagesCopy = messagesCopy.filter((x) => x.role != "system");

    if (this.#extras.mutingOptions.mergeAssistantAssistantMessages) {
      for (let i = 0; i < messagesCopy.length - 1; i++) {
        if (
          messagesCopy[i].role == "assistant" &&
          messagesCopy[i + 1].role == "assistant"
        ) {
          messagesCopy[i] = ConvEntry.assistant(
            `${messagesCopy[i].content} ${messagesCopy[i + 1].content}`
          );
          messagesCopy.splice(i + 1, 1);
          i--;
        }
      }
    }

    for (let i = 0; i < messagesCopy.length; i++) {
      if (messagesCopy[i].role != "assistant") continue;
      messagesCopy[i] = ConvEntry.assistant(
        this.mutePhrase(messagesCopy[i].content)
      );
    }

    return messagesCopy;
  }

  get rawMessages() {
    return this.fullMessages.map((x) => {
      return { role: x.role, content: x.content };
    });
  }
  get lastMsg() {
    return this.fullMessages[this.fullMessages.length - 1];
  }

  #started = false;
  get started() {
    return this.#started;
  }

  // Processes functionality of external functions
  get exfRunHistory() {
    return this.fullMessages
      .filter((x) => x.role == "assistant")
      .map((x) => x.exfRunHistory)
      .flat();
  }

  async asyncSend(entry, { message = null, meta = {} } = {}) {
    let msg = this.send(entry, { message, meta });
    await msg.waitUntilFinished();
    return msg;
  }
  copy() {
    const copiedConv = new Conversation({
      chatCompletionFunc: this.chatCompletionFunc,
      customPrompt: this.#customPrompt,
      fastStart: true,
      generateFunctionsPrompts: false,
      mutingOptions: this.#extras.mutingOptions,
      tools: this.#extras.tools,
    });

    return copiedConv;
  }
  send(entry, { message = null, meta = {} } = {}) {
    if (entry instanceof ConvEntry) {
      this.fullMessages.push(entry);
    } else if (typeof entry == "string") {
      this.fullMessages.push(ConvEntry.user(entry));
    } else {
      throw new Error("Invalid entry");
    }

    let isTopLevelSend = false;

    if (message) {
      isTopLevelSend = false;
    } else {
      isTopLevelSend = true;
      message = new MessageInProgress({
        muteData: (data) => this.mutePhrase(data),
        attachedConversation: this,
      });
    }

    message.status = MIPStatus.GENERATING;

    message.newResolve();

    this.#executeCompletion({
      reBuild: isTopLevelSend,
      chunkListener: (chunk, sliceOldText = true) => {
        message.add(chunk, sliceOldText);
      },
    }).then(() => {
      const assistantEntry = ConvEntry.assistant(message.lastResolve);
      this.fullMessages.push(assistantEntry);
      this.#postprocess(assistantEntry, message, meta).then(() => {
        message.status = MIPStatus.DONE;
      });
    });

    return message; // Didn't use assistantEntry for a good reason
  }
  sendAndDiscard(entry, { message = null, meta = {} } = {}) {
    return this.copy().send(entry, { message, meta });
  }

  constructor({
    customPrompt = ``,
    tools = undefined,
    chatCompletionFunc = (messagesArray) => {},
    mutingOptions: {
      useIndexingOnExternalCommands = false,
      muteExternalCommands = true,
      hideExternalCommands = false,
      mergeAssistantAssistantMessages = true,
      hideSystemMessages = true,
      hideFirstMessage = true,
      hideSecondMessage = false,
    } = {},
  } = {}) {
    if (typeof chatCompletionFunc !== "function")
      throw new TypeError("Completion Func must be a Function");
    super();

    this.#extras.mutingOptions = {
      useIndexingOnExternalCommands,
      muteExternalCommands,
      hideExternalCommands,
      mergeAssistantAssistantMessages,
      hideSystemMessages,
      hideFirstMessage,
      hideSecondMessage,
    };

    this.chatCompletionFunc = chatCompletionFunc;

    this.#customPrompt = typeof customPrompt == "string" ? customPrompt : "";

    for (const tool of tools) {
      if (tool instanceof ExFunc || tool instanceof ConvTool) {
        if (
          tool.isUnique &&
          this.#extras.tools.find((x) => tool instanceof x.constructor)
        )
          continue;
        this.#extras.tools.push(tool);
      }
    }
  }

  async #postprocess(assistantEntry, message, meta) {
    await ExternalFunctionFunctionality.executeAll(
      assistantEntry,
      message,
      this.#lastBuilt.efuncs,
      this,
      meta
    );
  }

  #lastBuilt = {
    prompt: "",
    efuncs: [],
  };
  buildPrompt() {
    let prompt = "";
    let efuncs = [];

    for (const tool of this.#extras.tools) {
      if (tool instanceof ExFunc) {
        efuncs.push(tool);
      } else {
        prompt += tool.getPrompt();
        if (typeof tool.getEFuncs == "function")
          efuncs.push(...tool.getEFuncs());
      }
    }

    this.#lastBuilt = {
      prompt: ExternalFunctionFunctionality.buildPrompt(efuncs) + prompt,
      efuncs,
    };
  }

  async #executeCompletion({
    failureIfAssistantIsLast = true,
    chunkListener = undefined,
    reBuild = true,
  } = {}) {
    if (
      failureIfAssistantIsLast &&
      this.fullMessages[this.fullMessages.length - 1].role == "assistant"
    )
      throw new Error("Assistant is last one in conversation");

    if (reBuild) this.buildPrompt();

    const prompt = this.#lastBuilt.prompt + this.#customPrompt;

    const response = await this.chatCompletionFunc(
      [
        { role: "user", content: prompt },
        //{ role: "user", content: prompt }, // Doubled prompt for a good reason
        { role: "assistant", content: "Hello, How may i assist you?" },
        ...this.rawMessages,
      ],
      chunkListener
    );
  }
}

export { Conversation, ConvEntry, MessageInProgress, MIPStatus };
