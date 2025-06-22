import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PerformanceChartProps {
  indexId: string;
}

interface NapkinChartData {
  title: string;
  description: string;
  data: Array<{
    label: string;
    value: number;
    change: number;
    sector?: string;
  }>;
  performance: {
    '1d': number;
    '7d': number;
    '30d': number;
    '1y': number;
  };
  benchmarks: {
    sp500: number;
    nasdaq: number;
  };
}

const timeRanges = [
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: '10Y', value: '10Y' },
];

export function PerformanceChart({ indexId }: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [napkinChartData, setNapkinChartData] = useState<NapkinChartData | null>(null);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('10Y');
  
  const periods = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
  ];

  const { data: backtestData, isLoading, error } = useQuery({
    queryKey: ['backtest', indexId, timeRange],
    queryFn: async () => {
      const response = await authService.apiRequest(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/indexes/backtest/${indexId}?period=${timeRange}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch backtest data');
      }
      return response.json();
    },
    enabled: !!indexId,
  });

  const generateNapkinChart = async () => {
    if (!indexId) {
      toast({
        title: "Error",
        description: "Index ID is required to generate chart",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingChart(true);
    setChartError(null);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/napkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ indexId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate chart');
      }

      const chartData = await response.json();
      setNapkinChartData(chartData);
      
      toast({
        title: "Success!",
        description: "Napkin AI chart generated successfully",
      });
    } catch (error) {
      console.error('Napkin chart generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chart';
      setChartError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingChart(false);
    }
  };

  const openNapkinEditor = () => {
    if (napkinChartData) {
      // Open Napkin AI editor with the chart data
      const napkinUrl = `https://napkin.ai/create?data=${encodeURIComponent(JSON.stringify(napkinChartData))}`;
      window.open(napkinUrl, '_blank');
    }
  };

  const formatPercent = (value: number) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)}%`;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const assetData = payload.find((p: any) => p.dataKey === 'asset');
      const benchmarkData = payload.find((p: any) => p.dataKey === 'benchmark');
      return (
        <div className="p-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg shadow-lg border border-gray-700">
          <p className="font-bold text-base mb-2">{label}</p>
          {assetData && <p style={{ color: '#8b5cf6' }}>Asset: {formatPercent(assetData.value)}</p>}
          {benchmarkData && <p style={{ color: '#60a5fa' }}>S&P 500: {formatPercent(benchmarkData.value)}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gradient">Backtest Performance</CardTitle>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm transition-all duration-200 ${
                  timeRange === range.value 
                    ? 'gradient-primary text-white shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
           <div className="h-96 flex items-center justify-center text-red-500">
            Error: {(error as Error).message}
          </div>
        ) : backtestData ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
              <div>
                <p className="text-sm text-gray-400">Total returns</p>
                <p className="text-3xl font-bold text-green-400">{formatPercent(backtestData.totalReturn)}</p>
                <p className="text-sm text-gray-500">{formatPercent(backtestData.sp500TotalReturn)} S&P</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Max drawdown</p>
                <p className="text-3xl font-bold text-red-400">{formatPercent(backtestData.maxDrawdown)}</p>
                <p className="text-sm text-gray-500">{formatPercent(backtestData.sp500MaxDrawdown)} S&P</p>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestData.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                     <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#4b5563' }}
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#4b5563' }}
                    axisLine={{ stroke: '#4b5563' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a78bfa', strokeDasharray: '3 3' }}/>
                  <Legend />
                  <Area type="monotone" dataKey="asset" name="Asset" stroke="#8b5cf6" fill="url(#colorAsset)" strokeWidth={2} />
                  <Area type="monotone" dataKey="benchmark" name="S&P 500" stroke="#60a5fa" fill="url(#colorBenchmark)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}
