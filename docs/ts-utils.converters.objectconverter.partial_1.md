<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [ObjectConverter](./ts-utils.converters.objectconverter.md) &gt; [partial](./ts-utils.converters.objectconverter.partial_1.md)

## Converters.ObjectConverter.partial() method

Creates a new [ObjectConverter](./ts-utils.converters.objectconverter.md) derived from this one but with new optional properties as specified by a supplied array of `keyof T`<!-- -->.

**Signature:**

```typescript
partial(optional?: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  optional | (keyof T)\[\] | _(Optional)_ The keys of the source object properties to be made optional. |

**Returns:**

[ObjectConverter](./ts-utils.converters.objectconverter.md)<!-- -->&lt;Partial&lt;T&gt;, TC&gt;

A new [ObjectConverter](./ts-utils.converters.objectconverter.md) with the additional optional source properties. 

