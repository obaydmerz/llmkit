export class UnableToReach extends Error { }

export class ConnectionFailure extends UnableToReach { }
export class RateLimited extends UnableToReach {}