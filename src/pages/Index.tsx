import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RecipeForm, { RecipeFormData } from "@/components/RecipeForm";
import RecipeDisplay, { Recipe } from "@/components/RecipeDisplay";
import { toast } from "sonner";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (data: RecipeFormData) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('generate-recipe', {
        body: {
          ingredients: data.ingredients,
          dietary: data.dietary,
          cuisine: data.cuisine,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const generatedRecipe = response.data as Recipe;
      setRecipe(generatedRecipe);

      // Only try to save if we have a valid recipe
      if (generatedRecipe) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          toast.error("You must be logged in to save recipes");
          return;
        }

        const { error: saveError } = await supabase
          .from('recipes')
          .insert([{
            title: generatedRecipe.title,
            description: generatedRecipe.description,
            ingredients: generatedRecipe.ingredients,
            instructions: generatedRecipe.instructions,
            cooking_time: generatedRecipe.cookingTime,
            difficulty: generatedRecipe.difficulty,
            cuisine: data.cuisine || null,
            dietary: data.dietary || null,
            user_id: user.data.user.id
          }]);

        if (saveError) {
          console.error('Error saving recipe:', saveError);
          toast.error("Failed to save recipe to database");
        } else {
          toast.success("Recipe generated and saved successfully!");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate recipe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-8 px-4 sm:py-12">
        <header className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary mb-4">
            Recipe Genius
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enter your ingredients and let AI create the perfect recipe for you.
            Get instant recipes with step-by-step instructions.
          </p>
        </header>

        <div className="flex flex-col items-center gap-8">
          <RecipeForm onSubmit={handleSubmit} isLoading={isLoading} />
          {recipe && <RecipeDisplay recipe={recipe} />}
        </div>
      </div>
    </div>
  );
};

export default Index;