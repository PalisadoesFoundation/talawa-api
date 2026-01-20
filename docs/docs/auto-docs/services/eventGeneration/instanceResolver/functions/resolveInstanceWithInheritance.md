[API Docs](/)

***

# Function: resolveInstanceWithInheritance()

> **resolveInstanceWithInheritance**(`input`): [`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)

Defined in: [src/services/eventGeneration/instanceResolver.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/instanceResolver.ts#L17)

Resolves a single generated instance by combining the properties of the base event template
with any applicable exceptions. This function forms the core of the inheritance logic,
ensuring that each instance accurately reflects its intended state.

## Parameters

### input

[`ResolveInstanceInput`](../../types/interfaces/ResolveInstanceInput.md)

An object containing the generated instance, base template, and optional exception.

## Returns

[`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)

- A fully resolved generated event instance with all properties correctly inherited and overridden.
