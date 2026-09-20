---
name: patterns-react-compiler-refs
description: Trap - a hook that returns refs inside its result object trips react-hooks/refs when that object is passed as a prop; destructure refs at the call site
metadata:
  type: project
---

When a custom hook returns `{ heroRef, chipsRef, ...state }`, passing the whole object as a JSX
prop (`<MenuBar spy={spy} />`) fails `react-hooks/refs` ("Cannot access refs during render"):
the React Compiler lint treats the object as ref-carrying.

**Why:** hit on 2026-09-20 splitting `components/menu/restaurant-page.tsx` (phase 7): the
scroll-spy hook returned two refs plus state.

**How to apply:** destructure at the call site (`const { heroRef, chipsRef, activeSection, ... } =
useScrollSpy(...)`) and pass refs one by one: `ref={heroRef}` on a component (React 19 `ref` prop,
typed `Ref<HTMLDivElement>`) or a named prop like `chipsRef` that the child forwards to `ref=`.
Grouped non-ref state objects (a `filters` result) pass fine.
