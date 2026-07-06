---
trigger: glob
globs: src/**, demo/**
---

# UI Interaction & Accessibility
Make sure the base UI components are accessible and follow web strandards.

## Web Standards First
- **Baseline:** Prioritize APIs passing the **Web Platform Baseline**. 
- **Semantics:** Use native elements (`<button>`, `<form>`, `<nav>`) over custom `div` implementations.
- **Composition:** Prioritize HTML slot composition over "Config Objects." (e.g., A dropdown should contain semantic list items, not a `JSON` property).

## Events & Accessibility
- **Aria:** Apply appropriate `role` and `aria-*` attributes.
- **Events:** Prefer standard events (`change`, `select`) over unique custom event names.
- **Naming:** Follow web authoring standards; minimize dashes in attribute names. Use `camelCase` for JS properties.
- **Errors:** Use `ElementInternals` error states. If dispatching, use a standard error event pattern.
