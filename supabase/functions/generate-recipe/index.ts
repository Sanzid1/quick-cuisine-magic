import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const EDAMAM_APP_ID = Deno.env.get('EDAMAM_APP_ID');
const EDAMAM_APP_KEY = Deno.env.get('EDAMAM_APP_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, dietary, cuisine } = await req.json();

    console.log('Generating recipe with:', { ingredients, dietary, cuisine });

    // Convert ingredients array to a search query
    const searchQuery = ingredients.join(' ');
    
    // Build the URL with query parameters
    const url = new URL('https://api.edamam.com/api/recipes/v2');
    url.searchParams.append('type', 'public');
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('app_id', EDAMAM_APP_ID!);
    url.searchParams.append('app_key', EDAMAM_APP_KEY!);
    
    // Add dietary restrictions if provided
    if (dietary) {
      url.searchParams.append('health', dietary.toLowerCase());
    }
    
    // Add cuisine type if provided
    if (cuisine) {
      url.searchParams.append('cuisineType', cuisine.toLowerCase());
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      throw new Error('No recipes found');
    }

    // Get the first recipe
    const recipe = data.hits[0].recipe;

    // Transform the Edamam response to match our app's format
    const transformedRecipe = {
      title: recipe.label,
      description: `A delicious ${recipe.cuisineType?.[0] || ''} recipe with ${recipe.ingredients.length} ingredients`,
      ingredients: recipe.ingredients.map((ing: any) => ing.text),
      instructions: recipe.ingredientLines,
      cookingTime: recipe.totalTime ? `${recipe.totalTime} minutes` : "30-45 minutes",
      difficulty: recipe.ingredients.length <= 5 ? "Easy" : recipe.ingredients.length <= 8 ? "Medium" : "Hard",
      imageUrl: recipe.image || "/placeholder.svg",
      cuisine: recipe.cuisineType?.[0] || cuisine || null,
      dietary: recipe.healthLabels?.[0] || dietary || null
    };

    console.log('Transformed recipe:', transformedRecipe);

    return new Response(JSON.stringify(transformedRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});