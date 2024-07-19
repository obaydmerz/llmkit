import { ConvEntry } from "../lib/conversation";

/**
 * Represents a GPT plugin.
 */
declare class GPTPlugin {
  attachedConversation: Conversation | null;

  /**
   * Requires a specific plugin class.
   * @param pluginClz - The plugin class to require.
   * @returns The required plugin instance.
   */
  require(pluginClz: any): any;

  /**
   * Sends a conversation entry.
   * @param entry - The conversation entry to send.
   */
  send(entry: ConvEntry): Promise<void>;

  /**
   * Executes the plugin.
   * @param assistantEntry - The assistant entry to process.
   */
  execute(assistantEntry: ConvEntry): Promise<void>;

  /**
   * Starts the plugin.
   */
  start(): void;

  /**
   * Builds the custom prompt for the plugin.
   * @returns The custom prompt string.
   */
  buildCustomPrompt(): string;
}

export { GPTPlugin };
