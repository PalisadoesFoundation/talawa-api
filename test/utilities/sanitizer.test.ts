import { describe, expect, it } from "vitest";
import { escapeHTML, sanitizedStringSchema } from "../../src/utilities/sanitizer";

describe("escapeHTML", () => {
    it("should escape ampersand characters", () => {
        expect(escapeHTML("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("should escape less than characters", () => {
        expect(escapeHTML("<script>")).toBe("&lt;script&gt;");
    });

    it("should escape greater than characters", () => {
        expect(escapeHTML("a > b")).toBe("a &gt; b");
    });

    it("should escape double quote characters", () => {
        expect(escapeHTML('He said "hello"')).toBe("He said &quot;hello&quot;");
    });

    it("should escape single quote characters", () => {
        expect(escapeHTML("It's fine")).toBe("It&#39;s fine");
    });

    it("should escape all special characters in a complex string", () => {
        const maliciousInput = '<script>alert("XSS")</script>';
        const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";
        expect(escapeHTML(maliciousInput)).toBe(expected);
    });

    it("should return the same string if no special characters", () => {
        expect(escapeHTML("Hello World 123")).toBe("Hello World 123");
    });

    it("should handle empty strings", () => {
        expect(escapeHTML("")).toBe("");
    });

    it("should handle strings with only special characters", () => {
        expect(escapeHTML("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#39;");
    });

    it("should handle nested HTML-like structures", () => {
        const input = '<div onclick="alert(\'XSS\')">Click me</div>';
        const expected =
            "&lt;div onclick=&quot;alert(&#39;XSS&#39;)&quot;&gt;Click me&lt;/div&gt;";
        expect(escapeHTML(input)).toBe(expected);
    });
});

describe("sanitizedStringSchema", () => {
    it("should parse and escape HTML in valid strings", () => {
        const result = sanitizedStringSchema.parse("<script>alert('xss')</script>");
        expect(result).toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    });

    it("should pass through clean strings unchanged", () => {
        const result = sanitizedStringSchema.parse("Hello World");
        expect(result).toBe("Hello World");
    });

    it("should handle empty strings", () => {
        const result = sanitizedStringSchema.parse("");
        expect(result).toBe("");
    });

    it("should escape ampersands in URLs", () => {
        const result = sanitizedStringSchema.parse("?foo=1&bar=2");
        expect(result).toBe("?foo=1&amp;bar=2");
    });

    it("should reject non-string values", () => {
        expect(() => sanitizedStringSchema.parse(123)).toThrow();
        expect(() => sanitizedStringSchema.parse(null)).toThrow();
        expect(() => sanitizedStringSchema.parse(undefined)).toThrow();
    });
});
