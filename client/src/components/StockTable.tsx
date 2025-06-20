import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '@shared/schema';

interface StockTableProps {
  stocks: Stock[];
}

export function StockTable({ stocks }: StockTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getSectorColor = (sector?: string) => {
    if (!sector) return 'bg-gray-100 text-gray-700';
    
    const sectorColors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-700',
      'Healthcare': 'bg-green-100 text-green-700',
      'Financial': 'bg-yellow-100 text-yellow-700',
      'Energy': 'bg-orange-100 text-orange-700',
      'Consumer': 'bg-purple-100 text-purple-700',
      'Industrial': 'bg-gray-100 text-gray-700',
      'Materials': 'bg-brown-100 text-brown-700',
      'Utilities': 'bg-cyan-100 text-cyan-700',
      'Real Estate': 'bg-pink-100 text-pink-700',
      'Communication': 'bg-indigo-100 text-indigo-700',
    };
    
    const matchingKey = Object.keys(sectorColors).find(key => 
      sector.toLowerCase().includes(key.toLowerCase())
    );
    
    return sectorColors[matchingKey || ''] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change (1D)</TableHead>
            <TableHead>Market Cap</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead className="text-right">Weight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => {
            const isPositive = stock.changePercent1d >= 0;
            
            return (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">
                  {stock.symbol}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {stock.name}
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(stock.price)}
                </TableCell>
                <TableCell>
                  <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>
                      {formatCurrency(stock.change1d)} ({isPositive ? '+' : ''}{stock.changePercent1d.toFixed(2)}%)
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatMarketCap(stock.marketCap)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={getSectorColor(stock.sector)}
                  >
                    {stock.sector || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {stock.weight.toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {stocks.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No stocks found in this index.
        </div>
      )}
    </div>
  );
}
