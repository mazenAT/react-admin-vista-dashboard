
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, Search, Filter, Edit, Trash2, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Meals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const meals = [
    {
      id: 'M001',
      name: 'Grilled Chicken Breast',
      category: 'Main Course',
      description: 'Tender grilled chicken breast with herbs',
      price: 8.50,
      nutritionInfo: {
        calories: 320,
        protein: 45,
        carbs: 2,
        fat: 12
      },
      allergens: ['None'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true
    },
    {
      id: 'M002',
      name: 'Caesar Salad',
      category: 'Salad',
      description: 'Fresh romaine lettuce with caesar dressing',
      price: 6.50,
      nutritionInfo: {
        calories: 180,
        protein: 8,
        carbs: 12,
        fat: 14
      },
      allergens: ['Dairy', 'Eggs'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false
    },
    {
      id: 'M003',
      name: 'Vegetable Pasta',
      category: 'Main Course',
      description: 'Pasta with seasonal vegetables in tomato sauce',
      price: 7.00,
      nutritionInfo: {
        calories: 280,
        protein: 12,
        carbs: 52,
        fat: 6
      },
      allergens: ['Gluten'],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false
    },
    {
      id: 'M004',
      name: 'Chocolate Chip Cookies',
      category: 'Dessert',
      description: 'Fresh baked chocolate chip cookies',
      price: 2.50,
      nutritionInfo: {
        calories: 150,
        protein: 2,
        carbs: 22,
        fat: 7
      },
      allergens: ['Gluten', 'Dairy', 'Eggs'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false
    },
    {
      id: 'M005',
      name: 'Fresh Fruit Bowl',
      category: 'Snack',
      description: 'Seasonal fresh fruit selection',
      price: 4.00,
      nutritionInfo: {
        calories: 90,
        protein: 1,
        carbs: 24,
        fat: 0
      },
      allergens: ['None'],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true
    }
  ];

  const categories = ['all', 'Main Course', 'Salad', 'Dessert', 'Snack', 'Beverage'];

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || meal.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meals</h1>
            <p className="text-gray-600">Manage individual meals that can be used in meal plans</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Add New Meal
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
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
          ))}
        </div>

        {filteredMeals.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meals found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Meals;
