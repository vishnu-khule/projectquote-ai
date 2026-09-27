export function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const jwt = process.env.JWT_SECRET ?? "";
  if (!jwt || jwt.includes("change-me") || jwt.length < 32) {
    throw new Error(
      "Refusing to start: set a strong JWT_SECRET (32+ chars) in production",
    );
  }
}
