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
    const requestBody = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });

    const { ingredients, dietary, cuisine } = requestBody as RequestBody;

    if (!ingredients) {
      throw new Error('Ingredients are required');
    }

    console.log('Request received:', {
      ingredients,
      dietary,
      cuisine,
      appIdPresent: !!EDAMAM_APP_ID,
      appKeyPresent: !!EDAMAM_APP_KEY
    });

    // Build the URL with query parameters
    const url = new URL('https://api.edamam.com/api/recipes/v2');
    url.searchParams.append('type', 'public');
    url.searchParams.append('q', ingredients);
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);

    if (dietary) {
      url.searchParams.append('health', dietary.toLowerCase());
    }

    if (cuisine) {
      url.searchParams.append('cuisineType', cuisine.toLowerCase());
    }

    console.log('Making request to Edamam API:', url.toString().replace(EDAMAM_APP_KEY, '[REDACTED]'));

    // Make the request with the required headers
    const response = await fetch(url.toString(), {
      headers: {
        'Edamam-Account-User': 'default_user', // Adding required user ID header
        'Content-Type': 'application/json'
      }
    });
    
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
    console.log('Received response from Edamam API');

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

    console.log('Successfully transformed recipe');

    return new Response(JSON.stringify(transformedRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    
    // Return a more detailed error response
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