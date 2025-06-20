import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeroSection } from '@/components/HeroSection';
import { IndexCard } from '@/components/IndexCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';
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

export default function Dashboard() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();

  // Fetch recent indexes
  const { data: indexes = [], isLoading: indexesLoading } = useQuery({
    queryKey: ['/api/indexes'],
  });

  // Fetch trending indexes
  const { data: trendingIndexes = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/trending-indexes'],
  });

  // Fetch portfolio summary
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio'],
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_index') {
        toast({
          title: "New Index Created!",
          description: `"${lastMessage.data.name}" is now available`,
        });
      } else if (lastMessage.type === 'index_updated') {
        toast({
          title: "Index Updated",
          description: `"${lastMessage.data.name}" has been modified`,
        });
      }
    }
  }, [lastMessage, toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const trendingData = [
    { 
      name: "Space Technology", 
      icon: Rocket, 
      badge: "Trending", 
      badgeColor: "bg-green-100 text-green-700",
      performance: 8.2,
      stocks: 15,
      creator: "@SpaceInvestor"
    },
    { 
      name: "Clean Energy", 
      icon: Leaf, 
      badge: "Hot", 
      badgeColor: "bg-red-100 text-red-700",
      performance: 6.5,
      stocks: 22,
      creator: "@GreenFuture"
    },
    { 
      name: "Gaming Giants", 
      icon: Gamepad2, 
      badge: "Rising", 
      badgeColor: "bg-blue-100 text-blue-700",
      performance: 4.3,
      stocks: 11,
      creator: "@GameTrader"
    },
    { 
      name: "Biotech Breakthrough", 
      icon: PillBottle, 
      badge: "New", 
      badgeColor: "bg-orange-100 text-orange-700",
      performance: 12.1,
      stocks: 18,
      creator: "@BioInvest"
    },
  ];

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
                    {indexes.slice(0, 5).map((index: any) => (
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
                <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'S&P 500', value: '4,567.89', change: '+0.8%', positive: true },
                  { name: 'NASDAQ', value: '14,234.56', change: '-0.3%', positive: false },
                  { name: 'DOW', value: '34,789.12', change: '+0.5%', positive: true },
                ].map((market) => (
                  <div key={market.name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{market.name}</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{market.value}</div>
                      <div className={`text-sm ${market.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {market.change}
                      </div>
                    </div>
                  </div>
                ))}
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
              <CardTitle className="text-xl font-semibold">Trending Indexes</CardTitle>
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
                {trendingData.slice(0, 4).map((trend, index) => {
                  const IconComponent = trend.icon;
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-4 w-4 text-blue-600" />
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
                          <span className="text-lg font-semibold text-green-600">
                            +{trend.performance}%
                          </span>
                          <span className="text-sm text-gray-500">7 days</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
