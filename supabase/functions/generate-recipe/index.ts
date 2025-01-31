import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const EDAMAM_APP_ID = Deno.env.get('EDAMAM_APP_ID');
const EDAMAM_APP_KEY = Deno.env.get('EDAMAM_APP_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  ingredients: string;
  dietary?: string;
  cuisine?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      console.error('Missing API credentials:', {
        hasAppId: !!EDAMAM_APP_ID,
        hasAppKey: !!EDAMAM_APP_KEY
      });
      throw new Error('API credentials are not properly configured');
    }

    // Parse and validate request body
    const { ingredients, dietary, cuisine } = await req.json() as RequestBody;

    if (!ingredients) {
      throw new Error('Ingredients are required');
    }

    console.log('Making request with:', {
      ingredients,
      dietary,
      cuisine,
      appIdPresent: !!EDAMAM_APP_ID,
      appKeyPresent: !!EDAMAM_APP_KEY
    });

    // Build the URL with query parameters - Updated to use the correct endpoint
    const url = new URL('https://api.edamam.com/api/recipes/v2');
    url.searchParams.append('type', 'public');
    url.searchParams.append('q', ingredients);
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    url.searchParams.append('random', 'true'); // Add randomization for more variety

    if (dietary) {
      url.searchParams.append('health', dietary.toLowerCase());
    }

    if (cuisine) {
      url.searchParams.append('cuisineType', cuisine.toLowerCase());
    }

    console.log('Attempting API call to:', url.toString().replace(EDAMAM_APP_KEY, '[REDACTED]'));

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edamam API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Edamam API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (!data.hits || data.hits.length === 0) {
      throw new Error('No recipes found for the given ingredients');
    }

    const recipe = data.hits[0].recipe;

    const transformedRecipe = {
      title: recipe.label,
      description: `A delicious ${recipe.cuisineType?.[0] || ''} recipe with ${recipe.ingredients.length} ingredients`,
      ingredients: recipe.ingredients.map((ing: any) => ing.text),
      instructions: recipe.ingredientLines,
      cookingTime: recipe.totalTime ? `${recipe.totalTime} minutes` : "30-45 minutes",
      difficulty: recipe.ingredients.length <= 5 ? "Easy" : recipe.ingredients.length <= 8 ? "Medium" : "Hard",
      cuisine: recipe.cuisineType?.[0] || cuisine || null,
      dietary: recipe.healthLabels?.[0] || dietary || null
    };

    console.log('Successfully generated recipe');

    return new Response(JSON.stringify(transformedRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});