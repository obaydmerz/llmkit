import { GPTPlugin } from "../index";
import { ConvEntry } from "../lib/conversation";

/**
 * Represents the parameters for an external function.
 */
interface ExternalFunctionParams {
  [key: string]: string;
}

/**
 * Options for creating an external function.
 */
interface ExternalFunctionOptions {
  description: string;
  parameters: ExternalFunctionParams;
  hook: (params: ExternalFunctionParams) => any;
}

/**
 * Represents an external function.
 */
declare class ExternalFunction {
    /**
     * Unique ID for this external function.
     */
  id: string;
    /**
     * A LLM-friendly description of the function.
     * More description = Better
     */
    description: string;
    /**
     * Parameters
     * 
     * The key should be present in your hook, and the value
     * is an LLM-friendly description of the parameter ( More description = Better ).
     */
    parameters: ExternalFunctionParams;
    /**
     * Called when the LLM calls this external function
     */
  hook: (params: ExternalFunctionParams) => any;

  /**
   * Creates an instance of ExternalFunction.
   * @param id - The ID of the external function.
   * @param options - The options for the external function.
   * @returns An instance of ExternalFunction.
   */
  static create(id: string, options: ExternalFunctionOptions): ExternalFunction;
}

/**
 * The base actor prompt used for external function calls.
 */
declare const BASE_ACTOR_PROMPT: string;

/**
 * Represents an external plugin.
 */
declare class External extends GPTPlugin {
  efuncs: ExternalFunction[];

  /**
   * Adds an external function to the list.
   * @param ext - The external function to add.
   */
  push(ext: ExternalFunction): void;

  /**
   * Creates an instance of External.
   * @param efuncs - The list of external functions.
   * @returns An instance of External.
   */
  static create(efuncs: ExternalFunction[]): External;

  /**
   * Executes the external function based on the assistant entry.
   * @param assistantEntry - The assistant entry containing the function call.
   */
  execute(assistantEntry: ConvEntry): Promise<void>;

  /**
   * Builds the custom prompt for the external plugin.
   * @returns The custom prompt string.
   */
  buildCustomPrompt(): string;
}

export { External, ExternalFunction, BASE_ACTOR_PROMPT };
