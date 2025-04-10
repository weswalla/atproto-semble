# Design Story

Annos is a simple yet powerful browser extension that lets users create high quality annotations for any website they visit. These annotations can come from user generated annotation templates and user generated annotation properties, allowing for an social and interactive network of annotators and their annotations.

# features

## annotate a webpage

- as an annotator
- I want to annotate a website
- so that I can easily track and share web content that is valuable to me and my peer network

### Scenario: a property value can be assigned for a property included in an annotation template

Given: an annotation form created from a "research paper review" template with a numeric property "creativity"
when: a value of 4 (out of 5) is assigned to the property "creativity"
then: the annotation should include the property "creativity" with a value of 4

Given: an annotation form created from a "research paper review" template with a dyadic property "scope"
when: a value of 0.8 (out of 1) is assigned to the property "scope"
then: the annotation should include the property "scope" with a value of 0.8

Given: an annotation form created from a "research paper review" template with a triadic property "methodology"
when: a value of [0.6, 0.3, 0.1] (must add to 1) is assigned to the property "methodology"
then: the annotation should include the property "methodology" with a value of [0.6, 0.3, 0.1]

### Scenario: a property value can be assigned to an open annotation (one that is not derived from a template)

Given: an open annotation form
when: a value of 4 (out of 5) is assigned to the property "creativity"
then: the annotation should include the property "creativity" with a value of 4

### Scenario: a property value cannot be assigned to an template derived annotation form that doesn't include the property

Given: an annotation form created from a "research paper review" template with a numeric property "creativity"
when: a value of 4 (out of 5) is assigned to the property "creativity"
then: the annotation should include the property "creativity" with a value of 4

## publish an annotation to atproto pds

- as an annotator
- I want my annotations to live in my atproto repository
- so that I own my data and it is easily portable and re-usable

### Scenario:
