<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [RecordJar](./ts-utils.recordjar.md) &gt; [readRecordJarFileSync](./ts-utils.recordjar.readrecordjarfilesync.md)

## RecordJar.readRecordJarFileSync() function

Reads a record-jar file from a supplied path.

**Signature:**

```typescript
export declare function readRecordJarFileSync(srcPath: string, options?: JarRecordParserOptions): Result<JarRecord[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  srcPath | string | Source path from which the file is read. |
|  options | [JarRecordParserOptions](./ts-utils.recordjar.jarrecordparseroptions.md) | _(Optional)_ Optional parser configuration |

**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;[JarRecord](./ts-utils.recordjar.jarrecord.md)<!-- -->\[\]&gt;

The contents of the file as an array of `Record<string, string>`

