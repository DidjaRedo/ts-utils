<div align="center">
  <h1>ts-utils</h1>
  Assorted Typescript Utilities
</div>

<hr/>

## Summary

Assorted typescript utilities that I'm tired of copying from project to project. Most notable and closest to production-ready are:
* Result\<T\> - Easily combine inline and exception-based error handling
* Converter\<T\> - Conversion framework especially useful for type-safe processing of JSON

Also includes a few other much less-developed odds-and-ends borrowed from one project or another - much less polished and more likely change or disappear:
* ExtendedArray\<T\> - adds a few useful operations to the built-in Array
* Formattable\<T\> - simple helpers to create mustache wrappers for objects and make them easily printable
* Logger - A very basic logger suitable for hobby projects
* RangeOf\<T\> - Generic open or closed ranges of orderable items (numbers, dates, etc)

---

- [Summary](#summary)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Overview](#overview)
  - [The Result Pattern](#the-result-pattern)
  - [Converters](#converters)
- [API](#api)
  - [Result\<T\>](#resultt)
  - [Converter\<T\>](#convertert)
- [Additional APIs](#additional-apis)
  - [ExtendedArray\<T\>](#extendedarrayt)
  - [Formattable\<T\>](#formattablet)
  - [Logger](#logger)
  - [RangeOf\<T\>](#rangeoft)

## Installation

With npm:
```sh
npm install @fgv/ts-utils
```

## API Documentation
Extracted API documentation is [here](./docs/ts-utils.md).

## Overview
### The Result Pattern

A Result\<T\> represents the success or failure of executing some operation.  A successful result contains a return *value* of type *T*, while a failure result contains an error message of type *string*.  Taken by itself, the use of Result\<T\> allows for simple inline error handling.

```ts
const result = functionReturningResult();
if (result.isSuccess()) {
    functionAcceptingT(result.value);
}
else {
    console.log(result.error);
}
```

Use *succeed\<T>()* and *fail\<T\>()* to return success or failure:

```ts
function thisFunctionSucceeds(): string {
    return succeed('I succeeded!');
}

function thisFunctionFails(): number {
    return fail('Oops!  I failed');
}
```

Use *orDefault* when a failure can be safely ignored:
```ts
// returns undefined on failure
const value1: string|undefined = functionReturningResult('whatever').orDefault();

// returns 'oops' on failure
const value2: string = functionReturningResult('whatever').orDefault('oops');
```

The *orThrow* method converts a failure result to an exception, for use in contexts (such as constructors) in which an exception is the most appropriate way to handle errors.

```ts
constructor(param: string) {
    this._param = validateReturnsResult(param).orThrow();
}
```

The *captureResult* function converts an exception to a failure for simplified inline processing.

```ts
class Thing {
    static create(param: string): Result<Thing> {
        return captureResult(new Thing(param));
    }
}
```

Other methods and helpers allow for chaining and conversion of results, working with mulitple results and more.  See the [API documentation](#resultt) for details.

### Converters

The basic *Converter\<T\>* implements a *convert* method which converts *unknown* to *T*, using the result pattern to report success or failure.

```ts
class Converter<T> {
    public convert(from: unknown): Result<T>;
}
```

But built-in converters, including converters which can extract a field for an object or which apply converters according to the shape of some object can be composed to provide compact and legible type-safe conversion from anything to a strongly typed Typescript object:

```ts
interface Thing {
    title: string;
    count: number;
    isGood: boolean;
    hints: string[];
}

const thingConverter = Converters.object<Thing>({
    title: Converters.string,
    count: Converters.number,
    isGood: Converters.boolean,
    hints: Converters.array(Converters.string),
});

// gets a Thing or throws an error
const thing: Things = thingConverter.convert(json).orThrow();
```

Everything is strongly-typed, so Intellisense will autocomplete properties and highlight errors in the object supplied to *Converters.object*.

Other helpers and methods enable optional values or fields, chaining of results and a variety of other conversions and transformations.

## API

### Result\<T\>


### Converter\<T\>

## Additional APIs

### ExtendedArray\<T\>

### Formattable\<T\>

### Logger

### RangeOf\<T\>
