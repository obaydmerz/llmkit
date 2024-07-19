import { GPTPlugin } from "../plugins/index";

/**
 * Represents a conversation entry.
 */
declare class ConvEntry {
  role: "user" | "assistant" | "system";
  content: string;

  /**
   * Creates a user conversation entry.
   * @param content - The content of the user entry.
   * @returns A user conversation entry.
   */
  static user(content: string): ConvEntry;

  /**
   * Creates an assistant conversation entry.
   * @param content - The content of the assistant entry.
   * @returns An assistant conversation entry.
   */
  static assistant(content: string): ConvEntry;

  /**
   * Creates a system conversation entry.
   * @param content - The content of the system entry.
   * @returns A system conversation entry.
   */
  static system(content: string): ConvEntry;
}

/**
 * Represents a conversation.
 */
declare class Conversation {
  plugins: GPTPlugin[];
  completionOptions: any;
  messages: ConvEntry[];

  private constructor();

  /**
   * Executes the completion function.
   * @param options - The options for execution.
   * @returns The assistant entry result.
   */
  executeCompletion(options?: {
    pushAssistantMsg?: boolean;
    failureIfAssistantIsLast?: boolean;
  }): Promise<ConvEntry>;

  /**
   * Sends a conversation entry.
   * @param entry - The entry to send.
   * @returns The last message in the conversation.
   */
  send(entry: ConvEntry | string): Promise<ConvEntry>;

  /**
   * Starts the conversation.
   */
  start(): Promise<void>;

  /**
   * Gets the last message in the conversation.
   */
  get lastMsg(): ConvEntry;

  /**
   * Creates a new conversation instance.
   * @param completionFunc - The completion function for generating responses.
   * @param options - The options for the conversation.
   * @returns A new conversation instance.
   */
  static create(
    completionFunc: (
      messages: { role: string; content: string }[],
      options: any
    ) => string,
    options: { options?: any; customPrompt?: string; plugins?: GPTPlugin[] }
  ): Conversation;
}

export { Conversation, ConvEntry };
