<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [PopulateObjectOptions](./ts-utils.populateobjectoptions.md)

## PopulateObjectOptions interface

Options for the  function.

<b>Signature:</b>

```typescript
export interface PopulateObjectOptions<T> 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [order?](./ts-utils.populateobjectoptions.order.md) |  | (keyof T)\[\] | <i>(Optional)</i> If present, specifies the order in which property values should be evaluated. Any keys not listed are evaluated after all listed keys in indeterminate order. If 'order' is not present, keys are evaluated in indeterminate order. |
|  [suppressUndefined?](./ts-utils.populateobjectoptions.suppressundefined.md) |  | boolean \| (keyof T)\[\] | <i>(Optional)</i> Specify handling of <code>undefined</code> values. By default, successful <code>undefined</code> results are written to the result object. If this value is <code>true</code> then <code>undefined</code> results are suppressed for all properties. If this value is an array of property keys then <code>undefined</code> results are suppressed for those properties only. |
