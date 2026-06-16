import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const telegramTable = pgTable("telegram_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  chatId: text("chat_id").notNull(),
  username: text("username"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTelegramSchema = createInsertSchema(telegramTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TelegramConnection = typeof telegramTable.$inferSelect;
export type InsertTelegram = z.infer<typeof insertTelegramSchema>;
