function canCatchError(errorInstance, errors, counter = 0) {
  if (typeof errors == "number") {
    return counter < errors;
  }

  let maxRetries = errors[errorInstance.constructor];
  if (maxRetries == undefined) return false;
  if (counter >= maxRetries) return false;

  return true;
}

function createRetry(
  func = async (retryNum = 0, ...originalArgs) => {},
  { minCooldown = 1000, maxCooldown = 5000, errors = 10, maxRetries = 10 } = {}
) {
  const newFunc = (...originalArgs) => {
    return retry(
      function () {
        return func.call(this, ...originalArgs);
      },
      { minCooldown, maxCooldown, errors, maxRetries }
    );
  };

  newFunc.retryOptions = { minCooldown, maxCooldown, errors, maxRetries };

  return newFunc;
}

function retry(
  func = async () => {},
  { minCooldown = 1000, maxCooldown = 5000, errors = 10, maxRetries = 10 } = {}
) {
  return new Promise(async (resolve, reject) => {
    if (typeof func != "function") return reject("Func should be a function!");

    let globalRetryCounter = 0;
    let happenedErrors = {};
    let lastHapppenedError = null;
    let cooldown = minCooldown;

    while (globalRetryCounter < maxRetries) {
      try {
        return resolve(
          await func.call({
            retries: globalRetryCounter,
            errors: happenedErrors,
            lastError: lastHapppenedError,
          })
        );
      } catch (error) {
        if (
          canCatchError(error, errors, happenedErrors[error.constructor] || 0)
        ) {
          happenedErrors[error.constructor] =
            (happenedErrors[error.constructor] || 0) + 1;
          lastHapppenedError = error;
        } else {
          return reject(error);
        }
      }

      globalRetryCounter += 1;
      cooldown =
        (globalRetryCounter / maxRetries) * (maxCooldown - minCooldown) +
        minCooldown;

      await new Promise((r) => setTimeout(r, cooldown));
    }

    reject(lastHapppenedError);
  });
}

export { retry, createRetry };
