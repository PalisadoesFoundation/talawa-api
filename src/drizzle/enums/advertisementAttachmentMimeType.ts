import { z } from "zod";
import { imageMimeTypeEnum } from "./imageMimeType";
import { videoMimeTypeEnum } from "./videoMimeType";

/**
 * Possible variants of the type of an attachment of an advertisement.
 */
export const advertisementAttachmentMimeTypeZodEnum = z.enum([
	...imageMimeTypeEnum.options,
	...videoMimeTypeEnum.options,
]);
