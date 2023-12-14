[talawa-api](../README.md) / [Exports](../modules.md) / [app](app.md) / default

# Namespace: default

[app](app.md).default

## Table of contents

### Variables

- [\_router](app.default.md#_router)
- [locals](app.default.md#locals)
- [map](app.default.md#map)
- [mountpath](app.default.md#mountpath)
- [request](app.default.md#request)
- [resource](app.default.md#resource)
- [response](app.default.md#response)
- [router](app.default.md#router)
- [routes](app.default.md#routes)
- [settings](app.default.md#settings)
- [stack](app.default.md#stack)

### Functions

- [[captureRejectionSymbol]](app.default.md#[capturerejectionsymbol])
- [addListener](app.default.md#addlistener)
- [all](app.default.md#all)
- [checkout](app.default.md#checkout)
- [connect](app.default.md#connect)
- [copy](app.default.md#copy)
- [defaultConfiguration](app.default.md#defaultconfiguration)
- [delete](app.default.md#delete)
- [disable](app.default.md#disable)
- [disabled](app.default.md#disabled)
- [emit](app.default.md#emit)
- [enable](app.default.md#enable)
- [enabled](app.default.md#enabled)
- [engine](app.default.md#engine)
- [eventNames](app.default.md#eventnames)
- [get](app.default.md#get)
- [getMaxListeners](app.default.md#getmaxlisteners)
- [head](app.default.md#head)
- [init](app.default.md#init)
- [link](app.default.md#link)
- [listen](app.default.md#listen)
- [listenerCount](app.default.md#listenercount)
- [listeners](app.default.md#listeners)
- [lock](app.default.md#lock)
- [m-search](app.default.md#m-search)
- [merge](app.default.md#merge)
- [mkactivity](app.default.md#mkactivity)
- [mkcol](app.default.md#mkcol)
- [move](app.default.md#move)
- [notify](app.default.md#notify)
- [off](app.default.md#off)
- [on](app.default.md#on)
- [once](app.default.md#once)
- [options](app.default.md#options)
- [param](app.default.md#param)
- [patch](app.default.md#patch)
- [path](app.default.md#path)
- [post](app.default.md#post)
- [prependListener](app.default.md#prependlistener)
- [prependOnceListener](app.default.md#prependoncelistener)
- [propfind](app.default.md#propfind)
- [proppatch](app.default.md#proppatch)
- [purge](app.default.md#purge)
- [put](app.default.md#put)
- [rawListeners](app.default.md#rawlisteners)
- [removeAllListeners](app.default.md#removealllisteners)
- [removeListener](app.default.md#removelistener)
- [render](app.default.md#render)
- [report](app.default.md#report)
- [route](app.default.md#route)
- [search](app.default.md#search)
- [set](app.default.md#set)
- [setMaxListeners](app.default.md#setmaxlisteners)
- [subscribe](app.default.md#subscribe)
- [trace](app.default.md#trace)
- [unlink](app.default.md#unlink)
- [unlock](app.default.md#unlock)
- [unsubscribe](app.default.md#unsubscribe)
- [use](app.default.md#use)

## Variables

### \_router

• **\_router**: `any`

Used to get all registered routes in Express Application

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1241

___

### locals

• **locals**: `Record`\<`string`, `any`\> & `Locals`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1226

___

### map

• **map**: `any`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1224

___

### mountpath

• **mountpath**: `string` \| `string`[]

The app.mountpath property contains one or more path patterns on which a sub-app was mounted.

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1259

___

### request

• **request**: `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1263

___

### resource

• **resource**: `any`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1222

___

### response

• **response**: `Response`\<`any`, `Record`\<`string`, `any`\>, `number`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1264

___

### router

• **router**: `string`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1218

___

### routes

• **routes**: `any`

The app.routes object houses all of the routes defined mapped by the
associated HTTP verb. This object may be used for introspection
capabilities, for example Express uses this internally not only for
routing but to provide default OPTIONS behaviour unless app.options()
is used. Your application or framework may also remove routes by
simply by removing them from this object.

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1236

___

### settings

• **settings**: `any`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1220

___

### stack

• **stack**: `any`[]

Stack of configured routes

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:299

## Functions

### [captureRejectionSymbol]

▸ **[captureRejectionSymbol]**(`error`, `event`, `...args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `event` | `string` |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

node_modules/@types/node/events.d.ts:115

___

### addListener

▸ **addListener**(`eventName`, `listener`): `Express`

Alias for `emitter.on(eventName, listener)`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`Express`

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/events.d.ts:475

___

### all

▸ **all**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **all**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **all**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **all**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **all**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### checkout

▸ **checkout**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **checkout**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **checkout**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **checkout**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **checkout**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### connect

▸ **connect**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **connect**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **connect**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **connect**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **connect**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### copy

▸ **copy**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **copy**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **copy**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **copy**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **copy**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### defaultConfiguration

▸ **defaultConfiguration**(): `void`

Initialize application configuration.

#### Returns

`void`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1079

___

### delete

▸ **delete**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **delete**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **delete**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **delete**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **delete**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### disable

▸ **disable**(`setting`): `Express`

Disable `setting`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `setting` | `string` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1178

___

### disabled

▸ **disabled**(`setting`): `boolean`

Check if `setting` is disabled.

   app.disabled('foo')
   // => true

   app.enable('foo')
   app.disabled('foo')
   // => false

#### Parameters

| Name | Type |
| :------ | :------ |
| `setting` | `string` |

#### Returns

`boolean`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1172

___

### emit

▸ **emit**(`eventName`, `...args`): `boolean`

Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/events.d.ts:731

___

### enable

▸ **enable**(`setting`): `Express`

Enable `setting`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `setting` | `string` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1175

___

### enabled

▸ **enabled**(`setting`): `boolean`

Check if `setting` is enabled (truthy).

   app.enabled('foo')
   // => false

   app.enable('foo')
   app.enabled('foo')
   // => true

#### Parameters

| Name | Type |
| :------ | :------ |
| `setting` | `string` |

#### Returns

`boolean`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1160

___

### engine

▸ **engine**(`ext`, `fn`): `Express`

Register the given template engine callback `fn`
as `ext`.

By default will `require()` the engine based on the
file extension. For example if you try to render
a "foo.jade" file Express will invoke the following internally:

    app.engine('jade', require('jade').__express);

For engines that do not provide `.__express` out of the box,
or if you wish to "map" a different extension to the template engine
you may use this method. For example mapping the EJS template engine to
".html" files:

    app.engine('html', require('ejs').renderFile);

In this case EJS provides a `.renderFile()` method with
the same signature that Express expects: `(path, options, callback)`,
though note that it aliases this method as `ejs.__express` internally
so if you're using ".ejs" extensions you dont need to do anything.

Some template engines do not follow this convention, the
[Consolidate.js](https://github.com/visionmedia/consolidate.js)
library was created to map all of node's popular template
engines to follow this convention, thus allowing them to
work seamlessly within Express.

#### Parameters

| Name | Type |
| :------ | :------ |
| `ext` | `string` |
| `fn` | (`path`: `string`, `options`: `object`, `callback`: (`e`: `any`, `rendered?`: `string`) => `void`) => `void` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1109

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

(`string` \| `symbol`)[]

**`Since`**

v6.0.0

#### Defined in

node_modules/@types/node/events.d.ts:794

___

### get

▸ **get**(`name`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`any`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1127

▸ **get**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **get**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **get**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **get**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **get**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to defaultMaxListeners.

#### Returns

`number`

**`Since`**

v1.0.0

#### Defined in

node_modules/@types/node/events.d.ts:647

___

### head

▸ **head**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **head**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **head**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **head**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **head**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### init

▸ **init**(): `void`

Initialize the server.

  - setup default configuration
  - setup default middleware
  - setup route reflection methods

#### Returns

`void`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1074

___

### link

▸ **link**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **link**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **link**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **link**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **link**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### listen

▸ **listen**(`port`, `hostname`, `backlog`, `callback?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

Listen for connections.

A node `http.Server` is returned, with this
application (which is a `Function`) as its
callback. If you wish to create both an HTTP
and HTTPS server you may do so with the "http"
and "https" modules as shown here:

   var http = require('http')
     , https = require('https')
     , express = require('express')
     , app = express();

   http.createServer(app).listen(80);
   https.createServer({ ... }, app).listen(443);

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `number` |
| `hostname` | `string` |
| `backlog` | `number` |
| `callback?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1211

▸ **listen**(`port`, `hostname`, `callback?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `number` |
| `hostname` | `string` |
| `callback?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1212

▸ **listen**(`port`, `callback?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `number` |
| `callback?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1213

▸ **listen**(`callback?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1214

▸ **listen**(`path`, `callback?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `callback?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1215

▸ **listen**(`handle`, `listeningListener?`): `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `handle` | `any` |
| `listeningListener?` | () => `void` |

#### Returns

`Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1216

___

### listenerCount

▸ **listenerCount**(`eventName`, `listener?`): `number`

Returns the number of listeners listening to the event named `eventName`.

If `listener` is provided, it will return how many times the listener
is found in the list of the listeners of the event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event being listened for |
| `listener?` | `Function` | The event handler function |

#### Returns

`number`

**`Since`**

v3.2.0

#### Defined in

node_modules/@types/node/events.d.ts:741

___

### listeners

▸ **listeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/events.d.ts:660

___

### lock

▸ **lock**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **lock**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **lock**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **lock**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **lock**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### m-search

▸ **m-search**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **m-search**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **m-search**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **m-search**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **m-search**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### merge

▸ **merge**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **merge**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **merge**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **merge**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **merge**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### mkactivity

▸ **mkactivity**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **mkactivity**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **mkactivity**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **mkactivity**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **mkactivity**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### mkcol

▸ **mkcol**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **mkcol**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **mkcol**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **mkcol**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **mkcol**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### move

▸ **move**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **move**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **move**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **move**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **move**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### notify

▸ **notify**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **notify**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **notify**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **notify**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **notify**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### off

▸ **off**(`eventName`, `listener`): `Express`

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`Express`

**`Since`**

v10.0.0

#### Defined in

node_modules/@types/node/events.d.ts:620

___

### on

▸ **on**(`event`, `callback`): `Express`

The mount event is fired on a sub-app, when it is mounted on a parent app.
The parent app is passed to the callback function.

NOTE:
Sub-apps will:
 - Not inherit the value of settings that have a default value. You must set the value in the sub-app.
 - Inherit the value of settings with no default value.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `callback` | (`parent`: `Application`\<`Record`\<`string`, `any`\>\>) => `void` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1254

___

### once

▸ **once**(`eventName`, `listener`): `Express`

Adds a **one-time**`listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`Express`

**`Since`**

v0.3.0

#### Defined in

node_modules/@types/node/events.d.ts:535

___

### options

▸ **options**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **options**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **options**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **options**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **options**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### param

▸ **param**(`name`, `handler`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` \| `string`[] |
| `handler` | `RequestParamHandler` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1129

▸ **param**(`callback`): `Express`

Alternatively, you can pass only a callback, in which case you have the opportunity to alter the app.param()

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`name`: `string`, `matcher`: `RegExp`) => `RequestParamHandler` |

#### Returns

`Express`

**`Deprecated`**

since version 4.11

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1136

___

### patch

▸ **patch**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **patch**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **patch**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **patch**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **patch**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### path

▸ **path**(): `string`

Return the app's absolute pathname
based on the parent(s) that have
mounted it.

For example if the application was
mounted as "/admin", which itself
was mounted as "/blog" then the
return value would be "/blog/admin".

#### Returns

`string`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1148

___

### post

▸ **post**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **post**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **post**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **post**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **post**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): `Express`

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`Express`

**`Since`**

v6.0.0

#### Defined in

node_modules/@types/node/events.d.ts:759

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): `Express`

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

`Express`

**`Since`**

v6.0.0

#### Defined in

node_modules/@types/node/events.d.ts:775

___

### propfind

▸ **propfind**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **propfind**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **propfind**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **propfind**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **propfind**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### proppatch

▸ **proppatch**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **proppatch**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **proppatch**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **proppatch**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **proppatch**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### purge

▸ **purge**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **purge**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **purge**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **purge**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **purge**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### put

▸ **put**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **put**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **put**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **put**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **put**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v9.4.0

#### Defined in

node_modules/@types/node/events.d.ts:690

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): `Express`

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

`Express`

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/events.d.ts:631

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): `Express`

Removes the specified `listener` from the listener array for the event named`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any`removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`listener is removed:

```js
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

`Express`

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/events.d.ts:615

___

### render

▸ **render**(`name`, `options?`, `callback?`): `void`

Render the given view `name` name with `options`
and a callback accepting an error and the
rendered template string.

Example:

   app.render('email', { name: 'Tobi' }, function(err, html){
     // ...
   })

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `options?` | `object` |
| `callback?` | (`err`: `Error`, `html`: `string`) => `void` |

#### Returns

`void`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1191

▸ **render**(`name`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `callback` | (`err`: `Error`, `html`: `string`) => `void` |

#### Returns

`void`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1192

___

### report

▸ **report**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **report**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **report**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **report**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **report**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### route

▸ **route**\<`T`\>(`prefix`): `IRoute`\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `prefix` | `T` |

#### Returns

`IRoute`\<`T`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:294

▸ **route**(`prefix`): `IRoute`\<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `prefix` | `PathParams` |

#### Returns

`IRoute`\<`string`\>

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:295

___

### search

▸ **search**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **search**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **search**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **search**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **search**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### set

▸ **set**(`setting`, `val`): `Express`

Assign `setting` to `val`, or return `setting`'s value.

   app.set('foo', 'bar');
   app.get('foo');
   // => "bar"
   app.set('foo', ['bar', 'baz']);
   app.get('foo');
   // => ["bar", "baz"]

Mounted servers inherit their parent server's settings.

#### Parameters

| Name | Type |
| :------ | :------ |
| `setting` | `string` |
| `val` | `any` |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:1126

___

### setMaxListeners

▸ **setMaxListeners**(`n`): `Express`

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

`Express`

**`Since`**

v0.3.5

#### Defined in

node_modules/@types/node/events.d.ts:641

___

### subscribe

▸ **subscribe**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **subscribe**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **subscribe**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **subscribe**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **subscribe**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### trace

▸ **trace**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **trace**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **trace**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **trace**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **trace**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### unlink

▸ **unlink**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **unlink**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **unlink**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **unlink**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **unlink**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### unlock

▸ **unlock**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **unlock**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **unlock**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **unlock**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **unlock**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### unsubscribe

▸ **unsubscribe**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **unsubscribe**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **unsubscribe**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **unsubscribe**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **unsubscribe**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169

___

### use

▸ **use**(`...handlers`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...handlers` | `RequestHandler`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:173

▸ **use**(`...handlers`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...handlers` | `RequestHandlerParams`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:174

▸ **use**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:175

▸ **use**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:186

▸ **use**\<`Route`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Route` | extends `string` |
| `P` | `RouteParameters`\<`Route`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Route` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:115

▸ **use**\<`Path`, `P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Path` | extends `string` |
| `P` | `RouteParameters`\<`Path`\> |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `Path` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:130

▸ **use**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandler`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:145

▸ **use**\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>(`path`, `...handlers`): `Express`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `P` | `ParamsDictionary` |
| `ResBody` | `any` |
| `ReqBody` | `any` |
| `ReqQuery` | `ParsedQs` |
| `LocalsObj` | extends `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `...handlers` | `RequestHandlerParams`\<`P`, `ResBody`, `ReqBody`, `ReqQuery`, `LocalsObj`\>[] |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:157

▸ **use**(`path`, `subApplication`): `Express`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `PathParams` |
| `subApplication` | `Application`\<`Record`\<`string`, `any`\>\> |

#### Returns

`Express`

#### Defined in

node_modules/@types/express-serve-static-core/index.d.ts:169
