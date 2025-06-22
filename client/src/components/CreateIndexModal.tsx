import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, X, Lightbulb, TrendingUp, Zap, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CreateIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const examplePrompts = [
  "AI companies leading in healthcare innovation",
  "Sustainable energy stocks with strong growth potential",
  "Tech companies with female CEOs under 40",
  "ESG-focused dividend stocks",
  "Cybersecurity leaders in the enterprise space",
  "Companies revolutionizing electric vehicles",
  "Biotech firms with breakthrough cancer treatments",
  "Fintech disruptors in emerging markets"
];

const promptCategories = [
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Growth Stocks",
    description: "High-growth companies in emerging sectors",
    examples: ["AI startups", "Biotech innovators", "Clean energy leaders"]
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Thematic Investing",
    description: "Companies aligned with specific trends or themes",
    examples: ["Metaverse companies", "Space exploration", "Quantum computing"]
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Disruptive Tech",
    description: "Technology companies changing industries",
    examples: ["Fintech disruptors", "EdTech innovators", "HealthTech pioneers"]
  }
];

export function CreateIndexModal({ isOpen, onClose }: CreateIndexModalProps) {
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createIndexMutation = useMutation({
    mutationFn: async (data: { prompt: string; description: string }) => {
      const response = await authService.apiRequest('http://localhost:5000/api/generate-index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create index');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Index created successfully!",
        description: "Your new index has been generated and is ready to view.",
      });
      queryClient.invalidateQueries({ queryKey: ['indexes'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create index",
        description: error.message || "Please try again with a different prompt.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setPrompt('');
    setDescription('');
    setSelectedCategory(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    createIndexMutation.mutate({
      prompt: prompt.trim(),
      description: description.trim() || `AI-generated index based on: ${prompt.trim()}`
    });
  };

  const useExample = (example: string) => {
    setPrompt(example);
    setSelectedCategory(null);
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setPrompt('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gradient">
            Create Your AI-Powered Index
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 dark:text-gray-400">
            Describe your investment idea and let AI build a diversified portfolio for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompt Input Section */}
          <Card className="glass-card border-gradient">
            <CardHeader>
              <CardTitle className="text-gradient flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Investment Thesis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe your investment idea
                </label>
                <Textarea
                  placeholder="e.g., 'AI companies leading in healthcare innovation', 'Sustainable energy stocks with strong growth potential'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  disabled={createIndexMutation.isPending}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optional: Add a description
                </label>
                <Input
                  placeholder="Brief description of your investment strategy"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  disabled={createIndexMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Or choose a category to get started
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promptCategories.map((category) => (
                <Card 
                  key={category.title}
                  className={`glass-card cursor-pointer transition-all duration-300 hover-lift ${
                    selectedCategory === category.title 
                      ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950/50' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => selectCategory(category.title)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400">
                          {category.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {category.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {category.examples.map((example, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="mr-1 mb-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Examples */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Popular examples to try
            </h3>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useExample(example)}
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  disabled={createIndexMutation.isPending}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Features Preview */}
          <Card className="gradient-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                What AI will do for you:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Smart Stock Selection</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">AI analyzes thousands of stocks to find the best matches</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Risk Optimization</h4>
                    <p className="text-sm text-green-800 dark:text-green-200">Balanced portfolio with proper diversification</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Instant Analysis</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">Real-time performance tracking and insights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">AI Insights</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-200">Detailed analysis of each stock's relevance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createIndexMutation.isPending}
            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createIndexMutation.isPending || !prompt.trim()}
            className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {createIndexMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Index...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Index
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 