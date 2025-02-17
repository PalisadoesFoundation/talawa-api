const resolvers = {
	Mutation: {
		addOrganizationCustomField: async (
			_: any,
			{
				organizationId,
				name,
				type,
			}: { organizationId: string; name: string; type: string },
			{ dataSources }: { dataSources: any },
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
