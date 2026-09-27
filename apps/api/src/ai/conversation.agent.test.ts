import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationAgentOutputSchema } from "@projectquote/schemas";
import { MockAIProvider } from "./providers/mock.provider.js";

test("ConversationAgentOutput schema accepts mock shape", () => {
  const provider = new MockAIProvider();
  const parsed = ConversationAgentOutputSchema.parse({
    reply: "Hello",
    identified: {},
    missingInformation: ["location"],
    suggestedQuestions: ["Where is the site?"],
    confidence: 0.4,
  });
  assert.ok(parsed.reply);
  assert.equal(typeof provider.chat, "function");
});
