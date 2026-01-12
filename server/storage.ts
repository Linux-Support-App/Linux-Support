import {
  users,
  categories,
  questions,
  answers,
  faqs,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
  type Faq,
  type InsertFaq,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  getQuestions(options?: { categorySlug?: string; sort?: string; limit?: number }): Promise<(Question & { category: Category })[]>;
  getQuestionById(id: string): Promise<(Question & { category: Category; answers: Answer[] }) | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestionVotes(id: string, direction: "up" | "down"): Promise<void>;
  incrementQuestionViews(id: string): Promise<void>;
  searchQuestions(query: string): Promise<(Question & { category: Category })[]>;
  
  getAnswersByQuestionId(questionId: string): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswerVotes(id: string, direction: "up" | "down"): Promise<void>;
  
  getFaqs(): Promise<(Faq & { category: Category })[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  
  getStats(): Promise<{ totalQuestions: number; totalAnswers: number; categories: number }>;
}

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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
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
        orderedQuery = query.orderBy(desc(questions.votes));
        break;
      case "active":
        orderedQuery = query.orderBy(desc(questions.answerCount));
        break;
      case "unanswered":
        orderedQuery = query.where(eq(questions.answerCount, 0)).orderBy(desc(questions.createdAt)) as typeof query;
        break;
      default:
        orderedQuery = query.orderBy(desc(questions.createdAt));
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
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
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
      .orderBy(desc(answers.votes));

    return { ...result, answers: questionAnswers };
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(questions).values(question).returning();
    return created;
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
        votes: questions.votes,
        viewCount: questions.viewCount,
        answerCount: questions.answerCount,
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
      .orderBy(desc(questions.votes));
  }

  async getAnswersByQuestionId(questionId: string): Promise<Answer[]> {
    return db
      .select()
      .from(answers)
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.votes));
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [created] = await db.insert(answers).values(answer).returning();
    await db
      .update(questions)
      .set({ answerCount: sql`${questions.answerCount} + 1` })
      .where(eq(questions.id, answer.questionId));
    return created;
  }

  async updateAnswerVotes(id: string, direction: "up" | "down"): Promise<void> {
    const increment = direction === "up" ? 1 : -1;
    await db
      .update(answers)
      .set({ votes: sql`${answers.votes} + ${increment}` })
      .where(eq(answers.id, id));
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
}

export const storage = new DatabaseStorage();
