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
						}) => Promise<unknown>;
					};
				};
			},
		) => {
			// Implement the logic to add a custom field to the organization
			// For example, you can use a data source to interact with your database
			const newCustomField = await dataSources.organizationAPI.addCustomField({
				organizationId,
				name,
				type,
			});

			return newCustomField;
		},
	},
};

module.exports = resolvers;
