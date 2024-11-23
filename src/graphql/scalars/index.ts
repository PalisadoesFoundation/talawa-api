import "./Date";
import "./DateTime";
import "./EmailAddress";
import "./PhoneNumber";

import type { _Date } from "./Date";
import type { DateTime } from "./DateTime";
import type { EmailAddress } from "./EmailAddress";
import type { PhoneNumber } from "./PhoneNumber";

/**
 * Map of custom scalar types used in talawa api used to annotate the type of those scalars to the pothos schema builder intiializer for type-safe usage of those scalars in the pothos schema definitions.
 */
export type CustomScalars = {
	Date: _Date;
	DateTime: DateTime;
	EmailAddress: EmailAddress;
	PhoneNumber: PhoneNumber;
};

/**
 * Map of custom scalar types used in talawa api used to annotate the type of those scalars to the clients consuming talawa api for type-safe usage of those scalars in the graphql operations.
 */
export type ClientCustomScalars = {
	Date: string;
	DateTime: string;
	EmailAddress: string;
	PhoneNumber: string;
};
