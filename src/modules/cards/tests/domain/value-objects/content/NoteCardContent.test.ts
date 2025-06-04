import { NoteCardContent, NoteCardContentValidationError } from "../../../../domain/value-objects/content/NoteCardContent";
import { CardTypeEnum } from "../../../../domain/value-objects/CardType";

describe("NoteCardContent", () => {
  describe("creation", () => {
    it("should create note content with text only", () => {
      const result = NoteCardContent.create("This is a test note");
      
      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.NOTE);
      expect(content.text).toBe("This is a test note");
      expect(content.title).toBeUndefined();
    });

    it("should create note content with text and title", () => {
      const result = NoteCardContent.create("This is a test note", "Test Title");
      
      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.NOTE);
      expect(content.text).toBe("This is a test note");
      expect(content.title).toBe("Test Title");
    });

    it("should trim whitespace from text and title", () => {
      const result = NoteCardContent.create("  This is a test note  ", "  Test Title  ");
      
      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.text).toBe("This is a test note");
      expect(content.title).toBe("Test Title");
    });

    it("should reject empty text", () => {
      const result = NoteCardContent.create("");
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(NoteCardContentValidationError);
      expect(result.error.message).toBe("Note text cannot be empty");
    });

    it("should reject whitespace-only text", () => {
      const result = NoteCardContent.create("   ");
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(NoteCardContentValidationError);
      expect(result.error.message).toBe("Note text cannot be empty");
    });

    it("should reject text exceeding max length", () => {
      const longText = "a".repeat(NoteCardContent.MAX_TEXT_LENGTH + 1);
      const result = NoteCardContent.create(longText);
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(NoteCardContentValidationError);
      expect(result.error.message).toBe(`Note text cannot exceed ${NoteCardContent.MAX_TEXT_LENGTH} characters`);
    });

    it("should accept text at max length", () => {
      const maxLengthText = "a".repeat(NoteCardContent.MAX_TEXT_LENGTH);
      const result = NoteCardContent.create(maxLengthText);
      
      expect(result.isOk()).toBe(true);
    });
  });

  describe("text updates", () => {
    it("should update text successfully", () => {
      const content = NoteCardContent.create("Original text").unwrap();
      const result = content.updateText("Updated text");
      
      expect(result.isOk()).toBe(true);
      const updatedContent = result.unwrap();
      expect(updatedContent.text).toBe("Updated text");
      expect(updatedContent.title).toBe(content.title); // Title should remain unchanged
    });

    it("should trim whitespace when updating text", () => {
      const content = NoteCardContent.create("Original text").unwrap();
      const result = content.updateText("  Updated text  ");
      
      expect(result.isOk()).toBe(true);
      const updatedContent = result.unwrap();
      expect(updatedContent.text).toBe("Updated text");
    });

    it("should reject empty text update", () => {
      const content = NoteCardContent.create("Original text").unwrap();
      const result = content.updateText("");
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(NoteCardContentValidationError);
      expect(result.error.message).toBe("Note text cannot be empty");
    });

    it("should reject text update exceeding max length", () => {
      const content = NoteCardContent.create("Original text").unwrap();
      const longText = "a".repeat(NoteCardContent.MAX_TEXT_LENGTH + 1);
      const result = content.updateText(longText);
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(NoteCardContentValidationError);
      expect(result.error.message).toBe(`Note text cannot exceed ${NoteCardContent.MAX_TEXT_LENGTH} characters`);
    });
  });

  describe("title updates", () => {
    it("should update title successfully", () => {
      const content = NoteCardContent.create("Test text", "Original Title").unwrap();
      const updatedContent = content.updateTitle("Updated Title");
      
      expect(updatedContent.title).toBe("Updated Title");
      expect(updatedContent.text).toBe("Test text"); // Text should remain unchanged
    });

    it("should trim whitespace when updating title", () => {
      const content = NoteCardContent.create("Test text").unwrap();
      const updatedContent = content.updateTitle("  Updated Title  ");
      
      expect(updatedContent.title).toBe("Updated Title");
    });

    it("should clear title when updating with undefined", () => {
      const content = NoteCardContent.create("Test text", "Original Title").unwrap();
      const updatedContent = content.updateTitle(undefined);
      
      expect(updatedContent.title).toBeUndefined();
    });

    it("should clear title when updating with empty string", () => {
      const content = NoteCardContent.create("Test text", "Original Title").unwrap();
      const updatedContent = content.updateTitle("");
      
      expect(updatedContent.title).toBeUndefined();
    });
  });

  describe("immutability", () => {
    it("should not modify original content when updating text", () => {
      const originalContent = NoteCardContent.create("Original text", "Original Title").unwrap();
      const updatedContent = originalContent.updateText("Updated text").unwrap();
      
      expect(originalContent.text).toBe("Original text");
      expect(originalContent.title).toBe("Original Title");
      expect(updatedContent.text).toBe("Updated text");
      expect(updatedContent.title).toBe("Original Title");
    });

    it("should not modify original content when updating title", () => {
      const originalContent = NoteCardContent.create("Original text", "Original Title").unwrap();
      const updatedContent = originalContent.updateTitle("Updated Title");
      
      expect(originalContent.text).toBe("Original text");
      expect(originalContent.title).toBe("Original Title");
      expect(updatedContent.text).toBe("Original text");
      expect(updatedContent.title).toBe("Updated Title");
    });
  });
});
