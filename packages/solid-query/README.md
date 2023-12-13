# solid-query

A fork of `@tanstack/solid-query`

- Removes `createResource` usage, thereby removing any Suspense support.
- Removes `throwOnError` functionality, perhaps it'll come back later.
- Removes `reconcile` functionality, `structuralSharing` is preferred.
- General clean up around the codebase, removing the apparent smell.
