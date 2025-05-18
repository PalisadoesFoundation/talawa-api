import { z } from "zod";
import { imageMimeTypeEnum } from "./imageMimeType";
import { videoMimeTypeEnum } from "./videoMimeType";

/**
 * Possible variants of the type of an attachement of an advertisement.
 */
export const advertisementAttachmentMimeTypeEnum = z.enum([
	...imageMimeTypeEnum.options,
	...videoMimeTypeEnum.options,
]);
