import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockTable } from '@/components/StockTable';
import { PerformanceChart } from '@/components/PerformanceChart';
import { 
  ArrowLeft, 
  Share, 
  Edit,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Globe,
  Lock
} from 'lucide-react';
import { Link } from 'wouter';

export default function IndexDetail() {
  const [match, params] = useRoute('/index/:id');
  const indexId = params?.id ? parseInt(params.id) : null;

  const { data: indexData, isLoading, error } = useQuery({
    queryKey: ['/api/index', indexId],
    enabled: !!indexId,
  });

  if (!match || !indexId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Index</h1>
          <Link href="/">
            <Button>Go Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !indexData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Index Not Found</h1>
          <p className="text-gray-600 mb-4">The requested index could not be found.</p>
          <Link href="/">
            <Button>Go Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const isPositive = indexData.performance1d >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{indexData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(indexData.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{indexData.stocks?.length || 0} stocks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {indexData.isPublic ? (
                      <>
                        <Globe className="h-3 w-3" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Index Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Total Value</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(indexData.totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">1D Performance</span>
              </div>
              <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{indexData.performance1d.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">vs S&P 500</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                +{(indexData.performance1d - 0.8).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">vs NASDAQ</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                +{(indexData.performance1d + 0.3).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Index Description */}
        {indexData.description && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Investment Thesis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{indexData.description}</p>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Generated from: "{indexData.prompt}"
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Chart */}
        <div className="mb-8">
          <PerformanceChart 
            indexId={indexData.id}
            data={{
              portfolio: indexData.performance1d,
              sp500: 0.8,
              nasdaq: -0.3,
              alpha: indexData.performance1d - 0.8,
            }}
          />
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings ({indexData.stocks?.length || 0} stocks)</CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable stocks={indexData.stocks || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
