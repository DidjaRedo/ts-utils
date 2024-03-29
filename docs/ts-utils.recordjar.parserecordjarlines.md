<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [RecordJar](./ts-utils.recordjar.md) &gt; [parseRecordJarLines](./ts-utils.recordjar.parserecordjarlines.md)

## RecordJar.parseRecordJarLines() function

Reads a record-jar from an array of strings, each of which represents one line in the source file.

**Signature:**

```typescript
export declare function parseRecordJarLines(lines: string[], options?: JarRecordParserOptions): Result<JarRecord[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  lines | string\[\] | the array of strings to be parsed |
|  options | [JarRecordParserOptions](./ts-utils.recordjar.jarrecordparseroptions.md) | _(Optional)_ Optional parser configuration |

**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;[JarRecord](./ts-utils.recordjar.jarrecord.md)<!-- -->\[\]&gt;

a corresponding array of `Record<string, string>`

