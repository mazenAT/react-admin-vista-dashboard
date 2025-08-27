import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Edit, Trash2, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface SchoolMealPrice {
  id: number;
  meal_id: number;
  price: number;
  is_active: boolean;
  meal: Meal;
}

interface School {
  id: number;
  name: string;
}

interface SchoolMealPricingProps {
  schoolId?: number;
}

const SchoolMealPricing: React.FC<SchoolMealPricingProps> = ({ schoolId }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [schoolMealPrices, setSchoolMealPrices] = useState<SchoolMealPrice[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>(schoolId?.toString() || '');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<SchoolMealPrice | null>(null);
  const [editForm, setEditForm] = useState({ price: '', is_active: true });
  const [addForm, setAddForm] = useState({ meal_id: '', price: '', is_active: true });
  const [editingPrices, setEditingPrices] = useState<{[key: number]: string}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchInitialData();
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedSchool) {
      fetchMealsForSchool();
    }
  }, [selectedSchool, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [schoolsResponse] = await Promise.all([
        adminApi.getSchools(),
      ]);

      setSchools(schoolsResponse.data.data);

      if (selectedSchool) {
        await fetchMealsForSchool();
        await fetchSchoolMealPrices();
      }
    } catch (error) {
      toast.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMealsForSchool = async () => {
    if (!selectedSchool) return;
    
    try {
      // Use the same API call as the main Meals page when school is selected
      const response = await adminApi.getMealsWithSchoolPrices(parseInt(selectedSchool), {
        // Add category filtering if needed
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      });
      
      console.log('API Response structure:', response);
      console.log('API Response data:', response.data);
      console.log('API Response data.data:', response.data.data);
      
      // The API returns data directly in response.data, not response.data.data
      const mealsArray = response.data.data || response.data;
      console.log('Meals array to process:', mealsArray);
      
      const mealsData = mealsArray.map((meal: any) => {
        console.log('Processing meal:', meal);
        return {
          id: meal.id,
          name: meal.name,
          description: meal.description || meal.name,
          price: parseFloat(meal.base_price || meal.price || '0'),
          category: meal.category,
          image: meal.image || '',
          status: meal.status || 'active',
          pdf_path: meal.pdf_path,
        };
      });
      
      console.log('Processed meals data:', mealsData);
      setMeals(mealsData);
    } catch (error) {
      toast.error('Failed to fetch meals for school');
    }
  };

  const fetchSchoolMealPrices = async () => {
    if (!selectedSchool) return;
    
    try {
      const response = await adminApi.getSchoolMealPrices(parseInt(selectedSchool));
      setSchoolMealPrices(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch school meal prices');
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedSchool) {
      toast.error('Please select a school first');
      return;
    }

    try {
      const prices = meals.map(meal => {
        const existingPrice = schoolMealPrices.find(p => p.meal_id === meal.id);
        const editingPrice = editingPrices[meal.id];
        return {
          meal_id: meal.id,
          price: editingPrice ? parseFloat(editingPrice) : (existingPrice ? existingPrice.price : meal.price),
        };
      });

      await adminApi.bulkUpdateSchoolMealPrices({
        school_id: parseInt(selectedSchool),
        prices,
      });

      toast.success('School meal prices updated successfully');
      setEditingPrices({});
      await fetchSchoolMealPrices();
    } catch (error) {
      toast.error('Failed to update school meal prices');
    }
  };

  const handleEditPrice = (price: SchoolMealPrice) => {
    setEditingPrice(price);
    setEditForm({
      price: price.price.toString(),
      is_active: price.is_active,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPrice) return;

    try {
      await adminApi.updateSchoolMealPrice(editingPrice.id, {
        price: parseFloat(editForm.price),
        is_active: editForm.is_active,
      });

      toast.success('Price updated successfully');
      setShowEditModal(false);
      setEditingPrice(null);
      await fetchSchoolMealPrices();
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const handleAddPrice = () => {
    setAddForm({ meal_id: '', price: '', is_active: true });
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    if (!selectedSchool || !addForm.meal_id || !addForm.price) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await adminApi.createSchoolMealPrice({
        school_id: parseInt(selectedSchool),
        meal_id: parseInt(addForm.meal_id),
        price: parseFloat(addForm.price),
        is_active: addForm.is_active,
      });

      toast.success('Price added successfully');
      setShowAddModal(false);
      await fetchSchoolMealPrices();
    } catch (error) {
      toast.error('Failed to add price');
    }
  };

  const handleDeletePrice = async (priceId: number) => {
    if (!confirm('Are you sure you want to delete this price?')) return;

    try {
      await adminApi.deleteSchoolMealPrice(priceId);
      toast.success('Price deleted successfully');
      await fetchSchoolMealPrices();
    } catch (error) {
      toast.error('Failed to delete price');
    }
  };

  const handleInlineEdit = (mealId: number, value: string) => {
    setEditingPrices(prev => ({
      ...prev,
      [mealId]: value
    }));
  };

  const handleSaveInlineEdit = async (mealId: number) => {
    if (!selectedSchool || !editingPrices[mealId]) return;

    try {
      const existingPrice = schoolMealPrices.find(p => p.meal_id === mealId);
      if (existingPrice) {
        await adminApi.updateSchoolMealPrice(existingPrice.id, {
          price: parseFloat(editingPrices[mealId]),
        });
      } else {
        await adminApi.createSchoolMealPrice({
          school_id: parseInt(selectedSchool),
          meal_id: mealId,
          price: parseFloat(editingPrices[mealId]),
          is_active: true,
        });
      }

      toast.success('Price updated successfully');
      setEditingPrices(prev => {
        const newState = { ...prev };
        delete newState[mealId];
        return newState;
      });
      await fetchSchoolMealPrices();
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const handleCancelInlineEdit = (mealId: number) => {
    setEditingPrices(prev => {
      const newState = { ...prev };
      delete newState[mealId];
      return newState;
    });
  };

  const getPriceForMeal = (mealId: number) => {
    const schoolPrice = schoolMealPrices.find(p => p.meal_id === mealId);
    return schoolPrice ? Number(schoolPrice.price) : null;
  };

  const isPriceActive = (mealId: number) => {
    const schoolPrice = schoolMealPrices.find(p => p.meal_id === mealId);
    return schoolPrice ? schoolPrice.is_active : false;
  };

  const getAvailableMealsForAdd = () => {
    const existingMealIds = schoolMealPrices.map(p => p.meal_id);
    return meals.filter(meal => !existingMealIds.includes(meal.id));
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(meals.map(meal => meal.category))];
    console.log('All meals:', meals);
    console.log('All meal categories:', meals.map(meal => meal.category));
    console.log('Unique categories:', categories);
    return categories.sort();
  };

  const getFilteredMeals = () => {
    if (selectedCategory === 'all') {
      return meals;
    }
    return meals.filter(meal => meal.category === selectedCategory);
  };

  const getAvailableCategories = () => {
    // Get categories that actually have meals in the current data
    const availableCategories = [...new Set(meals.map(meal => meal.category))];
    return availableCategories;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Meal Pricing</h2>
          <p className="text-gray-600">Manage meal prices for specific schools</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSchool && (
            <>
              <Button onClick={handleAddPrice} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Price
              </Button>
              <Button onClick={handleBulkUpdate} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedSchool && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Category Filter */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="hot_meal">Hot Meal</SelectItem>
                    <SelectItem value="sandwich">Sandwich</SelectItem>
                    <SelectItem value="sandwich_xl">Sandwich XL</SelectItem>
                    <SelectItem value="burger">Burger</SelectItem>
                    <SelectItem value="crepe">Crepe</SelectItem>
                    <SelectItem value="nursery">Nursery</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCategory !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Showing {getFilteredMeals().length} of {meals.length} meals
                {selectedCategory !== 'all' && ` in category "${selectedCategory}"`}
                {selectedCategory !== 'all' && getFilteredMeals().length === 0 && (
                  <span className="text-orange-600 ml-2">
                    (No meals available in this category yet)
                  </span>
                )}
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meal</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>School Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : getFilteredMeals().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {selectedCategory === 'all' ? 'No meals found' : `No meals found in category "${selectedCategory}"`}
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredMeals().map((meal) => {
                  const schoolPrice = getPriceForMeal(meal.id);
                  const isActive = isPriceActive(meal.id);
                  const isEditing = editingPrices[meal.id] !== undefined;
                  
                  return (
                    <TableRow key={meal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-sm text-gray-500">{meal.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{meal.category}</TableCell>
                      <TableCell>{Number(meal.price).toFixed(2)} EGP</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingPrices[meal.id]}
                              onChange={(e) => handleInlineEdit(meal.id, e.target.value)}
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveInlineEdit(meal.id)}
                              className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCancelInlineEdit(meal.id)}
                              className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${Number(schoolPrice) !== Number(meal.price) ? 'text-green-600' : ''}`}>
                              {schoolPrice ? Number(schoolPrice).toFixed(2) : 'Not set'} EGP
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInlineEdit(meal.id, schoolPrice ? Number(schoolPrice).toString() : Number(meal.price).toString())}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {schoolPrice && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPrice(schoolMealPrices.find(p => p.meal_id === meal.id)!)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePrice(schoolMealPrices.find(p => p.meal_id === meal.id)!.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Price Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit School Meal Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal
              </label>
              <div className="text-sm text-gray-600">
                {editingPrice?.meal.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editForm.price}
                onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Enter price"
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Price Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add School Meal Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal
              </label>
              <Select value={addForm.meal_id} onValueChange={(value) => setAddForm(f => ({ ...f, meal_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a meal" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMealsForAdd().map((meal) => (
                    <SelectItem key={meal.id} value={meal.id.toString()}>
                                              {meal.name} - {Number(meal.price).toFixed(2)} EGP
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={addForm.price}
                onChange={(e) => setAddForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Enter price"
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={addForm.is_active}
                onChange={(e) => setAddForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
            <div className="flex space-x-2">
              <Button onClick={handleSaveAdd} className="flex-1">
                Add Price
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolMealPricing; 