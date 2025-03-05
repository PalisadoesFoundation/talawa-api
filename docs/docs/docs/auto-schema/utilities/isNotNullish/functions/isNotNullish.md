[Admin Docs](/)

***

# Function: isNotNullish()

> **isNotNullish**\<`T0`\>(`value`): `value is T0`

Defined in: [src/utilities/isNotNullish.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/be5955174726b793a9d0896706e81c3e939858bf/src/utilities/isNotNullish.ts#L12)

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
