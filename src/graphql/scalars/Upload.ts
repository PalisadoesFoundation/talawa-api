import {
	type FileUpload,
	GraphQLUpload as GraphQLUploadResolver,
} from "graphql-upload-minimal";
import { builder } from "~/src/graphql/builder";

/**
 * Must only be used for graphql argument and input type fields. More information at these links:
 * 1. {@link https://github.com/mercurius-js/mercurius-upload}
 * 2. {@link https://github.com/flash-oss/graphql-upload-minimal}
 */
builder.addScalarType("Upload", GraphQLUploadResolver);

/**
 * `Upload` scalar type for pothos schema.
 */
export type Upload = {
	Input: Promise<FileUpload>;
	Output: Promise<FileUpload>;
};
