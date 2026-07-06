---
name: clean-oop-design
description: Enforces clean Object-Oriented Programming (OOP) principles and strict type safety when writing or refactoring TypeScript code, ensuring high readability, testability, and maintainability. Trigger when writing new classes or modifying existing methods.
---
# Clean OOP Design Principles & Type Safety

When writing or refactoring Object-Oriented code in this workspace, you MUST adhere to the following principles to maintain readability, clarity, and compile-time correctness:

## 1. Single Responsibility Principle (SRP)
- Classes and methods should have one primary reason to change.
- A method should do exactly one thing. If a method exceeds ~20-30 lines, consider breaking it down.
- Avoid large monolithic methods (like "God functions" or massive `exec()` loops).

## 2. Extract Methods for Clarity
- If a block of code within a method can be conceptually grouped (e.g., executing a specific list mode vs test mode, or collecting configuration), **extract it into a dedicated `protected` or `private` helper method**.
- Name the extracted method descriptively so that it acts as its own documentation.

## 3. Encapsulation & Access Modifiers
- Use `private` (or `#` in modern JS/TS) for internal state and helpers that should not be exposed.
- Use `protected` for methods that subclasses might need to override or access.
- Only expose `public` methods that form the core API contract of the class.

## 4. Push Logic to Data Owners ("Tell, Don't Ask")
- Do not let external managers reach into an object's internal state to modify or format it. Push that logic into the object itself.
- ❌ **Bad:** `if (order.status === 'pending') { order.status = 'shipped'; }`
-  **Good:** `order.ship();`

## 5. Favor Getters for Derived State
- Instead of evaluating complex boolean checks inline (e.g., `typeof window !== 'undefined' && !!window.__lupa__?.config?.list`), extract them into explicit getters (e.g., `get isList(): boolean`) to improve legibility.

## 6. Strict Type Safety (Eliminate `any`)
- **Ban the `any` Type:** You are strictly forbidden from writing or leaving the `any` type in new or refactored code. It bypasses compile-time checks and defeats the purpose of TypeScript.
- **Use `unknown` for Uncertain Data:** If a type is truly dynamic or coming from an untrusted external source (like an API response), default to `unknown` and enforce explicit type narrowing/guards.
- **Leverage Generics:** Use generic type parameters (`<T>`) when designing flexible, reusable OOP structures instead of fallback typing.

```typescript
// ❌ Bad
function processData(payload: any): any {
  return payload.data; 
}

//  Good
function processData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  throw new Error("Invalid payload structure");
}
```

## 7. Concrete Design Patterns to Enforce

### Whole Object Pattern (Avoid Primitive Obsession)
Do not pass around raw strings or numbers for structural data that requires validation. Wrap them into lightweight classes.
```typescript
// ❌ Bad
function createUser(email: string) {
  if (!email.includes('@')) throw new Error();
}

//  Good
class EmailAddress {
  constructor(private readonly value: string) {
    if (!value.includes('@')) throw new Error('Invalid email');
  }
  toString() { return this.value; }
}
```

### Dependency Injection
Never hardcode instance creation inside a class constructor. Always pass dependencies in.
```typescript
// ❌ Bad
class UserService {
  private repo = new DatabaseRepository();
}

//  Good
class UserService {
  constructor(private readonly repo: DatabaseRepository) {}
}
```

## Agent Verification Protocol
Before returning any TypeScript code to the user, run this checklist:
1. **Zero `any` Types:** Are there any explicit or implicit instances of `any`? If yes, refactor using `unknown`, concrete types, or generics.
2. **Inline Logic Check:** Are there any inline boolean expressions with more than 2 conditions? If yes, move them to a clear `get` method.
3. **Explicit Visibility:** Are all class properties explicitly marked as `private` or `readonly` by default?
4. **IoC Compliance:** Does this class instantiate its own external dependencies? If yes, refactor to constructor injection.
