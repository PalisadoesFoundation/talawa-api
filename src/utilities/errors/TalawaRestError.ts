import type { ErrorCode } from "./errorCodes";

export interface TalawaRestErrorOptions {
	code: ErrorCode;
	message: string;
	details?: Record<string, unknown>;
	statusCodeOverride?: number;
}

export class TalawaRestError extends Error {
	public readonly code: ErrorCode;
	public readonly details?: Record<string, unknown>;
	public readonly statusCode: number;

	constructor(options: TalawaRestErrorOptions) {
		super(options.message);
		this.name = "TalawaRestError";
		this.code = options.code;
		this.details = options.details;
		this.statusCode = options.statusCodeOverride || 500;
	}
}
