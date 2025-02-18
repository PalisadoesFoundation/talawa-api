const resolvers = {
	Mutation: {
		addOrganizationCustomField: async (
			_: unknown,
			{
				organizationId,
				name,
				type,
			}: { organizationId: string; name: string; type: string },
			{
				dataSources,
			}: {
				dataSources: {
					organizationAPI: {
						addCustomField: (args: {
							organizationId: string;
							name: string;
							type: string;
						}) => Promise<{
							id: string;
							organizationId: string;
							name: string;
							type: string;
							createdAt: Date;
						}>;
					};
				};
			},
		) => {
			// Implement the logic to add a custom field to the organization
			// For example, you can use a data source to interact with your database
			// Validate input parameters
			const allowedTypes = ["TEXT", "NUMBER", "DATE", "BOOLEAN"];
			if (!allowedTypes.includes(type.toUpperCase())) {
				throw new Error(
					`Invalid field type. Allowed types: ${allowedTypes.join(", ")}`,
				);
			}

			try {
				const newCustomField = await dataSources.organizationAPI.addCustomField(
					{
						organizationId,
						name: name.trim(),
						type,
					},
				);

				return newCustomField;
			} catch (error) {
				throw new Error("Failed to add custom field ");
			}
		},
	},
};

module.exports = resolvers;
