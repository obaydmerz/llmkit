# LLMKit

**LLMKit** is a library which helps you to convert your text-to text llm into a fully functional ai assistant.

## Key Features
- **Modular Plugin System:** Extend functionality easily by creating and integrating plugins *(Theres some plugins included already)*.
- **Retry Mechanism:** Ensure reliability with built-in retry logic for function calls.
- **Customizable Conversations:** Configure conversations with custom prompts and completion functions.
- **Dependency-less:** A hassle-free package.

## Included Plugins
- **External Functions:** The functionality of custom GPT **Actions**.
- and many are coming !

## Installation
Install LLMKit and its dependencies using npm from github:

```sh
npm i obaydmerz/llmkit
```

## Usage
### Starter Example
Here's a simple example of how to use LLMKit to create a conversation with an external function call:

```javascript
import { G4F, chunkProcessor } from "g4f";
import { Conversation } from "llmkit";
import { GPTPlugin } from "llmkit/plugins";
import { External, ExternalFunction } from "llmkit/plugins/external";
import chalk from "chalk";
import { retry } from "llmkit/lib/retry";

const g4f = new G4F();

(async () => {
  let conv = Conversation.create(
    (m) => retry({}, (num) => g4f.chatCompletion(m, {
      debug: true
    })),
    {
      plugins: [
        External.create([
          ExternalFunction.create("purchase", {
            description: "Orders something",
            parameters: {
              name: "string, The name of the product"
            },
            hook: async ({ name }) => {
              if (name.toLowerCase() == "pizza") {
                return "Ordered! Tell the user that the pizza is yummy";
              }
              return "Product Not Found";
            },
          }),
        ]),
      ],
    }
  );

  await conv.start();

  await conv.send("I wanna purchase a burger");
  console.log(conv.lastMsg.content.split("\n").map(x => ".>  " + x).join("\n"));
})();
```

## Documentation and support
Currently you can join our [Discord](https://discord.gg/s7Rg4DHuej) Server, We will provide help immediately.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to discuss your ideas.
Also we accept custom instruction edits!

## License
This project is licensed under the MIT License.