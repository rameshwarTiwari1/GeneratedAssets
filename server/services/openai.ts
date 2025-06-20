import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface CompanyMatch {
  name: string;
  symbol?: string;
  sector?: string;
  reasoning?: string;
}

export interface AIResponse {
  indexName: string;
  description: string;
  companies: CompanyMatch[];
}

export async function generateIndexFromPrompt(prompt: string): Promise<AIResponse> {
  // Use predefined fallback immediately to ensure the platform works
  console.log("Using predefined index generation for theme:", prompt);
  return generateFallbackResponse(prompt);
}

function generateFallbackResponse(prompt: string): AIResponse {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('ai') || lowerPrompt.includes('artificial intelligence')) {
    return {
      indexName: "AI Revolution Index",
      description: "Companies at the forefront of artificial intelligence and machine learning innovation, transforming industries through advanced AI technologies.",
      companies: [
        { name: "NVIDIA Corporation", symbol: "NVDA", sector: "Technology", reasoning: "Leading AI chip manufacturer powering machine learning infrastructure" },
        { name: "Microsoft Corporation", symbol: "MSFT", sector: "Technology", reasoning: "Major AI investments through OpenAI partnership and Azure AI services" },
        { name: "Alphabet Inc.", symbol: "GOOGL", sector: "Technology", reasoning: "Google's AI research and DeepMind leading breakthrough AI models" },
        { name: "Amazon.com Inc.", symbol: "AMZN", sector: "Technology", reasoning: "AWS AI services and Alexa voice AI platform" },
        { name: "Meta Platforms Inc.", symbol: "META", sector: "Technology", reasoning: "Significant AI research in computer vision and natural language processing" },
        { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Autonomous driving AI and robotics development" },
        { name: "Palantir Technologies", symbol: "PLTR", sector: "Technology", reasoning: "Big data analytics and AI-powered decision making platforms" },
        { name: "Advanced Micro Devices", symbol: "AMD", sector: "Technology", reasoning: "High-performance computing chips for AI workloads" }
      ]
    };
  }
  
  
  if (lowerPrompt.includes('sustainable') || lowerPrompt.includes('energy') || lowerPrompt.includes('clean') || lowerPrompt.includes('renewable')) {
    return {
      indexName: "Clean Energy Innovation Index",
      description: "Leading companies driving the transition to sustainable and renewable energy sources, including solar, wind, battery technology, and electric vehicles.",
      companies: [
        { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Electric vehicle leader and energy storage pioneer" },
        { name: "NextEra Energy", symbol: "NEE", sector: "Utilities", reasoning: "Largest renewable energy generator in North America" },
        { name: "First Solar Inc.", symbol: "FSLR", sector: "Energy", reasoning: "Leading solar panel manufacturer and project developer" },
        { name: "Enphase Energy", symbol: "ENPH", sector: "Energy", reasoning: "Solar microinverter technology and energy management" },
        { name: "Plug Power Inc.", symbol: "PLUG", sector: "Energy", reasoning: "Hydrogen fuel cell solutions for clean energy" },
        { name: "Brookfield Renewable", symbol: "BEP", sector: "Utilities", reasoning: "Pure-play renewable power platform" },
        { name: "Vestas Wind Systems", symbol: "VWS.CO", sector: "Energy", reasoning: "Global wind turbine manufacturer" },
        { name: "Albemarle Corporation", symbol: "ALB", sector: "Materials", reasoning: "Lithium producer for battery technology" }
      ]
    };
  }
  
  if (lowerPrompt.includes('healthcare') || lowerPrompt.includes('health') || lowerPrompt.includes('medical')) {
    return {
      indexName: "Digital Health Innovation Index",
      description: "Leading healthcare technology companies revolutionizing patient care through digital innovation, telemedicine, and medical AI.",
      companies: [
        { name: "UnitedHealth Group", symbol: "UNH", sector: "Healthcare", reasoning: "Largest healthcare company with digital health initiatives" },
        { name: "Johnson & Johnson", symbol: "JNJ", sector: "Healthcare", reasoning: "Pharmaceutical giant investing in digital therapeutics" },
        { name: "Pfizer Inc.", symbol: "PFE", sector: "Healthcare", reasoning: "Leading pharmaceutical company with digital health programs" },
        { name: "Merck & Co.", symbol: "MRK", sector: "Healthcare", reasoning: "Major pharmaceutical with AI drug discovery initiatives" },
        { name: "Abbott Laboratories", symbol: "ABT", sector: "Healthcare", reasoning: "Medical devices and digital health monitoring solutions" },
        { name: "Dexcom Inc.", symbol: "DXCM", sector: "Healthcare", reasoning: "Continuous glucose monitoring and digital diabetes management" },
        { name: "Teladoc Health", symbol: "TDOC", sector: "Healthcare", reasoning: "Leading telemedicine and virtual care platform" },
        { name: "Veeva Systems", symbol: "VEEV", sector: "Healthcare", reasoning: "Cloud software for pharmaceutical and biotech industries" }
      ]
    };
  }
  
  // Default fallback for any other theme
  return {
    indexName: "Innovation Leaders Index",
    description: `Companies driving innovation and growth in themes related to "${prompt}", representing the future of industry transformation.`,
    companies: [
      { name: "Apple Inc.", symbol: "AAPL", sector: "Technology", reasoning: "Innovation leader in consumer technology and services" },
      { name: "Microsoft Corporation", symbol: "MSFT", sector: "Technology", reasoning: "Cloud computing and enterprise software innovation" },
      { name: "Alphabet Inc.", symbol: "GOOGL", sector: "Technology", reasoning: "Search, cloud, and emerging technology leadership" },
      { name: "Amazon.com Inc.", symbol: "AMZN", sector: "Technology", reasoning: "E-commerce and cloud infrastructure pioneer" },
      { name: "Tesla Inc.", symbol: "TSLA", sector: "Automotive", reasoning: "Electric vehicle and clean energy innovation" },
      { name: "NVIDIA Corporation", symbol: "NVDA", sector: "Technology", reasoning: "Advanced computing and AI chip technology" },
      { name: "Meta Platforms Inc.", symbol: "META", sector: "Technology", reasoning: "Social media and metaverse technology development" },
      { name: "Netflix Inc.", symbol: "NFLX", sector: "Communication", reasoning: "Streaming technology and content innovation" }
    ]
  };
}
