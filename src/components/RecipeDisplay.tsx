import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ChefHat, Share2 } from "lucide-react";
import { toast } from "sonner";

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: string;
}

interface RecipeDisplayProps {
  recipe: Recipe;
}

const RecipeDisplay = ({ recipe }: RecipeDisplayProps) => {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } catch (err) {
      toast.error("Unable to share recipe");
    }
  };

  const handleSave = () => {
    const savedRecipes = JSON.parse(localStorage.getItem("savedRecipes") || "[]");
    savedRecipes.push(recipe);
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
    toast.success("Recipe saved!");
  };

  return (
    <Card className="w-full max-w-2xl p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold text-primary">
          {recipe.title}
        </h2>
        <p className="text-muted-foreground">{recipe.description}</p>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {recipe.cookingTime}
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            {recipe.difficulty}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold">Instructions</h3>
        <ol className="list-decimal pl-5 space-y-2">
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className="pl-2">
              {instruction}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-4">
        <Button onClick={handleSave} className="flex-1">
          Save Recipe
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>
    </Card>
  );
};

export default RecipeDisplay;