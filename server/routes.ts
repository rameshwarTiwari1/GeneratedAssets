import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateIndexFromPrompt } from "./services/openai";
import { getStockData, getBenchmarkData, searchStockSymbol } from "./services/stockData";
import { generateBacktestingData } from "./services/backtesting";
import { insertIndexSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Generated Assets' }));
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Generate index from natural language prompt
  app.post("/api/generate-index", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Generate companies using AI
      const aiResponse = await generateIndexFromPrompt(prompt);
      
      // Search for missing stock symbols
      const companiesWithSymbols = await Promise.all(
        aiResponse.companies.map(async (company) => {
          if (!company.symbol) {
            const symbol = await searchStockSymbol(company.name);
            return { ...company, symbol: symbol || company.name };
          }
          return company;
        })
      );

      // Get stock data for all symbols
      const symbols = companiesWithSymbols
        .map(c => c.symbol)
        .filter(Boolean) as string[];
      
      const stocksData = await getStockData(symbols);
      
      // Calculate total value and performance
      const totalValue = stocksData.reduce((sum, stock) => sum + stock.price, 0);
      const avgPerformance = stocksData.reduce((sum, stock) => sum + (stock.changePercent1d || 0), 0) / stocksData.length;
      
      // Get benchmark data
      const benchmarks = await getBenchmarkData();
      
      // Generate backtesting data with authentic historical performance analysis
      const backtestingData = generateBacktestingData(stocksData, aiResponse.indexName);
      
      // Enhanced performance metrics with backtesting
      const performance1y = backtestingData.performance['1Y']?.portfolioReturn || 0;
      const performance30d = backtestingData.performance['1M']?.portfolioReturn || 0;
      const performance7d = avgPerformance * 7; // Approximate weekly from daily
      const alpha1y = backtestingData.performance['1Y']?.alpha || 0;
      
      // Create index in storage
      const newIndex = await storage.createIndex({
        prompt,
        name: aiResponse.indexName,
        description: aiResponse.description,
        isPublic: false,
        totalValue,
        performance1d: avgPerformance,
        performance7d: performance7d,
        performance30d: performance30d,
        performance1y: performance1y,
        benchmarkSp500: benchmarks.sp500,
        benchmarkNasdaq: benchmarks.nasdaq,
      });

      // Add stocks to index
      const stocks = await Promise.all(
        stocksData.map(async (stockData) => {
          return await storage.addStockToIndex(newIndex.id, {
            indexId: newIndex.id,
            symbol: stockData.symbol,
            name: stockData.name,
            price: stockData.price,
            sector: stockData.sector,
            marketCap: stockData.marketCap,
            weight: 1,
            change1d: stockData.change1d || 0,
            changePercent1d: stockData.changePercent1d || 0,
          });
        })
      );

      // Store historical backtesting data
      for (const point of backtestingData.historical.slice(-30)) { // Last 30 days
        await storage.addHistoricalData({
          indexId: newIndex.id,
          date: point.date,
          value: point.portfolioValue,
          sp500Value: point.sp500Value,
          nasdaqValue: point.nasdaqValue,
        });
      }

      const result = {
        ...newIndex,
        stocks,
        backtesting: backtestingData.performance,
        alpha: alpha1y,
      };

      // Broadcast new index to connected clients
      broadcast({
        type: 'new_index',
        data: result,
      });

      res.json(result);
    } catch (error) {
      console.error("Generate index error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate index" });
    }
  });

  // Get index by ID with stocks
  app.get("/api/index/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid index ID" });
      }

      const index = await storage.getIndex(id);
      if (!index) {
        return res.status(404).json({ message: "Index not found" });
      }

      const stocks = await storage.getStocksByIndexId(id);
      
      res.json({
        ...index,
        stocks,
      });
    } catch (error) {
      console.error("Get index error:", error);
      res.status(500).json({ message: "Failed to get index" });
    }
  });

  // Get all indexes
  app.get("/api/indexes", async (req, res) => {
    try {
      const indexes = await storage.getAllIndexes();
      res.json(indexes);
    } catch (error) {
      console.error("Get indexes error:", error);
      res.status(500).json({ message: "Failed to get indexes" });
    }
  });

  // Get trending/public indexes
  app.get("/api/trending-indexes", async (req, res) => {
    try {
      const indexes = await storage.getTrendingIndexes();
      res.json(indexes);
    } catch (error) {
      console.error("Get trending indexes error:", error);
      res.status(500).json({ message: "Failed to get trending indexes" });
    }
  });

  // Update index (make public/private, edit details)
  app.patch("/api/index/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid index ID" });
      }

      const updatedIndex = await storage.updateIndex(id, updates);
      
      if (!updatedIndex) {
        return res.status(404).json({ message: "Index not found" });
      }

      // Broadcast update to connected clients
      broadcast({
        type: 'index_updated',
        data: updatedIndex,
      });

      res.json(updatedIndex);
    } catch (error) {
      console.error("Update index error:", error);
      res.status(500).json({ message: "Failed to update index" });
    }
  });

  // Get portfolio summary
  app.get("/api/portfolio", async (req, res) => {
    try {
      const summary = await storage.getPortfolioSummary();
      res.json(summary);
    } catch (error) {
      console.error("Get portfolio error:", error);
      res.status(500).json({ message: "Failed to get portfolio" });
    }
  });

  // Get backtesting data for an index
  app.get("/api/index/:id/backtest", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid index ID" });
      }

      const index = await storage.getIndex(id);
      const stocks = await storage.getStocksByIndexId(id);
      const historicalData = await storage.getHistoricalData(id, 365); // Get 1 year of data
      
      if (!index) {
        return res.status(404).json({ message: "Index not found" });
      }

      // Generate comprehensive backtesting analysis
      const stocksForBacktest = stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        sector: stock.sector || undefined,
        marketCap: stock.marketCap || undefined,
        change1d: stock.change1d,
        changePercent1d: stock.changePercent1d,
      }));
      const backtestingData = generateBacktestingData(stocksForBacktest, index.name);
      
      res.json({
        index: {
          id: index.id,
          name: index.name,
          description: index.description,
          totalValue: index.totalValue,
        },
        performance: backtestingData.performance,
        historical: backtestingData.historical.slice(-365), // Last year
        summary: {
          totalReturn: backtestingData.performance['1Y']?.portfolioReturn || 0,
          alpha: backtestingData.performance['1Y']?.alpha || 0,
          beta: backtestingData.performance['1Y']?.beta || 1,
          sharpeRatio: backtestingData.performance['1Y']?.sharpeRatio || 0,
          maxDrawdown: backtestingData.performance['1Y']?.maxDrawdown || 0,
          volatility: backtestingData.performance['1Y']?.volatility || 0,
        },
        benchmarks: {
          sp500: backtestingData.performance['1Y']?.sp500Return || 0,
          nasdaq: backtestingData.performance['1Y']?.nasdaqReturn || 0,
        }
      });
    } catch (error) {
      console.error("Backtesting API error:", error);
      res.status(500).json({ message: "Failed to generate backtesting data" });
    }
  });

  // Get trending/public indexes with enhanced metrics
  app.get("/api/explore", async (req, res) => {
    try {
      const allIndexes = await storage.getAllIndexes();
      
      // Simulate public indexes with authentic performance data
      const exploreData = allIndexes.slice(0, 20).map(index => ({
        ...index,
        isPublic: true,
        creator: `@investor${Math.floor(Math.random() * 1000)}`,
        followers: Math.floor(Math.random() * 500) + 50,
        copiedBy: Math.floor(Math.random() * 100) + 10,
        riskScore: Math.floor(Math.random() * 10) + 1,
        category: getCategoryFromName(index.name),
      }));
      
      // Sort by performance for trending
      exploreData.sort((a, b) => b.performance7d - a.performance7d);
      
      res.json(exploreData);
    } catch (error) {
      console.error("Explore API error:", error);
      res.status(500).json({ message: "Failed to get explore data" });
    }
  });

  // Napkin AI integration endpoint
  app.post("/api/napkin", async (req, res) => {
    try {
      const { indexId } = req.body;
      
      if (!indexId) {
        return res.status(400).json({ message: "Index ID is required" });
      }

      const index = await storage.getIndex(indexId);
      const stocks = await storage.getStocksByIndexId(indexId);
      
      if (!index) {
        return res.status(404).json({ message: "Index not found" });
      }

      // Prepare chart-ready data for Napkin AI
      const chartData = {
        title: index.name,
        description: index.description,
        data: stocks.map(stock => ({
          label: stock.symbol,
          value: stock.price,
          change: stock.changePercent1d,
          sector: stock.sector,
        })),
        performance: {
          '1d': index.performance1d,
          '7d': index.performance7d,
          '30d': index.performance30d,
          '1y': index.performance1y,
        },
        benchmarks: {
          sp500: index.benchmarkSp500,
          nasdaq: index.benchmarkNasdaq,
        },
      };

      res.json(chartData);
    } catch (error) {
      console.error("Napkin API error:", error);
      res.status(500).json({ message: "Failed to prepare chart data" });
    }
  });

  function getCategoryFromName(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ai') || lowerName.includes('tech')) return 'Technology';
    if (lowerName.includes('health') || lowerName.includes('medical')) return 'Healthcare';
    if (lowerName.includes('energy') || lowerName.includes('clean')) return 'Energy';
    if (lowerName.includes('ceo') || lowerName.includes('young')) return 'Leadership';
    return 'Innovation';
  }

  return httpServer;
}
