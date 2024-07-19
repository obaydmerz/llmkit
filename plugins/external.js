import { GPTPlugin } from "../index.js";
import { ConvEntry } from "../lib/conversation.js";

class ExternalFunction {
  id = "func-001";
  description = "";

  parameters = {};

  hook = (params) => {};

  static create(id, { description, parameters, hook }) {
    if (
      typeof id != "string" ||
      typeof description != "string" ||
      typeof parameters != "object" ||
      typeof hook != "function"
    ) {
      throw new Error("Invalid parameters");
    }

    const efunc = new ExternalFunction();
    efunc.id = id;
    efunc.description = description;
    efunc.parameters = parameters;
    efunc.hook = hook;
    return efunc;
  }
}

const BASE_ACTOR_PROMPT = `You can access external data through something called external function call.
Examples: To turn a light off, to access the user's name, to check the weather... etc...
              
DO NOT CALL A FUNCTION WHEN YOU DON'T USE IT!

Available external functions are:
%EFUNCS%

To call those function, you should respond with:
<external name='The_function_name' parameters='{Json_encoded_params}'>

'The_function_name' is the name of the function, and 'Json_encoded_params' are the parameters passed to it, and should be specific to each function.

After calling the function, you should end your message, then the system will respond with this format:

<Result>

'Result' is the result of the function, however this is a system message, means you can contiune answering the question the user gave you in their previous message.
However, if the result seems like an error, tell the user and don't try to guess a result for it.

Examples of usage ( let's assume that get_weather is defined, and get_weather has parameters definition = {"city": "A string that represents that city"} ):


User: Can you check the weather in Paris?
You: <external name='get_weather' parameters='{"city": "Paris"}'>
Systen: <"Sunny, 26c">
You: There is a sunny day in paris, 26 cel.

Remember before you being sorry to the user because you didn't find the answer, re-check if you can get it from external functions.
Remember to be seamless, don't mention you got an information from an external function, don't show the raw result, just behave like magic!
`;

class External extends GPTPlugin {
  efuncs = [];

  push(ext) {
    this.efuncs.push(ext);
  }

  static create(efuncs) {
    const ext = new External();
    ext.efuncs = efuncs;
    return ext;
  }

  async execute(assistantEntry) {
    const content = assistantEntry.content;
    const jsonMatch = String(content).match(
      /<external name='(.*?)' parameters='(.*?)'>/s
    );

    if (!jsonMatch) return;
    let id = jsonMatch[1];
    let paramsJSON = jsonMatch[2];

    try {
      paramsJSON = JSON.parse(paramsJSON);
    } catch (error) {
      paramsJSON = {};
    }

    const efunc = this.efuncs.find((x) => x.id == id);
    if (!efunc) return;

    const returnValue = (await efunc.hook(paramsJSON)) || "ok";

    await this.send(ConvEntry.system(`<${JSON.stringify(returnValue)}>`));
  }

  buildCustomPrompt() {
    let prompt = BASE_ACTOR_PROMPT;
    prompt += this.efuncs
      .map(
        (x) =>
          `- ${x.name}: ${x.description}; Required Parameters: ${JSON.stringify(
            x.parameters
          )}`
      )
      .join("\n");
    return BASE_ACTOR_PROMPT.replace(
      "%EFUNCS%",
      this.efuncs
        .map(
          (x) =>
            ` - ${x.id}: ${
              x.description
            }. Required Parameters: ${JSON.stringify(x.parameters)}`
        )
        .join("\n")
    );
  }
}

export { External, ExternalFunction, BASE_ACTOR_PROMPT };
