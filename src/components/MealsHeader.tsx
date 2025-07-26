
import React from 'react';
import { Plus, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MealsHeader = () => {
  const handleImport = () => {
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meals</h1>
        <p className="text-gray-600">Manage individual meals that can be used in meal plans</p>
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={handleImport}>
          <Import className="h-5 w-5 mr-2" />
          Import Meals
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Add New Meal
        </Button>
      </div>
    </div>
  );
};

export default MealsHeader;
