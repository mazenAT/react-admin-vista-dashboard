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
import { Save, Edit, Trash2 } from 'lucide-react';
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
  const [editingPrice, setEditingPrice] = useState<SchoolMealPrice | null>(null);
  const [editForm, setEditForm] = useState({ price: '', is_active: true });

  useEffect(() => {
    fetchInitialData();
  }, [selectedSchool]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [mealsResponse, schoolsResponse] = await Promise.all([
        adminApi.getMeals(),
        adminApi.getSchools(),
      ]);

      setMeals(mealsResponse.data.data);
      setSchools(schoolsResponse.data.data);

      if (selectedSchool) {
        await fetchSchoolMealPrices();
      }
    } catch (error) {
      toast.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
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
        return {
          meal_id: meal.id,
          price: existingPrice ? existingPrice.price : meal.price,
        };
      });

      await adminApi.bulkUpdateSchoolMealPrices({
        school_id: parseInt(selectedSchool),
        prices,
      });

      toast.success('School meal prices updated successfully');
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

  const getPriceForMeal = (mealId: number) => {
    const schoolPrice = schoolMealPrices.find(p => p.meal_id === mealId);
    return schoolPrice ? schoolPrice.price : null;
  };

  const isPriceActive = (mealId: number) => {
    const schoolPrice = schoolMealPrices.find(p => p.meal_id === mealId);
    return schoolPrice ? schoolPrice.is_active : false;
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
            <Button onClick={handleBulkUpdate} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Update All Prices
            </Button>
          )}
        </div>
      </div>

      {selectedSchool && (
        <div className="bg-white rounded-lg shadow-sm border">
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
              ) : meals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">No meals found</TableCell>
                </TableRow>
              ) : (
                meals.map((meal) => {
                  const schoolPrice = getPriceForMeal(meal.id);
                  const isActive = isPriceActive(meal.id);
                  
                  return (
                    <TableRow key={meal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-sm text-gray-500">{meal.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{meal.category}</TableCell>
                      <TableCell>${meal.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {schoolPrice ? (
                          <span className={`font-medium ${schoolPrice !== meal.price ? 'text-green-600' : ''}`}>
                            ${schoolPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
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
    </div>
  );
};

export default SchoolMealPricing; 