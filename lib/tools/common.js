import { TRACKER_PROMPT } from "../prompt.js";
import { ExFunc } from "./external.js";
import { ConvTool } from "./tool.js";

class ConvTracker extends ConvTool {
  fieldsDefinition = {};
  forMultipleUsers = false;
  #values = {
    0: {},
  };

  get values() {
    return this.forMultipleUsers ? this.#values : this.#values[0];
  }

  constructor({
    fieldsDefinition = {},
    values = {},
    forMultipleUsers = false,
  }) {
    super();
    if (typeof fieldsDefinition != "object" || typeof values != "object") {
      throw new TypeError(
        "Both `fieldsDefinition` and `values` must be objects"
      );
    }

    this.fieldsDefinition = fieldsDefinition;
    this.forMultipleUsers = forMultipleUsers;
    if (forMultipleUsers) this.#values = values;
    else this.#values = { 0: values };
  }

  get isUnique() {
    return true;
  }

  getPrompt() {
    return TRACKER_PROMPT.replace(
      "%TRACKER_FIELDS%",
      JSON.stringify(this.fieldsDefinition)
    ).replace(
      "%TRACKER_VALUES%",
      JSON.stringify(this.forMultipleUsers ? this.#values : this.#values[0])
    );
  }

  getEFuncs() {
    let params = {
      fieldName: "string, the field name to set",
      fieldValue: "string, the value to set the field to",
    };

    if (this.forMultipleUsers) {
      params.userID = "string, the user ID";
    }

    return [
      ExFunc.create("set-tracker-field", {
        description: "Set Tracker Field",
        parameters: params,
        hook: ({ fieldName, fieldValue }) => {
          if (fieldName.startsWith("_")) {
            return "Field names which start with an underscore are reserved and cannot be changed";
          }
          this.#values[fieldName] = fieldValue;
          return "Done";
        },
      }),
    ];
  }
}

export { ConvTracker };
