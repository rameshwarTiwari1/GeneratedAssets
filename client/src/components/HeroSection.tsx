import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, TrendingUp } from 'lucide-react';

const examplePrompts = [
  "AI in healthcare",
  "CEOs under 40", 
  "Sustainable energy",
  "Robotics & automation",
  "Cybersecurity leaders",
  "ESG dividend stocks"
];

export function HeroSection() {
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      try {
        const response = await fetch('http://localhost:5000/api/generate-index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
    <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl p-8 mb-8 text-white border-0">
      <div className="max-w-4xl">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Transform Any Investment Idea Into Reality</h1>
        </div>
        <p className="text-xl mb-8 text-blue-100">
          Use natural language to instantly create custom, investable stock indexes. 
          No coding or deep market knowledge required.
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium mb-3">
            Describe your investment theme
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="e.g., 'AI in healthcare', 'CEOs under 40', 'sustainable energy'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="bg-white text-gray-900 border-0 focus:ring-2 focus:ring-blue-300"
                disabled={generateMutation.isPending}
              />
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !prompt.trim()}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Index
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm text-blue-200">Try these examples:</span>
          {examplePrompts.map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => useExample(example)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm border-0"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
