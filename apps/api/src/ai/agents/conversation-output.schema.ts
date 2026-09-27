/** OpenAI strict JSON schema for ConversationAgentOutput */
export const CONVERSATION_OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    projectType: { type: "string" },
    identified: {
      type: "object",
      additionalProperties: true,
    },
    missingInformation: {
      type: "array",
      items: { type: "string" },
    },
    suggestedQuestions: {
      type: "array",
      items: { type: "string" },
    },
    confidence: { type: "number" },
  },
  required: [
    "reply",
    "identified",
    "missingInformation",
    "suggestedQuestions",
    "confidence",
  ],
  additionalProperties: false,
} as const;
