import { EventEmitter } from "events";
import { ExFunc, ExternalFunctionFunctionality } from "./tools/external.js";

/**
 * Class representing a conversation entry.
 */
declare class ConvEntry {
  role: string;
  content: string;
  activatedTools: any[];

  /**
   * Creates a user conversation entry.
   * @param {string} content - The content of the entry.
   * @returns {ConvEntry} - The created user entry.
   */
  static user(content: string): ConvEntry;

  /**
   * Creates an assistant conversation entry.
   * @param {string} content - The content of the entry.
   * @returns {ConvEntry} - The created assistant entry.
   */
  static assistant(content: string): ConvEntry;

  /**
   * Creates a system conversation entry.
   * @param {string} content - The content of the entry.
   * @returns {ConvEntry} - The created system entry.
   */
  static system(content: string): ConvEntry;
}

/**
 * Enum for Message In Progress status.
 * @enum {number}
 */
declare const MIPStatus: {
  QUEUED: 0;
  GENERATING: 1;
  EXECUTING_FUNCTION: 2;
  DONE: 3;
};

/**
 * Class representing a message in progress.
 */
declare class MessageInProgress extends EventEmitter {
  #status: MIPStatus;
  resolves: string[];

  /**
   * Gets the current status of the message.
   * @returns {MIPStatus} - The current status.
   */
  get status(): MIPStatus;

  /**
   * Sets the status of the message.
   * @param {MIPStatus} newStat - The new status to set.
   * @throws {TypeError} - Throws error if status is invalid.
   */
  set status(newStat: MIPStatus);

  /**
   * Gets the data of the message.
   * @returns {string} - The data of the message.
   */
  get data(): string;

  /**
   * Gets the last resolve of the message.
   * @returns {string} - The last resolve.
   */
  get lastResolve(): string;

  /**
   * Creates an instance of MessageInProgress.
   * @param {Object} options - The options for the message.
   * @param {Function} options.muteData - The function to mute data.
   */
  constructor(options: { muteData: (chunk: string) => string });

  /**
   * Waits until the message is finished.
   * @returns {Promise<void>} - A promise that resolves when the message is finished.
   */
  waitUntilFinished(): Promise<void>;

  /**
   * Creates a new resolve for the message.
   */
  newResolve(): void;

  /**
   * Adds a chunk to the message.
   * @param {string} chunk - The chunk to add.
   * @param {boolean} [sliceOldText=true] - Whether to slice old text.
   */
  add(chunk: string, sliceOldText?: boolean): void;
}

/**
 * Class representing a conversation.
 */
declare class Conversation extends EventEmitter {
  #customPrompt: string;
  #extras: {
    mutingOptions: {
      useIndexingOnExternalCommands: boolean;
      muteExternalCommands: boolean;
      hideExternalCommands: boolean;
      mergeAssistantAssistantMessages: boolean;
      hideSystemMessages: boolean;
      hideFirstMessage: boolean;
      hideSecondMessage: boolean;
    };
  };
  fullMessages: ConvEntry[];

  /**
   * Gets the custom prompt of the conversation.
   * @returns {string} - The custom prompt.
   */
  get customPrompt(): string;

  /**
   * Gets the muting options of the conversation.
   * @returns {Object} - The muting options.
   */
  get mutingOptions(): {
    useIndexingOnExternalCommands: boolean;
    muteExternalCommands: boolean;
    hideExternalCommands: boolean;
    mergeAssistantAssistantMessages: boolean;
    hideSystemMessages: boolean;
    hideFirstMessage: boolean;
    hideSecondMessage: boolean;
  };

  /**
   * Gets the execution function run history.
   * @returns {ExFunc[]} - The execution function run history.
   */
  get exfRunHistory(): ExFunc[];

  /**
   * Gets the filtered messages with muting options.
   * @returns {ConvEntry[]} - The filtered messages.
   */
  get messages(): ConvEntry[];

  /**
   * Gets the raw messages.
   * @returns {Object[]} - The raw messages.
   */
  get rawMessages(): { role: string; content: string }[];

  /**
   * Gets the last message in the conversation.
   * @returns {ConvEntry} - The last message.
   */
  get lastMsg(): ConvEntry;

  /**
   * Gets the activated tools in the conversation.
   * @returns {any[]} - The activated tools.
   */
  get activatedTools(): any[];

  #started: boolean;

  /**
   * Gets the started status of the conversation.
   * @returns {boolean} - The started status.
   */
  get started(): boolean;

  #eFunctionality: ExternalFunctionFunctionality | null;

  /**
   * Sends an entry to the conversation asynchronously.
   * @param {ConvEntry|string} entry - The entry to send.
   * @param {MessageInProgress} [message=null] - The message in progress.
   * @returns {Promise<MessageInProgress>} - The message in progress.
   */
  asyncSend(
    entry: ConvEntry | string,
    message?: MessageInProgress
  ): Promise<MessageInProgress>;

  /**
   * Sends an entry to the conversation.
   * @param {ConvEntry|string} entry - The entry to send.
   * @param {MessageInProgress} [message=null] - The message in progress.
   * @returns {MessageInProgress} - The message in progress.
   * @throws {Error} - Throws error if entry is invalid.
   */
  send(
    entry: ConvEntry | string,
    message?: MessageInProgress
  ): MessageInProgress;

  /**
   * Sends an entry to a copied conversation.
   * 
   * That means nothing will change on this conversation
   * @param {ConvEntry|string} entry - The entry to send.
   * @param {MessageInProgress} [message=null] - The message in progress.
   * @returns {MessageInProgress} - The message in progress.
   * @throws {Error} - Throws error if entry is invalid.
   */
  sendAndDiscard(
    entry: ConvEntry | string,
    message?: MessageInProgress
  ): MessageInProgress;

  /**
   * Copies the conversation ( Creates a new conversation with the same properties ).
   * 
   * @returns {Conversation} - The copied conversation.
   */
  copy(): Conversation;

  /**
   * Waits until the conversation is ready.
   * @returns {Promise<void>} - A promise that resolves when the conversation is ready.
   */
  waitReady(): Promise<void>;

  /**
   * Creates an instance of Conversation.
   * @param {Object} options - The options for the conversation.
   * @param {string} [options.customPrompt=''] - The custom prompt.
   * @param {ExFunc[]} [options.tools=[]] - The tools for external functions.
   * @param {Function} options.chatCompletionFunc - The chat completion function.
   * @param {Object} [options.mutingOptions] - The muting options.
   * @param {boolean} [options.mutingOptions.useIndexingOnExternalCommands=true] - Use indexing on external commands.
   * @param {boolean} [options.mutingOptions.muteExternalCommands=true] - Mute external commands.
   * @param {boolean} [options.mutingOptions.hideExternalCommands=false] - Hide external commands.
   * @param {boolean} [options.mutingOptions.mergeAssistantAssistantMessages=true] - Merge assistant-assistant messages.
   * @param {boolean} [options.mutingOptions.hideSystemMessages=true] - Hide system messages.
   * @param {boolean} [options.mutingOptions.hideFirstMessage=true] - Hide the first message.
   * @param {boolean} [options.mutingOptions.hideSecondMessage=false] - Hide the second message.
   * @param {boolean} [options.fastStart=true] - Start fast without waiting for the GPT response.
   * @throws {TypeError} - Throws error if chatCompletionFunc is not a function.
   */
  constructor(options: {
    customPrompt?: string;
    tools?: ExFunc[];
    chatCompletionFunc: (
      messagesArray: { role: string; content: string }[],
      chunkListener?: (chunk: string, sliceOldText?: boolean) => void
    ) => Promise<void>;
    mutingOptions?: {
      useIndexingOnExternalCommands?: boolean;
      muteExternalCommands?: boolean;
      hideExternalCommands?: boolean;
      mergeAssistantAssistantMessages?: boolean;
      hideSystemMessages?: boolean;
      hideFirstMessage?: boolean;
      hideSecondMessage?: boolean;
    };
    fastStart?: boolean;
  });

  #postprocess(
    assistantEntry: ConvEntry,
    message: MessageInProgress
  ): Promise<void>;

  #executeCompletion(options?: {
    failureIfAssistantIsLast?: boolean;
    chunkListener?: (chunk: string, sliceOldText?: boolean) => void;
  }): Promise<void>;
}

export { Conversation, ConvEntry, MessageInProgress, MIPStatus };
