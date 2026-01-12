import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "moderator", "member"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  authorName: text("author_name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  votes: integer("votes").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  answerCount: integer("answer_count").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  codeSnippet: text("code_snippet"),
  codeLanguage: text("code_language"),
});

export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  votes: integer("votes").notNull().default(0),
  isAccepted: boolean("is_accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  codeSnippet: text("code_snippet"),
  codeLanguage: text("code_language"),
});

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  order: integer("order").notNull().default(0),
  codeSnippet: text("code_snippet"),
  codeLanguage: text("code_language"),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  questions: many(questions),
  answers: many(answers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(categories, {
    fields: [questions.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  author: one(users, {
    fields: [answers.userId],
    references: [users.id],
  }),
}));

export const faqsRelations = relations(faqs, ({ one }) => ({
  category: one(categories, {
    fields: [faqs.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  questions: many(questions),
  faqs: many(faqs),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  votes: true,
  viewCount: true,
  answerCount: true,
  isPinned: true,
  createdAt: true,
  userId: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  votes: true,
  isAccepted: true,
  createdAt: true,
  userId: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "moderator", "member"]),
});

export type UserRole = "owner" | "admin" | "moderator" | "member";

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password">;

export type Session = typeof sessions.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

export type QuestionWithCategory = Question & { category: Category };
export type QuestionWithAuthor = Question & { category: Category; author?: SafeUser | null };
export type AnswerWithQuestion = Answer & { question: Question };
export type AnswerWithAuthor = Answer & { author?: SafeUser | null };
