import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Send, MessageSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CreateIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickSuggestions = [
  "AI companies leading in healthcare innovation",
  "Sustainable energy stocks with strong growth potential",
  "Tech companies with female CEOs under 40",
  "ESG-focused dividend stocks",
  "Cybersecurity leaders in the enterprise space",
  "Companies revolutionizing electric vehicles"
];

export function CreateIndexModal({ isOpen, onClose }: CreateIndexModalProps) {
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
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
    onSuccess: (data) => {
      setAiResponse(data);
      setShowAnalysis(true);
      toast({
        title: "Index created successfully!",
        description: `"${data.name}" has been generated with ${data.stocks?.length || 0} stocks.`,
      });
      queryClient.invalidateQueries({ queryKey: ['indexes'] });
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
    setShowDescription(false);
    setAiResponse(null);
    setShowAnalysis(false);
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

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create AI Index
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Describe your investment idea and AI will build a portfolio for you
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 space-y-6">
          {/* AI Welcome Message */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Hi! I'm your AI investment assistant. Tell me about the type of companies or investment theme you're interested in, and I'll create a diversified portfolio for you.
              </p>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 text-xs px-3 py-1"
                  onClick={() => useSuggestion(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* User Input Area */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="e.g., 'AI companies leading in healthcare innovation' or 'Sustainable energy stocks with strong growth potential'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] resize-none border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-2xl"
                disabled={createIndexMutation.isPending}
              />
              
              {showDescription && (
                <Input
                  placeholder="Optional: Add a description for your index"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-xl"
                  disabled={createIndexMutation.isPending}
                />
              )}
              
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  {showDescription ? 'Remove description' : '+ Add description'}
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={createIndexMutation.isPending || !prompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                >
                  {createIndexMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Index
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* AI Processing Message */}
          {createIndexMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl px-4 py-3 max-w-[85%]">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Analyzing thousands of stocks to find the perfect matches for your investment idea...
                </p>
              </div>
            </div>
          )}

          {/* AI Analysis Response */}
          {showAnalysis && aiResponse && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    ✅ Successfully created "{aiResponse.name}" with {aiResponse.stocks?.length || 0} stocks!
                  </p>
                </div>
              </div>

              {/* Investment Thesis */}
              {aiResponse.aiAnalysis?.investmentThesis && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl px-4 py-3 max-w-[85%]">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">Investment Thesis</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {aiResponse.aiAnalysis.investmentThesis}
                    </p>
                  </div>
                </div>
              )}

              {/* Risk Profile & Sector Breakdown */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-2xl px-4 py-3 max-w-[85%]">
                  <div className="space-y-2">
                    {aiResponse.aiAnalysis?.riskProfile && (
                      <div>
                        <span className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Risk Profile: </span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {aiResponse.aiAnalysis.riskProfile}
                        </Badge>
                      </div>
                    )}
                    {aiResponse.aiAnalysis?.sectorBreakdown && (
                      <div>
                        <span className="font-semibold text-purple-900 dark:text-purple-100 text-sm">Sectors: </span>
                        <span className="text-purple-700 dark:text-purple-300 text-sm">
                          {aiResponse.aiAnalysis.sectorBreakdown}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Strengths */}
              {aiResponse.aiAnalysis?.keyStrengths && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-2xl px-4 py-3 max-w-[85%]">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">Key Strengths</h4>
                    <ul className="space-y-1">
                      {aiResponse.aiAnalysis.keyStrengths.map((strength: string, index: number) => (
                        <li key={index} className="text-green-700 dark:text-green-300 text-sm flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Potential Risks */}
              {aiResponse.aiAnalysis?.potentialRisks && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950 rounded-2xl px-4 py-3 max-w-[85%]">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-2">Potential Risks</h4>
                    <ul className="space-y-1">
                      {aiResponse.aiAnalysis.potentialRisks.map((risk: string, index: number) => (
                        <li key={index} className="text-orange-700 dark:text-orange-300 text-sm flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Expected Performance */}
              {aiResponse.aiAnalysis?.expectedPerformance && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl px-4 py-3 max-w-[85%]">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">Performance Outlook</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {aiResponse.aiAnalysis.expectedPerformance}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                  >
                    View Index
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrompt('');
                      setDescription('');
                      setShowDescription(false);
                      setAiResponse(null);
                      setShowAnalysis(false);
                    }}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createIndexMutation.isPending}
            className="border-gray-200 dark:border-gray-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 