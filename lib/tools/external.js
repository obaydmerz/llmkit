import { MIPStatus } from "../conversation.js";
import { ConvEntry } from "../conversation.js";
import { TOOLS_BASE_PROMPT } from "../prompt.js";

class ExFuncRun {
  #func = null;
  get func() {
    return this.#func;
  }

  result = null; // The return of hook()

  meta = {}; // Additional information to be passed for hook() from the parent send()

  constructor(func, meta) {
    this.#func = func;
    this.meta = meta;
  }
}

class ExFunc {
  id = "func-001";
  description = "";

  available = true;

  parameters = {};

  hook = (params) => {};

  static create(
    id,
    { description, parameters, hook, initiallyAvailable = true }
  ) {
    if (
      typeof id != "string" ||
      typeof description != "string" ||
      typeof parameters != "object" ||
      typeof hook != "function"
    ) {
      throw new Error("Invalid parameters");
    }

    const efunc = new ExFunc();
    efunc.available = initiallyAvailable;
    efunc.id = id;
    efunc.description = description;
    efunc.parameters = parameters;
    efunc.hook = hook;
    return efunc;
  }
}

class ExternalFunctionFunctionality {
  static muteExternalCommands(string, index = 0) {
    // index = -1 means no indexing at all
    const match = String(string).matchAll(
      /<func(.*?)>(.*?)<\/func>/gs
    );
    if (!match) return [string, index];

    for (const mth of match) {
      string = string.replace(
        mth[0],
        `<func${index > 0 ? ":" + index : ""}>`
      );
      if (index > 0) index += 1;
    }

    return [string, index];
  }

  static async executeAll(
    assistantEntry,
    message,
    efuncs,
    conversation,
    meta = {}
  ) {
    const content = assistantEntry.content;
    const match = String(content).matchAll(/<func=(.*?)>(.*?)<\/func>/gs);

    if (!match) return;

    let returns = [];

    message.status = MIPStatus.EXECUTING_FUNCTION;

    for (const mtch of match) {
      let id = mtch[1]; // ID is a string
      let params = mtch[2]; // Params are a JSON

      try {
        params = JSON.parse(params);
      } catch (error) {
        params = {};
      }

      const efunc = efuncs.find((x) => x.id == id && x.available !== false);
      if (!efunc) continue;

      let run = new ExFuncRun(efunc, meta);

      let result = await efunc.hook.call(run, params);

      run.result = result;

      returns.push(result);
      assistantEntry.exfRunHistory.push(run);
    }

    if (returns.length) {
      await conversation.asyncSend(
        ConvEntry.user("Function call results:\n" +
          returns.map((x) => `<result>${JSON.stringify(x)}</result>`).join("\n")
        ),
        { message, meta }
      );
    }
  }

  static buildPrompt(funcs) {
    return TOOLS_BASE_PROMPT.replace(
      "%EFUNCS%",
      funcs
        .map(
          (x) => `name: ${x.id}
description: ${x.description}
command: <func=${x.id}>${JSON.stringify(x.parameters)}</func>`
        )
        .join("\n----\n")
    );
  }
}

function parseMessage(str, exfRunHistory = []) {
  const regex = /<func(.*?)>/gs;
  let result = [];
  let lastIndex = 0;
  let valueIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    result.push(str.slice(lastIndex, match.index));

    if (valueIndex < exfRunHistory.length) {
      result.push(exfRunHistory[valueIndex]);
      valueIndex++;
    } else {
      //result.push(match[0]); // If there are no more values, push the original placeholder
    }

    lastIndex = regex.lastIndex;
  }

  result.push(str.slice(lastIndex)); // Add the remaining part of the string

  // Filter out empty strings resulting from consecutive placeholders
  return result.filter((item) => typeof item == "string" ? item.trim() != "" : ( item != null ? item != undefined : false));
}

export { ExternalFunctionFunctionality, ExFunc, ExFuncRun, parseMessage };
