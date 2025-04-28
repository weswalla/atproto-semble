import { AnnotationValueFactory } from "../../domain/AnnotationValueFactory";
import { AnnotationType } from "../../domain/value-objects/AnnotationType";
import {
  DyadValue,
  MultiSelectValue,
  RatingValue,
  SingleSelectValue,
  TriadValue,
} from "../../domain/value-objects/AnnotationValue";

describe("AnnotationValueFactory", () => {
  describe("create", () => {
    it("should create a DyadValue", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.DYAD,
        valueInput: { value: 50 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(DyadValue);
        expect((result.value as DyadValue).value).toBe(50);
      }
    });

    it("should create a TriadValue", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.TRIAD,
        valueInput: { vertexA: 300, vertexB: 300, vertexC: 400 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(TriadValue);
        const triadValue = result.value as TriadValue;
        expect(triadValue.vertexA).toBe(300);
        expect(triadValue.vertexB).toBe(300);
        expect(triadValue.vertexC).toBe(400);
      }
    });

    it("should create a RatingValue", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.RATING,
        valueInput: { rating: 5 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(RatingValue);
        expect((result.value as RatingValue).rating).toBe(5);
      }
    });

    it("should create a SingleSelectValue", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.SINGLE_SELECT,
        valueInput: { option: "Option A" },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(SingleSelectValue);
        expect((result.value as SingleSelectValue).option).toBe("Option A");
      }
    });

    it("should create a MultiSelectValue", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.MULTI_SELECT,
        valueInput: { options: ["Option A", "Option B"] },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(MultiSelectValue);
        expect((result.value as MultiSelectValue).options).toEqual([
          "Option A",
          "Option B",
        ]);
      }
    });

    it("should return an error for invalid type", () => {
      const result = AnnotationValueFactory.create({
        type: { value: "invalid" } as any,
        valueInput: { value: 50 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid annotation value type");
      }
    });

    it("should return an error for mismatched type and value", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.DYAD,
        valueInput: { rating: 5 } as any,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid dyad value input");
      }
    });

    it("should return an error for invalid value", () => {
      const result = AnnotationValueFactory.create({
        type: AnnotationType.DYAD,
        valueInput: { value: 150 }, // Value out of range
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Dyad value must be between 0 and 100."
        );
      }
    });
  });
});
