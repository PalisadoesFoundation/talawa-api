[Admin Docs](/)

***

# Function: isNotNullish()

> **isNotNullish**\<`T0`\>(`value`): `value is T0`

Defined in: [src/utilities/isNotNullish.ts:12](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/utilities/isNotNullish.ts#L12)

This function is used to check nullish state of a value passed to it. Nullish means the value being either `null` or `undefined`. If the value is found to be nullish, the function returns the boolean `false`, else it returns the boolean `true`.

## Type Parameters

• **T0**

## Parameters

### value

`T0`

## Returns

`value is T0`

## Example

```ts
function print(str: string | null) {
	if (isNotNullish(str)) {
		console.log(`the string is ${str}`);
	} else {
		console.log(`the string is null`);
	}
}
```
