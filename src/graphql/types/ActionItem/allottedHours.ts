import { ActionItem } from "./ActionItem";

ActionItem.implement({
	fields: (t) => ({
		allottedHours: t.float({
			nullable: true,
			description: "The number of hours allotted to complete this action item.",
			resolve: (parent) => {
				if (typeof parent.allottedHours === "number") {
					return parent.allottedHours;
				}
				if (typeof parent.allottedHours === "string") {
					const parsed = Number.parseFloat(parent.allottedHours);
					return Number.isNaN(parsed) ? null : parsed;
				}
				return null;
			},
		}),
	}),
});
