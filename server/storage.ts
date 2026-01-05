import { type User, type InsertUser, type JargonTerm, type InsertJargonTerm } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Jargon Buster
  getJargonTerm(term: string): Promise<JargonTerm | undefined>;
  createJargonTerm(term: InsertJargonTerm): Promise<JargonTerm>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jargonTerms: Map<string, JargonTerm>;

  constructor() {
    this.users = new Map();
    this.jargonTerms = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getJargonTerm(term: string): Promise<JargonTerm | undefined> {
    return this.jargonTerms.get(term);
  }

  async createJargonTerm(insertTerm: InsertJargonTerm): Promise<JargonTerm> {
    const newTerm: JargonTerm = {
      ...insertTerm,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jargonTerms.set(insertTerm.term, newTerm);
    return newTerm;
  }
}

export const storage = new MemStorage();
