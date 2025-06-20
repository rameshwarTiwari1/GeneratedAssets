import { 
  users, 
  indexes, 
  stocks, 
  historicalData,
  type User, 
  type InsertUser,
  type Index,
  type InsertIndex,
  type Stock,
  type InsertStock,
  type HistoricalData,
  type InsertHistoricalData
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Index methods
  getIndex(id: number): Promise<Index | undefined>;
  createIndex(index: InsertIndex): Promise<Index>;
  updateIndex(id: number, updates: Partial<Index>): Promise<Index | undefined>;
  getAllIndexes(): Promise<Index[]>;
  getTrendingIndexes(): Promise<Index[]>;
  
  // Stock methods
  addStockToIndex(indexId: number, stock: InsertStock): Promise<Stock>;
  getStocksByIndexId(indexId: number): Promise<Stock[]>;
  updateStock(id: number, updates: Partial<Stock>): Promise<Stock | undefined>;
  
  // Historical data methods
  addHistoricalData(data: InsertHistoricalData): Promise<HistoricalData>;
  getHistoricalData(indexId: number, days?: number): Promise<HistoricalData[]>;
  
  // Portfolio methods
  getPortfolioSummary(): Promise<{
    totalValue: number;
    totalChange1d: number;
    totalChangePercent1d: number;
    activeIndexes: number;
    totalStocks: number;
    avgPerformance: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private indexes: Map<number, Index>;
  private stocks: Map<number, Stock>;
  private historicalData: Map<number, HistoricalData>;
  private currentUserId: number;
  private currentIndexId: number;
  private currentStockId: number;
  private currentHistoricalId: number;

  constructor() {
    this.users = new Map();
    this.indexes = new Map();
    this.stocks = new Map();
    this.historicalData = new Map();
    this.currentUserId = 1;
    this.currentIndexId = 1;
    this.currentStockId = 1;
    this.currentHistoricalId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getIndex(id: number): Promise<Index | undefined> {
    return this.indexes.get(id);
  }

  async createIndex(insertIndex: InsertIndex): Promise<Index> {
    const id = this.currentIndexId++;
    const index: Index = {
      id,
      name: insertIndex.name,
      prompt: insertIndex.prompt,
      description: insertIndex.description || null,
      userId: null,
      createdAt: new Date(),
      isPublic: insertIndex.isPublic || false,
      totalValue: insertIndex.totalValue || 0,
      performance1d: insertIndex.performance1d || 0,
      performance7d: insertIndex.performance7d || 0,
      performance30d: insertIndex.performance30d || 0,
      performance1y: insertIndex.performance1y || 0,
      benchmarkSp500: insertIndex.benchmarkSp500 || 0,
      benchmarkNasdaq: insertIndex.benchmarkNasdaq || 0,
    };
    this.indexes.set(id, index);
    return index;
  }

  async updateIndex(id: number, updates: Partial<Index>): Promise<Index | undefined> {
    const existing = this.indexes.get(id);
    if (!existing) return undefined;
    
    const updated: Index = { ...existing, ...updates };
    this.indexes.set(id, updated);
    return updated;
  }

  async getAllIndexes(): Promise<Index[]> {
    return Array.from(this.indexes.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrendingIndexes(): Promise<Index[]> {
    return Array.from(this.indexes.values())
      .filter(index => index.isPublic)
      .sort((a, b) => b.performance7d - a.performance7d)
      .slice(0, 10);
  }

  async addStockToIndex(indexId: number, insertStock: InsertStock): Promise<Stock> {
    const id = this.currentStockId++;
    const stock: Stock = {
      id,
      indexId: insertStock.indexId,
      symbol: insertStock.symbol,
      name: insertStock.name,
      price: insertStock.price,
      sector: insertStock.sector || null,
      marketCap: insertStock.marketCap || null,
      weight: insertStock.weight || 1,
      change1d: insertStock.change1d || 0,
      changePercent1d: insertStock.changePercent1d || 0,
    };
    this.stocks.set(id, stock);
    return stock;
  }

  async getStocksByIndexId(indexId: number): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => stock.indexId === indexId);
  }

  async updateStock(id: number, updates: Partial<Stock>): Promise<Stock | undefined> {
    const existing = this.stocks.get(id);
    if (!existing) return undefined;
    
    const updated: Stock = { ...existing, ...updates };
    this.stocks.set(id, updated);
    return updated;
  }

  async addHistoricalData(insertData: InsertHistoricalData): Promise<HistoricalData> {
    const id = this.currentHistoricalId++;
    const data: HistoricalData = { ...insertData, id };
    this.historicalData.set(id, data);
    return data;
  }

  async getHistoricalData(indexId: number, days: number = 30): Promise<HistoricalData[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.historicalData.values())
      .filter(data => 
        data.indexId === indexId && 
        new Date(data.date) >= cutoffDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getPortfolioSummary(): Promise<{
    totalValue: number;
    totalChange1d: number;
    totalChangePercent1d: number;
    activeIndexes: number;
    totalStocks: number;
    avgPerformance: number;
  }> {
    const allIndexes = Array.from(this.indexes.values());
    const allStocks = Array.from(this.stocks.values());
    
    const totalValue = allIndexes.reduce((sum, index) => sum + index.totalValue, 0);
    const totalChange1d = allIndexes.reduce((sum, index) => 
      sum + (index.totalValue * index.performance1d / 100), 0
    );
    const totalChangePercent1d = totalValue > 0 ? (totalChange1d / totalValue) * 100 : 0;
    const avgPerformance = allIndexes.length > 0 ? 
      allIndexes.reduce((sum, index) => sum + index.performance1d, 0) / allIndexes.length : 0;

    return {
      totalValue,
      totalChange1d,
      totalChangePercent1d,
      activeIndexes: allIndexes.length,
      totalStocks: allStocks.length,
      avgPerformance,
    };
  }
}

export const storage = new MemStorage();
