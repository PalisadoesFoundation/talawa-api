import { z } from "zod";
import { imageMimeTypeEnum } from "./imageMimeType";
import { videoMimeTypeEnum } from "./videoMimeType";

/**
 * Possible variants of the type of an attachment of an event venue.
 */
export const venueAttachmentMimeTypeZodEnum = z.enum([
	...imageMimeTypeEnum.options,
	...videoMimeTypeEnum.options,
]);
