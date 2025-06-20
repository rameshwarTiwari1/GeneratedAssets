import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateIndexFromPrompt } from "./services/openai";
import { getStockData, getBenchmarkData, searchStockSymbol } from "./services/stockData";
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
      
      // Create index in storage
      const newIndex = await storage.createIndex({
        prompt,
        name: aiResponse.indexName,
        description: aiResponse.description,
        isPublic: false,
        totalValue,
        performance1d: avgPerformance,
        performance7d: 0,
        performance30d: 0,
        performance1y: 0,
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

      const result = {
        ...newIndex,
        stocks,
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

  return httpServer;
}
