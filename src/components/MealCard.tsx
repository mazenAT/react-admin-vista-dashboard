
import React from 'react';
import { Edit, Trash2, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Meal {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

interface MealCardProps {
  meal: Meal;
}

const MealCard = ({ meal }: MealCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Utensils className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{meal.name}</h3>
              <p className="text-sm text-gray-500">{meal.category}</p>
            </div>
          </div>
          <span className="text-lg font-bold text-green-600">${meal.price}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4">{meal.description}</p>

        {/* Nutrition Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Nutrition (per serving)</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span>Calories: {meal.nutritionInfo.calories}</span>
            <span>Protein: {meal.nutritionInfo.protein}g</span>
            <span>Carbs: {meal.nutritionInfo.carbs}g</span>
            <span>Fat: {meal.nutritionInfo.fat}g</span>
          </div>
        </div>

        {/* Diet Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {meal.isVegetarian && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Vegetarian</span>
          )}
          {meal.isVegan && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Vegan</span>
          )}
          {meal.isGlutenFree && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Gluten-Free</span>
          )}
        </div>

        {/* Allergens */}
        <div className="mb-4">
          <span className="text-xs text-gray-500">Allergens: </span>
          <span className="text-xs text-gray-700">{meal.allergens.join(', ')}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
