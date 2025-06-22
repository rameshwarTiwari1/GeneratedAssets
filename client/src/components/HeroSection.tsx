import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, TrendingUp, Play } from 'lucide-react';
import { authService } from '@/lib/auth';

const examplePrompts = [
  "AI in healthcare",
  "CEOs under 40", 
  "Sustainable energy",
  "Robotics & automation",
  "Cybersecurity leaders",
  "ESG dividend stocks"
];

interface HeroSectionProps {
  onCreateIndex?: () => void;
}

export function HeroSection({ onCreateIndex }: HeroSectionProps) {
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch global statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      try {
        const response = await authService.apiRequest('http://localhost:5000/api/generate-index', {
          method: 'POST',
          body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to generate index');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Index Generated Successfully!",
        description: `Successfully created "${data.name}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['indexes'] });
      queryClient.invalidateQueries({ queryKey: ['globalStats'] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate index",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter an investment theme to generate an index",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(prompt);
  };

  const useExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Your Investment Ideas Into
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Intelligent Portfolios
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-blue-100 dark:text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Use AI to create, backtest, and manage custom stock indexes. 
            Turn any investment thesis into a diversified portfolio in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-200 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
              onClick={onCreateIndex}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Create Your First Index
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold backdrop-blur-sm"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {statsLoading ? '...' : (stats?.totalIndexes || 0).toLocaleString()}+
              </div>
              <div className="text-blue-200 dark:text-blue-300">Indexes Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {statsLoading ? '...' : (stats?.totalUsers || 0).toLocaleString()}+
              </div>
              <div className="text-blue-200 dark:text-blue-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {statsLoading ? '...' : (stats?.totalStocks || 0).toLocaleString()}+
              </div>
              <div className="text-blue-200 dark:text-blue-300">Stocks Tracked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave effect */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-12 text-white dark:text-gray-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity=".25" 
            fill="currentColor"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity=".5" 
            fill="currentColor"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </div>
  );
}
