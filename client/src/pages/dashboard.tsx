import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeroSection } from '@/components/HeroSection';
import { IndexCard } from '@/components/IndexCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/utils/debounce';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  TrendingUp, 
  BarChart3, 
  Users, 
  DollarSign,
  Lightbulb, 
  Rocket,
  Leaf,
  Gamepad2,
  PillBottle
} from 'lucide-react';
import { Link } from 'wouter';

// Type definitions
interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

interface StockSearchResult {
  symbol: string;
  name: string;
}

interface CustomStock {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface IndexData {
  id: string;
  name: string;
  stocks?: any[];
  performance7d?: number;
  createdAt: string;
  tags?: string[];
  creator?: string;
}

interface TrendingData {
  id: string;
  name: string;
  stocks: number;
  performance: number;
  createdAt: string;
  isPositive: boolean;
  badge: string;
  badgeColor: string;
  creator: string;
}

interface PortfolioData {
  totalValue: number;
  totalChange1d: number;
  totalChangePercent1d: number;
  activeIndexes: number;
  totalStocks: number;
  avgPerformance: number;
}

interface MarketDataItem {
  value: string;
  change: number;
  changePercent: number;
}

interface MarketData {
  sp500?: MarketDataItem;
  nasdaq?: MarketDataItem;
  dow?: MarketDataItem;
  vix?: MarketDataItem;
}

interface StockPriceResponse {
  success: boolean;
  current_price: number;
  change: number;
  change_percent: number;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [customStocks, setCustomStocks] = useState<CustomStock[]>([]);
  
  // Ref for the search container to handle outside clicks
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Mock values since WebSocket is disabled
  const lastMessage = null;
  const isConnected = false;

  // Fetch recent indexes
  const { data: indexes = [], isLoading: indexesLoading } = useQuery({
    queryKey: ['indexes'],
    queryFn: async (): Promise<IndexData[]> => {
      const response = await fetch('http://localhost:5000/api/indexes');
      if (!response.ok) {
        throw new Error('Failed to fetch indexes');
      }
      return response.json();
    },
  });

  // Fetch trending indexes
  const { data: trendingIndexes = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-indexes'],
    queryFn: async (): Promise<IndexData[]> => {
      const response = await fetch('http://localhost:5000/api/trending-indexes');
      if (!response.ok) {
        throw new Error('Failed to fetch trending indexes');
      }
      return response.json();
    },
  });

  // Fetch portfolio summary
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async (): Promise<PortfolioData> => {
      const response = await fetch('http://localhost:5000/api/portfolio');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return response.json();
    },
  });

  // Fetch market data for major indices
  const { data: marketData } = useQuery({
    queryKey: ['market-data'],
    queryFn: async (): Promise<MarketData> => {
      const response = await fetch('http://localhost:5000/api/market-data');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to get badge colors based on tag
  const getBadgeColor = (tag: string): string => {
    const colors: Record<string, string> = {
      'Trending': 'bg-green-100 text-green-700',
      'Hot': 'bg-red-100 text-red-700',
      'Rising': 'bg-blue-100 text-blue-700',
      'New': 'bg-orange-100 text-orange-700'
    };
    return colors[tag] || 'bg-gray-100 text-gray-700';
  };

  // Map the trending indexes to match the expected format
  const trendingData: TrendingData[] = trendingIndexes.map((index: IndexData) => ({
    id: index.id,
    name: index.name,
    stocks: index.stocks?.length || 0,
    performance: index.performance7d || 0,
    createdAt: index.createdAt,
    isPositive: (index.performance7d || 0) >= 0,
    badge: index.tags?.[0] || 'Trending',
    badgeColor: getBadgeColor(index.tags?.[0] || 'Trending'),
    creator: index.creator || '@Investor'
  }));
console.log("trendingData",trendingData);

  // Search function - only called by debounced function
  const searchStocks = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowSearchDropdown(true);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Create a debounced version of the search function
  const debouncedSearch = useMemo(
    () => debounce(searchStocks, 800), // 800ms delay to reduce API calls
    [searchStocks]
  );

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
      // Cancel any pending debounced calls
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    }
  }, [debouncedSearch]);

  // Function to handle adding stocks
  const addCustomStock = async (stock: StockSearchResult): Promise<void> => {
    try {
      // Check if stock already exists
      if (customStocks.some(s => s.symbol === stock.symbol)) {
        toast({
          title: "Stock already added",
          description: `${stock.symbol} is already in your watchlist`,
          variant: "default"
        });
        setSearchQuery('');
        setShowSearchDropdown(false);
        setSearchResults([]);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/stock-price/${stock.symbol}`);
      const priceData: StockPriceResponse = await response.json();
      
      const newStock: CustomStock = {
        symbol: stock.symbol,
        name: stock.name,
        value: priceData.success ? priceData.current_price : 0,
        change: priceData.success ? priceData.change : 0,
        changePercent: priceData.success ? priceData.change_percent : 0
      };
      
      setCustomStocks(prev => [...prev, newStock]);
      
      toast({
        title: "Stock added",
        description: `${stock.symbol} has been added to your watchlist`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error fetching stock price:', error);
      // Add stock without price data
      const newStock: CustomStock = {
        symbol: stock.symbol,
        name: stock.name,
        value: 0,
        change: 0,
        changePercent: 0
      };
      setCustomStocks(prev => [...prev, newStock]);
      
      toast({
        title: "Stock added (no price data)",
        description: `${stock.symbol} has been added but price data is unavailable`,
        variant: "default"
      });
    }
    
    // Clear search state
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  // Function to remove custom stocks
  const removeCustomStock = (symbol: string): void => {
    setCustomStocks(prev => prev.filter(stock => stock.symbol !== symbol));
    toast({
      title: "Stock removed",
      description: `${symbol} has been removed from your watchlist`,
      variant: "default"
    });
  };

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown]);

  // Cleanup debounce on component unmount
  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Generated Assets</span>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">BETA</Badge>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-gray-900 font-medium border-b-2 border-blue-600 pb-4">
                  Dashboard
                </Link>
                <Link href="/indexes" className="text-gray-600 hover:text-gray-900 pb-4">
                  My Indexes
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-gray-900 pb-4">
                  Explore
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900 pb-4">
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="text-sm font-medium text-gray-900">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <HeroSection />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Recent Indexes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">Recent Indexes</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {indexesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : indexes.length > 0 ? (
                  <div className="space-y-0">
                    {indexes.slice(0, 5).map((index: IndexData) => (
                      <IndexCard key={index.id} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No indexes created yet</p>
                    <p className="text-sm">Use the form above to create your first index</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Portfolio Stats */}
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(portfolio?.totalValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Today's Change</span>
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(portfolio?.totalChange1d || 0)} (+{(portfolio?.totalChangePercent1d || 0).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Indexes</span>
                    <span className="font-semibold text-gray-900">{portfolio?.activeIndexes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Stocks</span>
                    <span className="font-semibold text-gray-900">{portfolio?.totalStocks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Performance</span>
                    <span className="font-semibold text-green-600">
                      +{(portfolio?.avgPerformance || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
                  <div className="relative" ref={searchContainerRef}>
                    <div className="flex items-center space-x-1">
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                      <Input
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9 h-8 text-sm w-32"
                      />
                    </div>
                    
                    {/* Search Dropdown */}
                    {showSearchDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-3 text-center text-sm text-gray-500">Searching...</div>
                        ) : searchResults.length > 0 ? (
                          searchResults.slice(0, 5).map((stock) => (
                            <button
                              key={stock.symbol}
                              onClick={() => addCustomStock(stock)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-sm">{stock.symbol}</div>
                                <div className="text-xs text-gray-500 truncate">{stock.name}</div>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400" />
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-gray-500">No results found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Custom Added Stocks */}
                {customStocks.map((stock: CustomStock) => (
                  <div key={stock.symbol} className="flex justify-between items-center group">
                    <span className="text-sm text-gray-600">{stock.symbol}</span>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${stock.value.toFixed(2)}
                        </div>
                        <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%)
                        </div>
                      </div>
                      <button
                        onClick={() => removeCustomStock(stock.symbol)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Existing Market Data */}
                {marketData ? (
                  <>
                    {[
                      { key: 'sp500' as keyof MarketData, name: 'S&P 500' },
                      { key: 'nasdaq' as keyof MarketData, name: 'NASDAQ' },
                      { key: 'dow' as keyof MarketData, name: 'DOW' },
                      { key: 'vix' as keyof MarketData, name: 'Volatility (VIX)' },
                    ].map(({ key, name }) => {
                      const data = marketData[key];
                      if (!data) return null;
                      
                      const isPositive = (data.changePercent || 0) >= 0;
                      const changeSign = isPositive ? '+' : '';
                      
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{name}</span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {parseFloat(data.value).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {changeSign}{data.change?.toFixed(2)} ({changeSign}{data.changePercent?.toFixed(2)}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">AI Suggestions</h3>
                </div>
                <p className="text-sm text-blue-800 mb-4">Based on market trends and your portfolio:</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left p-3 bg-white hover:bg-blue-50 border-blue-200 text-sm"
                  >
                    "Cybersecurity leaders" - High growth potential
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left p-3 bg-white hover:bg-blue-50 border-blue-200 text-sm"
                  >
                    "ESG dividend stocks" - Sustainable income
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trending Indexes */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">Your Trending Indexes</CardTitle>
              <div className="flex space-x-2">
                <Button variant="default" size="sm">This Week</Button>
                <Button variant="outline" size="sm">This Month</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trendingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trendingData.map((trend: TrendingData) => (
                  <Card key={trend.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {trend.name.includes('Space') ? <Rocket className="h-4 w-4 text-blue-600" /> :
                             trend.name.includes('Energy') ? <Leaf className="h-4 w-4 text-green-600" /> :
                             trend.name.includes('Gaming') ? <Gamepad2 className="h-4 w-4 text-purple-600" /> :
                             <BarChart3 className="h-4 w-4 text-blue-600" />}
                          </div>
                          <Badge className={trend.badgeColor}>
                            {trend.badge}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{trend.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {trend.stocks} stocks • Created by {trend.creator}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.isPositive ? '+' : ''}{trend.performance.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500">7 days</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <PerformanceChart />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-3 w-3 text-white" />
                </div>
                <span className="font-bold text-gray-900">Generated Assets</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-powered investment tool that transforms ideas into investable stock indexes.
              </p>
            </div>
            {[
              {
                title: 'Platform',
                links: ['How it works', 'Pricing', 'API Access', 'Enterprise']
              },
              {
                title: 'Resources', 
                links: ['Documentation', 'Tutorials', 'Blog', 'Support']
              },
              {
                title: 'Company',
                links: ['About', 'Careers', 'Privacy', 'Terms']
              }
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 mb-3">{section.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href="#" className="hover:text-gray-900">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 flex justify-between items-center">
            <p className="text-sm text-gray-600">© 2024 Generated Assets. All rights reserved.</p>
            <div className="flex space-x-4">
              {['twitter', 'linkedin', 'github'].map((social) => (
                <Link key={social} href="#" className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
