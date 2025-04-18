# 2025.04.18

- consider better abstractions for validating annotation values
- consider better error handling abstractions and avoid returning null values
- default values in templates - how to think of this?
- after an annotation is published to atproto, the repo should be updated with the id of that record

# 2025.04.17

- consider creating annotations from a templated context
  - this means multiple annotations will be created at the same time, so we should have a use-case for that
  - CreateAnnotationsFromTemplate - so we can properly handle this all as one request and one transaction
- consider how we want to decouple the annotation creation from the annotation publishing
  - should it all happen as one, or dispatch an `AnnotationsCreatedFromTemplate` event and then handle that event which will them interact with at proto and manage all of that logic
