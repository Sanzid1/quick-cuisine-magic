import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface RecipeFormData {
  ingredients: string;
  dietary: string;
  cuisine: string;
}

interface RecipeFormProps {
  onSubmit: (data: RecipeFormData) => void;
  isLoading: boolean;
}

const RecipeForm = ({ onSubmit, isLoading }: RecipeFormProps) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    ingredients: "",
    dietary: "",
    cuisine: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredients.trim()) {
      toast.error("Please enter some ingredients");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          placeholder="Enter ingredients (e.g., chicken, rice, tomatoes)"
          value={formData.ingredients}
          onChange={(e) =>
            setFormData({ ...formData, ingredients: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dietary">Dietary Restrictions</Label>
        <select
          id="dietary"
          value={formData.dietary}
          onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">None</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-free</option>
          <option value="dairy-free">Dairy-free</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuisine">Cuisine Type</Label>
        <select
          id="cuisine"
          value={formData.cuisine}
          onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Any</option>
          <option value="italian">Italian</option>
          <option value="mexican">Mexican</option>
          <option value="indian">Indian</option>
          <option value="chinese">Chinese</option>
          <option value="japanese">Japanese</option>
          <option value="mediterranean">Mediterranean</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Generating Recipe..." : "Generate Recipe"}
      </Button>
    </form>
  );
};

export default RecipeForm;