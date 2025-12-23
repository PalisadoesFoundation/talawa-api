import { z } from "zod";
import { imageMimeTypeEnum } from "./imageMimeType";
/**
 * Possible variants of the type of an attachment of a venue.
 */
export const venueAttachmentMimeTypeEnum = z.enum([
	...imageMimeTypeEnum.options,
] as const);
