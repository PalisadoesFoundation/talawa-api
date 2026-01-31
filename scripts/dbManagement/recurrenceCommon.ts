/**
 * ESM wrapper for recurrenceCommon.cjs so ESM callers get typed imports
 * without relying on .cjs.d.ts resolution under moduleResolution: "Bundler".
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mod = require("./recurrenceCommon.cjs") as {
	BYDAY_TO_DOW: Record<string, number>;
	parseDate: (date: string | number | Date | null | undefined) => Date | null;
};

export const BYDAY_TO_DOW = mod.BYDAY_TO_DOW;
export const parseDate = mod.parseDate;
