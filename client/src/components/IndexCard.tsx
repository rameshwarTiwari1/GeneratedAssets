import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Share, 
  MoreHorizontal,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Index, Stock } from '@shared/schema';

interface IndexCardProps {
  index: Index & { stocks?: Stock[] };
  variant?: 'recent' | 'trending';
  onClick?: () => void;
}

export function IndexCard({ index, variant = 'recent', onClick }: IndexCardProps) {
  const isPositive = index.performance1d >= 0;
  const performance = variant === 'trending' ? index.performance7d : index.performance1d;
  const timeLabel = variant === 'trending' ? '7 days' : 'Today';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (variant === 'trending') {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Trending
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="p-1">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1">{index.name}</h3>
          <p className="text-sm text-gray-600 mb-3">
            {index.stocks?.length || 0} stocks • Created {formatDate(index.createdAt)}
          </p>
          
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{performance.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">{timeLabel}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0 py-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600" onClick={onClick}>
            {index.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(index.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-3 w-3" />
              <span>{index.stocks?.length || 0} stocks</span>
            </div>
            {index.isPublic && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Public</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {isPositive ? '+' : ''}{performance.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">{timeLabel}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>Value: {formatCurrency(index.totalValue)}</span>
          </div>
          <span className={`${index.performance1d > 0 ? 'text-green-600' : 'text-red-600'}`}>
            vs S&P 500: {index.performance1d > 0 ? '+' : ''}{(index.performance1d - 0.8).toFixed(1)}%
          </span>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
