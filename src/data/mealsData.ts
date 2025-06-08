
export interface Meal {
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

export const meals: Meal[] = [
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

export const categories = ['all', 'Main Course', 'Salad', 'Dessert', 'Snack', 'Beverage'];
