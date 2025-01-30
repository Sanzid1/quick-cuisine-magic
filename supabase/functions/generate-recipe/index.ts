import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, dietary, cuisine } = await req.json();

    console.log('Generating recipe with:', { ingredients, dietary, cuisine });

    // Add retry logic for rate limits
    let retries = 3;
    let response;
    
    while (retries > 0) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional chef who creates recipes based on available ingredients.'
            },
            {
              role: 'user',
              content: `Create a recipe using these ingredients: ${ingredients}.${dietary ? ` Make it ${dietary}.` : ''}${cuisine ? ` Style: ${cuisine} cuisine.` : ''}\n\nProvide the response in this exact JSON format:\n{
                "title": "Recipe Title",
                "description": "Brief description",
                "ingredients": ["ingredient 1", "ingredient 2"],
                "instructions": ["step 1", "step 2"],
                "cookingTime": "30 minutes",
                "difficulty": "Easy/Medium/Hard",
                "imageUrl": "/placeholder.svg"
              }`
            }
          ],
        }),
      });

      if (response.status === 429) {
        console.log(`Rate limited, retries left: ${retries}`);
        retries--;
        if (retries > 0) {
          await delay(1000); // Wait 1 second before retrying
          continue;
        }
      }
      break;
    }

    if (!response || !response.ok) {
      throw new Error(`OpenAI API error: ${response?.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const recipe = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate recipe',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});