export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const { apiKey, businessName, website, industry, location } = body;

    if (!apiKey || !businessName || !website || !industry || !location) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `You are an expert digital marketing analyst. Analyze the visibility of this business across multiple platforms.

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Website: ${website}
- Industry: ${industry}
- Location: ${location}

YOUR TASK:
Conduct a comprehensive visibility analysis across these 8 platforms:
1. ChatGPT (AI Search)
2. Perplexity (AI Search)
3. Google Gemini (AI Search)
4. Bing Copilot (AI Search)
5. Siri (Voice Search - estimate based on Apple Maps/Yelp)
6. Alexa (Voice Search - estimate based on Yelp)
7. Google Assistant (Voice Search - based on Google data)
8. YouTube

For EACH platform, provide:
- Visibility score (0-100)
- Current status (found/not found/ranking)
- Brief explanation (2-3 sentences)
- Color indicator (red for 0-40, yellow for 41-70, green for 71-100)

ALSO PROVIDE:
- 3 Competitors (with website URLs if possible)
- 20 Keyword opportunities (relevant to industry and location)
- Overall visibility score (0-100, average across all platforms)
- Revenue gap estimate ($50K-$500K range)
- 8 Quick wins for improvement

IMPORTANT: 
- Use REAL search queries to check visibility
- Be honest about what you find
- For local businesses, include location in searches
- For voice search, estimate based on their data sources

Return your analysis in this EXACT JSON format (no markdown, just pure JSON):

{
  "overallScore": 23,
  "revenueGap": "$150,000-$400,000",
  "platforms": [
    {
      "name": "ChatGPT",
      "category": "AI Search",
      "score": 12,
      "status": "Not Found",
      "finding": "When searching 'best ${industry} in ${location}', this business does not appear in ChatGPT's recommendations. Competitors dominate the results.",
      "color": "red"
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "competitorwebsite.com",
      "strength": "What they're doing right that this business isn't",
      "score": 89
    }
  ],
  "keywords": [
    {
      "keyword": "emergency ${industry} ${location}",
      "volume": "1,200/month (estimated)",
      "competition": "High",
      "currentRank": "Not ranking",
      "opportunity": "$3,600/month potential"
    }
  ],
  "quickWins": [
    "Optimize for AI crawlers with schema markup",
    "Create voice search-friendly FAQ content",
    "Build ChatGPT visibility through authority content",
    "Optimize YouTube presence",
    "Build E-E-A-T signals",
    "Answer engine optimization (PAA questions)",
    "Local citation building",
    "Review management system"
  ]
}

Be realistic and provide actionable insights.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(JSON.stringify({ 
        error: `Anthropic API error: ${anthropicResponse.status}`,
        details: errorText
      }), {
        status: anthropicResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await anthropicResponse.json();
    const analysisText = result.content[0].text;
    
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ 
        error: 'Could not parse analysis response',
        rawResponse: analysisText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
