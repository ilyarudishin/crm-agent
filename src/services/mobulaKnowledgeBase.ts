// Mobula Knowledge Base for Smart Responses
export class MobulaKnowledgeBase {
  
  // Core product information from docs.mobula.io
  private static knowledge = {
    introduction: {
      description: "Mobula is a comprehensive crypto data platform providing real-time and historical data for DeFi and crypto applications.",
      mainServices: [
        "Real-time crypto data APIs",
        "Historical price data",
        "DeFi protocols data",
        "NFT market data", 
        "Cross-chain analytics",
        "Portfolio tracking APIs"
      ]
    },

    apis: {
      dataAPI: {
        description: "Access real-time and historical crypto data",
        features: [
          "Price data for 20M+ crypto assets",
          "Market cap and volume data",
          "DeFi protocol metrics",
          "Cross-chain data aggregation",
          "Real-time WebSocket feeds"
        ],
        useCases: [
          "Trading applications",
          "Portfolio trackers", 
          "DeFi dashboards",
          "Research platforms",
          "Market analysis tools"
        ]
      },
      
      portfolioAPI: {
        description: "Track and analyze crypto portfolios across multiple chains",
        features: [
          "Multi-chain portfolio tracking",
          "Real-time balance updates",
          "Historical performance",
          "Transaction history",
          "Yield farming tracking"
        ]
      },

      priceAPI: {
        description: "Accurate real-time and historical price data",
        features: [
          "Real-time price feeds",
          "Historical OHLCV data",
          "Price alerts",
          "Custom time intervals",
          "Multiple exchange aggregation"
        ]
      }
    },

    pricing: {
      freeTier: {
        description: "Free tier with generous limits for developers",
        limits: "100,000 API calls per month",
        features: ["Basic price data", "Limited historical data", "Community support"]
      },
      
      paidPlans: {
        description: "Scalable plans for production applications",
        features: [
          "Higher rate limits",
          "Extended historical data",
          "Premium endpoints", 
          "Priority support",
          "Custom integrations"
        ],
        note: "Contact sales for enterprise pricing"
      }
    },

    gettingStarted: {
      steps: [
        "Sign up for free API key at mobula.io",
        "Read the documentation at docs.mobula.io", 
        "Make your first API call",
        "Integrate into your application",
        "Monitor usage in dashboard"
      ],
      
      quickStart: {
        apiKey: "Get your API key from the dashboard",
        firstCall: "Start with the /market/data endpoint",
        documentation: "Full docs available at docs.mobula.io"
      }
    },

    support: {
      channels: [
        "Documentation: docs.mobula.io",
        "Discord community",
        "Email support",
        "GitHub issues",
        "Twitter @MobulaFi"
      ],
      
      responseTime: "Typically within 24 hours for technical support"
    }
  };

  public static getResponse(query: string): { response?: string; followUp?: string; needsHuman?: boolean } {
    const q = query.toLowerCase();
    
    // Pricing questions
    if (this.containsAny(q, ['price', 'cost', 'pricing', 'free', 'plan', 'tier', 'expensive'])) {
      return {
        response: `💰 **Mobula Pricing**\n\n**🆓 Free Tier:**\n• 100,000 API calls/month\n• Basic price data access\n• Community support\n• Perfect for testing & small projects\n\n**📈 Paid Plans:**\n• Higher rate limits for production\n• Extended historical data\n• Premium endpoints & features\n• Priority support\n\n*Enterprise pricing available - contact our sales team!*`,
        followUp: "Would you like help getting started with the free tier, or do you need enterprise pricing info?"
      };
    }

    // What is Mobula / Product questions
    if (this.containsAny(q, ['what is', 'what does', 'mobula', 'product', 'service', 'platform'])) {
      return {
        response: `🚀 **About Mobula**\n\nMobula is the leading crypto data platform providing:\n\n📊 **Real-time Data APIs**\n• 20M+ crypto assets\n• Live price feeds\n• Market cap & volume\n\n🔗 **Cross-chain Analytics**\n• Multi-chain portfolio tracking\n• DeFi protocol metrics\n• NFT market data\n\n⚡ **Built for Developers**\n• Easy-to-use REST APIs\n• Real-time WebSocket feeds\n• Comprehensive documentation`,
        followUp: "What specific data or features are you most interested in?"
      };
    }

    // API / Technical questions
    if (this.containsAny(q, ['api', 'endpoint', 'integration', 'code', 'develop', 'technical'])) {
      return {
        response: `🔧 **Mobula APIs**\n\n**📈 Data API**\n• Real-time & historical prices\n• Market data for 20M+ assets\n• DeFi metrics & analytics\n\n**💼 Portfolio API**\n• Multi-chain tracking\n• Real-time balance updates\n• Transaction history\n\n**🚀 Getting Started:**\n1. Get free API key at mobula.io\n2. Check docs.mobula.io\n3. Start with /market/data endpoint\n4. Integrate & build!`,
        followUp: "Need help with a specific API endpoint or integration?"
      };
    }

    // Documentation questions
    if (this.containsAny(q, ['docs', 'documentation', 'document', 'link', 'url', 'website', 'guide', 'manual', 'reference'])) {
      return {
        response: `📚 **Mobula Documentation**\n\n**🔗 Main Documentation:** docs.mobula.io\n\nHere you'll find:\n• Complete API reference\n• Integration guides\n• Code examples\n• Authentication setup\n• Rate limits & best practices\n\n**📖 Quick Links:**\n• Getting Started Guide\n• API Endpoints Reference\n• SDK Documentation\n• Sample Projects\n\n**💡 The docs are your best friend for technical integration!**`,
        followUp: "Looking for anything specific in the docs? I can point you to the right section!"
      };
    }

    // Getting started questions
    if (this.containsAny(q, ['start', 'begin', 'setup', 'first time', 'new', 'tutorial'])) {
      return {
        response: `🎯 **Getting Started with Mobula**\n\n**Step 1:** Sign up for free at mobula.io\n**Step 2:** Get your API key from dashboard\n**Step 3:** Read docs at docs.mobula.io\n**Step 4:** Make your first API call to /market/data\n**Step 5:** Build your application!\n\n**💡 Pro Tip:** Start with our free tier - 100K calls/month is perfect for testing!`,
        followUp: "Would you like help with any specific step, or do you have questions about a particular use case?"
      };
    }

    // Support / Help questions
    if (this.containsAny(q, ['help', 'support', 'contact', 'question', 'issue', 'problem'])) {
      return {
        response: `🆘 **Mobula Support**\n\n**📚 Documentation:** docs.mobula.io\n**💬 Discord:** Join our developer community\n**📧 Email:** Direct support channel\n**🐙 GitHub:** For technical issues\n**🐦 Twitter:** @MobulaFi for updates\n\n**⚡ Response Time:** Usually within 24 hours\n\nOur team is here to help you succeed!`,
        followUp: "What specific issue can I help you solve right now?"
      };
    }

    // Use cases / Examples
    if (this.containsAny(q, ['use case', 'example', 'build', 'application', 'project'])) {
      return {
        response: `💡 **Popular Mobula Use Cases**\n\n**📱 Trading Apps**\n• Real-time price data\n• Portfolio tracking\n• Market analysis\n\n**🏦 DeFi Dashboards**\n• Protocol metrics\n• Yield tracking\n• Cross-chain data\n\n**📊 Analytics Platforms**\n• Historical data analysis\n• Market research\n• Custom indicators\n\n**💼 Portfolio Trackers**\n• Multi-chain balances\n• Performance tracking\n• Transaction history`,
        followUp: "What type of application are you planning to build?"
      };
    }

    // Data questions
    if (this.containsAny(q, ['data', 'historical', 'real-time', 'price', 'volume', 'market cap'])) {
      return {
        response: `📊 **Mobula Data Features**\n\n**🔴 Real-time Data:**\n• Live price feeds\n• WebSocket connections\n• Instant updates\n\n**📈 Historical Data:**\n• OHLCV data\n• Custom time intervals\n• Years of price history\n\n**🌐 Coverage:**\n• 20M+ crypto assets\n• Multiple exchanges\n• Cross-chain aggregation\n\n**⚡ Reliability:**\n• 99.9% uptime\n• Enterprise-grade infrastructure`,
        followUp: "Need specific data for a particular asset or timeframe?"
      };
    }

    // If no specific match, route to human
    return {
      needsHuman: true
    };
  }

  private static containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  // Get a random helpful suggestion
  public static getHelpfulSuggestion(): string {
    const suggestions = [
      "💡 Did you know? Mobula covers 20M+ crypto assets across multiple chains!",
      "🆓 Pro tip: Start with our free tier - 100K API calls per month!",
      "📚 Check out docs.mobula.io for detailed API documentation",
      "⚡ Need real-time data? Try our WebSocket connections for instant updates",
      "🔗 Building a multi-chain app? Our cross-chain data is perfect for that!",
      "📊 Looking for DeFi data? We have comprehensive protocol metrics",
      "💼 Need portfolio tracking? Our Portfolio API handles multi-chain balances"
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // Check if question is about Mobula
  public static isMobulaRelated(query: string): boolean {
    const mobulaKeywords = [
      'mobula', 'api', 'data', 'crypto', 'price', 'portfolio', 
      'defi', 'blockchain', 'market', 'trading', 'analytics'
    ];
    
    const q = query.toLowerCase();
    return mobulaKeywords.some(keyword => q.includes(keyword));
  }
}

export default MobulaKnowledgeBase;