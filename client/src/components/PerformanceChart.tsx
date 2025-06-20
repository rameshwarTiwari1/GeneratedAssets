import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface PerformanceChartProps {
  indexId?: number;
  data?: {
    portfolio: number;
    sp500: number;
    nasdaq: number;
    alpha: number;
    beta?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    volatility?: number;
  };
}

export function PerformanceChart({ indexId, data }: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  
  const periods = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
  ];

  const performanceData = data || {
    portfolio: 12.4,
    sp500: 8.9,
    nasdaq: 10.2,
    alpha: 3.5,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Portfolio Performance</CardTitle>
          <div className="flex space-x-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className="px-3 py-1 text-sm"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Placeholder */}
        <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Interactive Performance Chart</p>
            <p className="text-sm text-gray-400">Portfolio vs S&P 500 vs NASDAQ</p>
            <p className="text-xs text-gray-400 mt-2">Chart integration coming soon</p>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {performanceData.portfolio > 0 ? '+' : ''}{performanceData.portfolio.toFixed(1)}%
              </div>
            </div>
            <div className="text-sm text-gray-600">Portfolio Return</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {performanceData.sp500 > 0 ? '+' : ''}{performanceData.sp500.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">S&P 500 Return</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className={`text-2xl font-bold ${performanceData.alpha >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {performanceData.alpha > 0 ? '+' : ''}{performanceData.alpha.toFixed(1)}%
              </div>
            </div>
            <div className="text-sm text-gray-600">Alpha Generated</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {performanceData.beta?.toFixed(2) || '1.00'}
            </div>
            <div className="text-sm text-gray-600">Beta</div>
          </div>
        </div>

        {/* Risk Metrics */}
        {(performanceData.sharpeRatio || performanceData.maxDrawdown || performanceData.volatility) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Risk Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceData.sharpeRatio && (
                <div className="p-4 border rounded-lg">
                  <div className="text-lg font-bold">{performanceData.sharpeRatio.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Sharpe Ratio</div>
                  <div className="text-xs text-gray-500 mt-1">Risk-adjusted returns</div>
                </div>
              )}
              
              {performanceData.maxDrawdown && (
                <div className="p-4 border rounded-lg">
                  <div className="text-lg font-bold text-red-600">-{performanceData.maxDrawdown.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Max Drawdown</div>
                  <div className="text-xs text-gray-500 mt-1">Largest peak-to-trough decline</div>
                </div>
              )}
              
              {performanceData.volatility && (
                <div className="p-4 border rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{performanceData.volatility.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Volatility</div>
                  <div className="text-xs text-gray-500 mt-1">Annualized standard deviation</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
