<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [ResultValueType](./ts-utils.resultvaluetype.md)

## ResultValueType type

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Type inference to determine the result type of an [Result](./ts-utils.result.md)<!-- -->.

<b>Signature:</b>

```typescript
export declare type ResultValueType<T> = T extends Result<infer TV> ? TV : never;
```
<b>References:</b> [Result](./ts-utils.result.md)
