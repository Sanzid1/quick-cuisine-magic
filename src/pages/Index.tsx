import { useState } from "react";
import RecipeForm, { RecipeFormData } from "@/components/RecipeForm";
import RecipeDisplay, { Recipe } from "@/components/RecipeDisplay";
import { toast } from "sonner";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (data: RecipeFormData) => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll use a mock recipe
      // In a real app, this would call an AI service
      const mockRecipe: Recipe = {
        title: "Homemade Pasta with Fresh Tomato Sauce",
        description:
          "A delicious and simple pasta dish made with fresh ingredients.",
        ingredients: [
          "2 cups all-purpose flour",
          "3 large eggs",
          "4 ripe tomatoes",
          "2 cloves garlic",
          "Fresh basil leaves",
          "Olive oil",
          "Salt and pepper to taste",
        ],
        instructions: [
          "Mix flour and eggs to make pasta dough",
          "Rest dough for 30 minutes",
          "Roll out and cut pasta into desired shape",
          "Dice tomatoes and mince garlic",
          "Sauté garlic in olive oil",
          "Add tomatoes and simmer for 15 minutes",
          "Cook pasta in boiling water",
          "Combine pasta with sauce and garnish with basil",
        ],
        cookingTime: "45 minutes",
        difficulty: "Medium",
        imageUrl: "/placeholder.svg", // Replace with AI-generated image
      };

      setRecipe(mockRecipe);
    } catch (error) {
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
            Get instant recipes with step-by-step instructions and beautiful
            visuals.
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