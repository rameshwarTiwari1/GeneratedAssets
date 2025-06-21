import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateIndexFromPrompt } from "./services/openai";
import { 
  getStockData, 
  getBenchmarkData, 
  searchStockSymbol, 
  getStockDataFromPolygon, 
  getStockDataFromFinnhub 
} from "./services/stockData";
import { generateBacktestingData } from "./services/backtesting";
import { insertIndexSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Needs to be smaller than or equal to 15
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages should not be compressed.
    }
  });
  
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`New WebSocket connection from ${clientIp}`);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to Generated Assets',
      timestamp: new Date().toISOString()
    }));
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Handle client disconnection
    ws.on('close', (code, reason) => {
      console.log(`Client ${clientIp} disconnected. Code: ${code}, Reason: ${reason.toString()}`);
    });
    
    // Handle incoming messages (if needed)
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      // Echo the message back to the client
      ws.send(JSON.stringify({
        type: 'echo',
        data: message.toString(),
        timestamp: new Date().toISOString()
      }));
    });
  });
  
  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
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

  // Get all indexes with stocks
  app.get("/api/indexes", async (req, res) => {
    try {
      const indexes = await storage.getAllIndexes();
      const indexesWithStocks = [];
      
      for (const index of indexes) {
        const stocks = await storage.getStocksByIndexId(index.id);
        indexesWithStocks.push({ ...index, stocks });
      }
      
      res.json(indexesWithStocks);
    } catch (error) {
      console.error("Get indexes error:", error);
      res.status(500).json({ message: "Failed to get indexes" });
    }
  });

  // Get trending/public indexes
  app.get("/api/trending-indexes", async (req, res) => {
    try {
      // Get all indexes and add trending metrics
      const allIndexes = await storage.getAllIndexes();
      console.log("allIndexes",allIndexes);
      
      // Sort by performance and limit to top 10
      const trending = allIndexes
        .map(index => ({
          ...index,
          // Add trending metrics
          followers: Math.floor(Math.random() * 1000) + 100, // Simulate followers
          views: Math.floor(Math.random() * 5000) + 1000,    // Simulate views
          performanceScore: index.performance7d * 0.6 + index.performance30d * 0.4 // Weighted score
        }))
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 10);
      
      res.json(trending);
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

  // Universal search endpoint for stocks, indices, crypto, ETFs, etc.
  app.get("/api/search", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      console.log(`🔍 Performing search for: ${query}`);
      
      // Try Alpha Vantage search first
      try {
        const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
        console.log(`Calling Alpha Vantage: ${searchUrl}`);
        const searchResponse = await fetch(searchUrl);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log('Alpha Vantage response:', JSON.stringify(searchData, null, 2));
          
          if (searchData.bestMatches && searchData.bestMatches.length > 0) {
            console.log(`✅ Found ${searchData.bestMatches.length} results from Alpha Vantage`);
            return res.json({
              success: true,
              source: 'alphavantage',
              results: searchData.bestMatches.map((item: any) => ({
                symbol: item['1. symbol'],
                name: item['2. name'],
                type: item['3. type']?.toLowerCase() || 'unknown',
                region: item['4. region'],
                currency: item['8. currency'] || 'USD',
                market: item['4. region'] || 'Unknown',
                last_updated: new Date().toISOString()
              }))
            });
          }
        } else {
          console.log(`🔴 Alpha Vantage API returned status: ${searchResponse.status}`);
        }
      } catch (avError) {
        console.log('🔴 Alpha Vantage search failed, trying Finnhub...', avError);
      }

      // Fallback to Finnhub search
      try {
        if (!process.env.FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY not set');
        
        const finnhubUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`;
        console.log(`Calling Finnhub: ${finnhubUrl}`);
        const finnhubResponse = await fetch(finnhubUrl);
        
        if (finnhubResponse.ok) {
          const finnhubData = await finnhubResponse.json();
          console.log('Finnhub response:', JSON.stringify(finnhubData, null, 2));
          
          if (finnhubData.result && finnhubData.result.length > 0) {
            console.log(`✅ Found ${finnhubData.result.length} results from Finnhub`);
            return res.json({
              success: true,
              source: 'finnhub',
              results: finnhubData.result.slice(0, 20).map((item: any) => ({
                symbol: item.symbol,
                name: item.description || item.symbol,
                type: item.type?.toLowerCase() || 'unknown',
                currency: item.currency || 'USD',
                exchange: item.exchange || 'Unknown',
                region: item.country || 'US',
                last_updated: new Date().toISOString()
              }))
            });
          }
        } else {
          console.log(`🔴 Finnhub API returned status: ${finnhubResponse.status}`);
        }
      } catch (finnhubError) {
        console.log('🔴 Finnhub search failed, trying Polygon...', finnhubError);
      }

      // Final fallback to Polygon search
      try {
        if (!process.env.POLYGON_API_KEY) throw new Error('POLYGON_API_KEY not set');
        
        const searchUrl = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=20&apiKey=${process.env.POLYGON_API_KEY}`;
        console.log(`Calling Polygon: ${searchUrl}`);
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.POLYGON_API_KEY}`
          }
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log('Polygon response:', JSON.stringify(searchData, null, 2));
          
          if (searchData.results && searchData.results.length > 0) {
            console.log(`✅ Found ${searchData.results.length} results from Polygon`);
            return res.json({
              success: true,
              source: 'polygon',
              results: searchData.results.map((item: any) => ({
                symbol: item.ticker,
                name: item.name,
                type: item.type?.toLowerCase() || 'unknown',
                market: item.market || 'Unknown',
                currency: item.currency_name || 'USD',
                exchange: item.primary_exchange || 'Unknown',
                region: item.locale || 'US',
                last_updated: item.last_updated_utc || new Date().toISOString()
              }))
            });
          }
        } else {
          console.log(`🔴 Polygon API returned status: ${searchResponse.status}`);
        }
      } catch (polygonError) {
        console.error('🔴 All search providers failed:', polygonError);
      }

      // If all providers fail, return empty results
      console.log('ℹ️ No results found from any provider');
      return res.json({
        success: true,
        source: 'none',
        results: [],
        message: 'No results found. Please try a different search term.'
      });
      
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform search',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Additional endpoint to get current stock price (for the custom stocks feature)
app.get("/api/stock-price/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Try Finnhub for real-time price
    try {
      const priceUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`;
      const response = await fetch(priceUrl);
      
      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          symbol: symbol,
          current_price: data.c,
          change: data.d,
          change_percent: data.dp,
          high: data.h,
          low: data.l,
          open: data.o,
          previous_close: data.pc
        });
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
    }
    
    // Fallback to Alpha Vantage
    try {
      const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
      const response = await fetch(avUrl);
      
      if (response.ok) {
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote) {
          return res.json({
            success: true,
            symbol: symbol,
            current_price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            open: parseFloat(quote['02. open']),
            previous_close: parseFloat(quote['08. previous close'])
          });
        }
      }
    } catch (error) {
      console.error('Error fetching from Alpha Vantage:', error);
    }
    
    res.status(404).json({
      success: false,
      message: 'Stock price not found'
    });
    
  } catch (error) {
    console.error('Stock price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock price',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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

  // Get market data for major indices
  app.get('/api/market-data', async (req, res) => {
    try {
      const benchmarkData = await getBenchmarkData();
      
      // Get additional indices data
      const [dowData, vixData] = await Promise.all([
        getStockDataFromPolygon('DIA') || getStockDataFromFinnhub('DIA'), // DOW ETF
        getStockDataFromPolygon('^VIX') || getStockDataFromFinnhub('^VIX'), // VIX

      ]);

      // Ensure we have valid data before sending response
      if (!benchmarkData) {
        throw new Error('Failed to fetch benchmark data');
      }

      const responseData = {
        sp500: {
          symbol: 'S&P 500',
          value: benchmarkData.sp500,
          change1d: benchmarkData.sp500 * 0.01, // Example change
          changePercent1d: 1.0 // Example percentage change
        },
        nasdaq: {
          symbol: 'NASDAQ',
          value: benchmarkData.nasdaq,
          change1d: benchmarkData.nasdaq * 0.015, // Example change
          changePercent1d: 1.5 // Example percentage change
        },
        dow: {
          symbol: 'DOW',
          value: dowData?.price || 35000, // Fallback value if data fetch fails
          change1d: dowData?.change1d || 0,
          changePercent1d: dowData?.changePercent1d || 0
        },
        vix: {
          symbol: 'VIX',
          value: vixData?.price || 20, // Fallback value if data fetch fails
          change1d: vixData?.change1d || 0,
          changePercent1d: vixData?.changePercent1d || 0
        }
      };

      // Set proper content type and send response
      res.setHeader('Content-Type', 'application/json');
      res.json(responseData);
    } catch (error) {
      console.error('Error in /api/market-data:', error);
      res.status(500).json({
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
