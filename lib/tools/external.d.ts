import { MIPStatus, ConvEntry } from "../conversation.js";
import { TOOLS_BASE_PROMPT } from "../prompt.js";

/**
 * Class representing the execution result of an external function.
 */
declare class ExFuncRun {
  #func: ExFunc | null;
  #result: any | null;

  /**
   * Gets the result of the function execution.
   * @returns {any} - The result of the function execution.
   */
  get result(): any | null;

  /**
   * Gets the function instance.
   * @returns {ExFunc | null} - The function instance.
   */
  get func(): ExFunc | null;

  /**
   * Creates an instance of ExFuncRun.
   * @param {ExFunc} func - The function to be executed.
   * @param {any} result - The result of the function execution.
   */
  constructor(func: ExFunc, result: any);
}

/**
 * Class representing an external function.
 */
declare class ExFunc {
  id: string;
  description: string;
  parameters: Record<string, any>;
  hook: (params: any) => Promise<any>;

  /**
   * Static method to create an instance of ExFunc.
   * @param {string} id - The ID of the external function.
   * @param {Object} options - The options for the external function.
   * @param {string} options.description - The description of the external function.
   * @param {Object} options.parameters - The parameters of the external function.
   * @param {Function} options.hook - The hook function to be executed.
   * @returns {ExFunc} - The created instance of ExFunc.
   * @throws {Error} - Throws an error if parameters are invalid.
   */
  static create(
    id: string,
    options: {
      description: string;
      parameters: Record<string, any>;
      hook: (params: any) => Promise<any>;
    }
  ): ExFunc;
}

/**
 * Class representing the external function functionality within a conversation.
 */
declare class ExternalFunctionFunctionality {
  #attachedConversation: any;
  #efuncs: ExFunc[];
  #prompt_built: boolean;

  /**
   * Gets the list of external functions.
   * @returns {ExFunc[]} - The list of external functions.
   */
  get efuncs(): ExFunc[];

  /**
   * Gets the prompt built status.
   * @returns {boolean} - The prompt built status.
   */
  get prompt_built(): boolean;

  /**
   * Pushes new external functions to the functionality.
   * @param {...ExFunc} exts - The external functions to be added.
   * @throws {Error} - Throws an error if prompt is already built.
   */
  push(...exts: ExFunc[]): void;

  /**
   * Creates an instance of ExternalFunctionFunctionality.
   * @param {any} attachedConversation - The attached conversation instance.
   */
  constructor(attachedConversation: any);

  /**
   * Mutes external commands in a string.
   * @param {string} string - The string containing external commands.
   * @param {number} [index=0] - The index for the external commands.
   * @returns {[string, number]} - The muted string and updated index.
   */
  muteExternalCommands(string: string, index?: number): [string, number];

  /**
   * Executes all external functions found in the assistant entry.
   * @param {ConvEntry} assistantEntry - The assistant entry containing external commands.
   * @param {any} message - The message object to update status.
   * @returns {Promise<void>} - A promise that resolves when all external functions are executed.
   */
  executeAll(assistantEntry: ConvEntry, message: any): Promise<void>;

  /**
   * Builds the prompt for external functions.
   * @returns {string} - The built prompt.
   * @throws {Error} - Throws an error if prompt is already built.
   */
  buildPrompt(): string;
}

/**
 * Parses the message into phrases and external function calls.
 *
 * @param {string} message - The message to parse.
 * @param {ExFuncRun[]} exfRunHistory - The external function run history.
 * @returns {any[]} - The parsed message.
 */
function parseMessage(message: string, exfRunHistory: ExFuncRun[]): any[];

export { ExternalFunctionFunctionality, ExFunc, ExFuncRun, parseMessage };
