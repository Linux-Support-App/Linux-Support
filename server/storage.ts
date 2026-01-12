import {
  users,
  sessions,
  categories,
  questions,
  answers,
  faqs,
  type User,
  type SafeUser,
  type InsertUser,
  type Session,
  type Category,
  type InsertCategory,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
  type Faq,
  type InsertFaq,
  type UserRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, or, sql, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<SafeUser[]>;
  updateUserRole(id: string, role: UserRole): Promise<void>;
  
  createSession(userId: string): Promise<Session>;
  getSession(id: string): Promise<(Session & { user: SafeUser }) | undefined>;
  deleteSession(id: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
  
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  getQuestions(options?: { categorySlug?: string; sort?: string; limit?: number }): Promise<(Question & { category: Category })[]>;
  getQuestionById(id: string): Promise<(Question & { category: Category; answers: Answer[] }) | undefined>;
  createQuestion(question: InsertQuestion & { userId?: string }): Promise<Question>;
  updateQuestion(id: string, data: Partial<Pick<Question, 'title' | 'content' | 'isPinned'>>): Promise<void>;
  deleteQuestion(id: string): Promise<void>;
  updateQuestionVotes(id: string, direction: "up" | "down"): Promise<void>;
  incrementQuestionViews(id: string): Promise<void>;
  searchQuestions(query: string): Promise<(Question & { category: Category })[]>;
  
  getAnswersByQuestionId(questionId: string): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer & { userId?: string }): Promise<Answer>;
  updateAnswer(id: string, data: Partial<Pick<Answer, 'content'>>): Promise<void>;
  deleteAnswer(id: string): Promise<void>;
  updateAnswerVotes(id: string, direction: "up" | "down"): Promise<void>;
  acceptAnswer(id: string, questionId: string): Promise<void>;
  
  getFaqs(): Promise<(Faq & { category: Category })[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  
  getStats(): Promise<{ totalQuestions: number; totalAnswers: number; categories: number }>;
}

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
      displayName: insertUser.displayName || insertUser.username,
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<SafeUser[]> {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  async createSession(userId: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const [session] = await db.insert(sessions).values({ userId, expiresAt }).returning();
    return session;
  }

  async getSession(id: string): Promise<(Session & { user: SafeUser }) | undefined> {
    const [result] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        createdAt: sessions.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())));
    
    return result || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async getQuestions(options?: { categorySlug?: string; sort?: string; limit?: number }): Promise<(Question & { category: Category })[]> {
    let query = db
      .select({
        id: questions.id,
        title: questions.title,
        content: questions.content,
        categoryId: questions.categoryId,
        authorName: questions.authorName,
        userId: questions.userId,
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
        isPinned: questions.isPinned,
        createdAt: questions.createdAt,
        imageUrl: questions.imageUrl,
        videoUrl: questions.videoUrl,
        codeSnippet: questions.codeSnippet,
        codeLanguage: questions.codeLanguage,
        category: categories,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id));

    if (options?.categorySlug) {
      query = query.where(eq(categories.slug, options.categorySlug)) as typeof query;
    }

    let orderedQuery;
    switch (options?.sort) {
      case "top":
        orderedQuery = query.orderBy(desc(questions.isPinned), desc(questions.votes));
        break;
      case "active":
        orderedQuery = query.orderBy(desc(questions.isPinned), desc(questions.answerCount));
        break;
      case "unanswered":
        orderedQuery = query.where(eq(questions.answerCount, 0)).orderBy(desc(questions.isPinned), desc(questions.createdAt)) as typeof query;
        break;
      default:
        orderedQuery = query.orderBy(desc(questions.isPinned), desc(questions.createdAt));
    }

    if (options?.limit) {
      return orderedQuery.limit(options.limit);
    }

    return orderedQuery;
  }

  async getQuestionById(id: string): Promise<(Question & { category: Category; answers: Answer[] }) | undefined> {
    const [result] = await db
      .select({
        id: questions.id,
        title: questions.title,
        content: questions.content,
        categoryId: questions.categoryId,
        authorName: questions.authorName,
        userId: questions.userId,
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
        isPinned: questions.isPinned,
        createdAt: questions.createdAt,
        imageUrl: questions.imageUrl,
        videoUrl: questions.videoUrl,
        codeSnippet: questions.codeSnippet,
        codeLanguage: questions.codeLanguage,
        category: categories,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(eq(questions.id, id));

    if (!result) return undefined;

    const questionAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.questionId, id))
      .orderBy(desc(answers.isAccepted), desc(answers.votes));

    return { ...result, answers: questionAnswers };
  }

  async createQuestion(question: InsertQuestion & { userId?: string }): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    return created;
  }

  async updateQuestion(id: string, data: Partial<Pick<Question, 'title' | 'content' | 'isPinned'>>): Promise<void> {
    await db.update(questions).set(data).where(eq(questions.id, id));
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(answers).where(eq(answers.questionId, id));
    await db.delete(questions).where(eq(questions.id, id));
  }

  async updateQuestionVotes(id: string, direction: "up" | "down"): Promise<void> {
    const increment = direction === "up" ? 1 : -1;
    await db
      .update(questions)
      .set({ votes: sql`${questions.votes} + ${increment}` })
      .where(eq(questions.id, id));
  }

  async incrementQuestionViews(id: string): Promise<void> {
    await db
      .update(questions)
      .set({ viewCount: sql`${questions.viewCount} + 1` })
      .where(eq(questions.id, id));
  }

  async searchQuestions(query: string): Promise<(Question & { category: Category })[]> {
    const searchPattern = `%${query}%`;
    return db
      .select({
        id: questions.id,
        title: questions.title,
        content: questions.content,
        categoryId: questions.categoryId,
        authorName: questions.authorName,
        userId: questions.userId,
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
        isPinned: questions.isPinned,
        createdAt: questions.createdAt,
        imageUrl: questions.imageUrl,
        videoUrl: questions.videoUrl,
        codeSnippet: questions.codeSnippet,
        codeLanguage: questions.codeLanguage,
        category: categories,
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .where(
        or(
          ilike(questions.title, searchPattern),
          ilike(questions.content, searchPattern)
        )
      )
      .orderBy(desc(questions.isPinned), desc(questions.votes));
  }

  async getAnswersByQuestionId(questionId: string): Promise<Answer[]> {
    return db
      .select()
      .from(answers)
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.isAccepted), desc(answers.votes));
  }

  async createAnswer(answer: InsertAnswer & { userId?: string }): Promise<Answer> {
    const [created] = await db.insert(answers).values(answer).returning();
    await db
      .update(questions)
      .set({ answerCount: sql`${questions.answerCount} + 1` })
      .where(eq(questions.id, answer.questionId));
    return created;
  }

  async updateAnswer(id: string, data: Partial<Pick<Answer, 'content'>>): Promise<void> {
    await db.update(answers).set(data).where(eq(answers.id, id));
  }

  async deleteAnswer(id: string): Promise<void> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    if (answer) {
      await db.delete(answers).where(eq(answers.id, id));
      await db
        .update(questions)
        .set({ answerCount: sql`${questions.answerCount} - 1` })
        .where(eq(questions.id, answer.questionId));
    }
  }

  async updateAnswerVotes(id: string, direction: "up" | "down"): Promise<void> {
    const increment = direction === "up" ? 1 : -1;
    await db
      .update(answers)
      .set({ votes: sql`${answers.votes} + ${increment}` })
      .where(eq(answers.id, id));
  }

  async acceptAnswer(id: string, questionId: string): Promise<void> {
    await db.update(answers).set({ isAccepted: false }).where(eq(answers.questionId, questionId));
    await db.update(answers).set({ isAccepted: true }).where(eq(answers.id, id));
  }

  async getFaqs(): Promise<(Faq & { category: Category })[]> {
    return db
      .select({
        id: faqs.id,
        question: faqs.question,
        answer: faqs.answer,
        categoryId: faqs.categoryId,
        order: faqs.order,
        codeSnippet: faqs.codeSnippet,
        codeLanguage: faqs.codeLanguage,
        category: categories,
      })
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .orderBy(asc(faqs.order));
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const [created] = await db.insert(faqs).values(faq).returning();
    return created;
  }

  async getStats(): Promise<{ totalQuestions: number; totalAnswers: number; categories: number }> {
    const [questionsCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const [answersCount] = await db.select({ count: sql<number>`count(*)` }).from(answers);
    const [categoriesCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);

    return {
      totalQuestions: Number(questionsCount?.count || 0),
      totalAnswers: Number(answersCount?.count || 0),
      categories: Number(categoriesCount?.count || 0),
    };
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}

export const storage = new DatabaseStorage();
