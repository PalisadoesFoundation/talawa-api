[**talawa-api**](../../../README.md)

***

# Type Alias: RecurrenceRuleResolvers\<ContextType, ParentType\>

> **RecurrenceRuleResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"RecurrenceRule"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"RecurrenceRule"`\]

## Type declaration

### \_\_isTypeOf?

> `optional` **\_\_isTypeOf**: [`IsTypeOfResolverFn`](IsTypeOfResolverFn.md)\<`ParentType`, `ContextType`\>

### baseRecurringEvent?

> `optional` **baseRecurringEvent**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>, `ParentType`, `ContextType`\>

### count?

> `optional` **count**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PositiveInt"`\]\>, `ParentType`, `ContextType`\>

### frequency?

> `optional` **frequency**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Frequency"`\], `ParentType`, `ContextType`\>

### interval?

> `optional` **interval**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"PositiveInt"`\], `ParentType`, `ContextType`\>

### latestInstanceDate?

> `optional` **latestInstanceDate**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Date"`\]\>, `ParentType`, `ContextType`\>

### organization?

> `optional` **organization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>, `ParentType`, `ContextType`\>

### recurrenceEndDate?

> `optional` **recurrenceEndDate**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Date"`\]\>, `ParentType`, `ContextType`\>

### recurrenceRuleString?

> `optional` **recurrenceRuleString**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\], `ParentType`, `ContextType`\>

### recurrenceStartDate?

> `optional` **recurrenceStartDate**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Date"`\], `ParentType`, `ContextType`\>

### weekDayOccurenceInMonth?

> `optional` **weekDayOccurenceInMonth**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Int"`\]\>, `ParentType`, `ContextType`\>

### weekDays?

> `optional` **weekDays**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"WeekDays"`\]\>[]\>, `ParentType`, `ContextType`\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4908](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L4908)
