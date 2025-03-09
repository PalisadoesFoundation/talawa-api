[Admin Docs](/)

***

# Function: getKeyPathsWithNonUndefinedValues()

> **getKeyPathsWithNonUndefinedValues**\<`T`\>(`__namedParameters`): `Paths`\<`T`\>[]

Defined in: [src/utilities/getKeyPathsWithNonUndefinedValues.ts:54](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/utilities/getKeyPathsWithNonUndefinedValues.ts#L54)

This function takes in a javascript object and a list of key paths within that object as arguments and outputs all paths amongst those key paths that correspond to a non-undefined value.

## Type Parameters

• **T** *extends* `Record`\<`string`, `unknown`\>

## Parameters

### \_\_namedParameters

#### keyPaths

`Paths`\<`T`\>[]

#### object

`T`

## Returns

`Paths`\<`T`\>[]

## Example

```ts
const object = {
	field1: undefined,
	field2: "value2",
	field3: undefined,
	field4: null,
	field5: {
		field6: "value6",
	},
	field7: {
		field8: {
				field9: "value9",
				field10: undefined,
				field11: null
			}
	},
	field12: [
		"value12",
		undefined,
		null,
		{
			field13: "value13"
		}
	]
}

const keyPaths = getKeyPathsWithNonUndefinedValues([
	["field1"],
	["field2"],
	["field4"]
]);
const keyPaths = getKeyPathsWithNonUndefinedValues([
	["field3"],
	["field5", "field6"],
	["field7", "field8", "field9"],
	["field7", "field8", "field10"],
	["field7", "field8", "field11"]
]);
const keyPaths = getKeyPathsWithNonUndefinedValues([
	["field12", 0],
	["field12", 1],
	["field12", 2],
	["field12", 3, "field13"]
]);
```
