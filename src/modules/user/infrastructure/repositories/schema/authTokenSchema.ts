import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./userSchema";

export const authRefreshTokens = pgTable("auth_refresh_tokens", {
  tokenId: text("token_id").primaryKey(),
  userDid: text("user_did").notNull().references(() => users.id),
  refreshToken: text("refresh_token").notNull(),
  issuedAt: timestamp("issued_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").default(false)
});
