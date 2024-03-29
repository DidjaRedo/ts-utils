<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [Classes](./ts-utils.validation.classes.md) &gt; [ArrayValidator](./ts-utils.validation.classes.arrayvalidator.md)

## Validation.Classes.ArrayValidator class

An in-place [Validator](./ts-utils.validation.validator.md) for arrays of validated values or objects.

**Signature:**

```typescript
export declare class ArrayValidator<T, TC = unknown> extends ValidatorBase<T[], TC> 
```
**Extends:** ValidatorBase&lt;T\[\], TC&gt;

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(params)](./ts-utils.validation.classes.arrayvalidator._constructor_.md) |  | Constructs a new [ArrayValidator](./ts-utils.validation.classes.arrayvalidator.md)<!-- -->. |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [\_validateElement](./ts-utils.validation.classes.arrayvalidator._validateelement.md) | <p><code>protected</code></p><p><code>readonly</code></p> | [Validator](./ts-utils.validation.validator.md)<!-- -->&lt;T, TC&gt; |  |
|  [options](./ts-utils.validation.classes.arrayvalidator.options.md) | <code>readonly</code> | [ValidatorOptions](./ts-utils.validation.validatoroptions.md)<!-- -->&lt;TC&gt; | [Options](./ts-utils.validation.validatoroptions.md) which apply to this validator. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [\_validate(from, context)](./ts-utils.validation.classes.arrayvalidator._validate.md) | <code>protected</code> | Static method which validates that a supplied <code>unknown</code> value is a <code>array</code> and that every element of the array can be validated by the supplied array validator. |

