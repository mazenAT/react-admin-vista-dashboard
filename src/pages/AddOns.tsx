import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, School, Settings, Eye, EyeOff, Save, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AddOn {
  id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
  is_active: boolean;
  global_active?: boolean;
  school_specific_status?: boolean | null;
  effective_status?: boolean;
}

interface School {
  id: number;
  name: string;
}

interface CategoryStatus {
  category: string;
  is_active: boolean;
  add_on_count: number;
  active_for_school_count: number;
}

interface SchoolStatusOverview {
  categories: {
    category: string;
    is_active: boolean;
    total_add_ons: number;
    active_add_ons: number;
    add_ons: AddOn[];
  }[];
  school: {
    id: number;
    name: string;
  };
}

const AddOns = () => {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [categoryStatuses, setCategoryStatuses] = useState<CategoryStatus[]>([]);
  const [schoolOverview, setSchoolOverview] = useState<SchoolStatusOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSchoolManageModal, setShowSchoolManageModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all-items');
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    category: 'snacks',
    price: '', 
    is_active: true 
  });

  const categoryEmojis = {
    snacks: '🍿',
    bakery: '🥐', 
    greek_yoghurt_popsicle: '🍦',
    drinks: '🥤'
  };

  const categoryNames = {
    snacks: 'Snacks',
    bakery: 'Bakery',
    greek_yoghurt_popsicle: 'Greek Yogurt Popsicle',
    drinks: 'Drinks'
  };

  const fetchSchools = async () => {
    try {
      const response = await adminApi.getSchools();
      setSchools(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch schools');
    }
  };

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await adminApi.getAddOns(params);
      const addOnsData = response.data?.data || [];
      setAddOns(Array.isArray(addOnsData) ? addOnsData : []);
    } catch (error) {
      toast.error('Failed to fetch add-ons');
      setAddOns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolData = async () => {
    if (!selectedSchool) return;
    
    try {
      setLoading(true);
      
      // Fetch category statuses
      const categoryResponse = await adminApi.getSchoolCategoryStatuses(selectedSchool);
      setCategoryStatuses(categoryResponse.data?.data || []);
      
      // Fetch complete overview
      const overviewResponse = await adminApi.getSchoolAddOnStatusOverview(selectedSchool);
      setSchoolOverview(overviewResponse.data?.data || null);
      
    } catch (error) {
      toast.error('Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchAddOns();
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolData();
    }
  }, [selectedSchool]);

  const handleCategoryToggle = async (category: string, isActive: boolean) => {
    if (!selectedSchool) return;
    
    try {
      await adminApi.updateSchoolCategoryStatus(selectedSchool, {
        category,
        is_active: isActive
      });
      
      toast.success(`${categoryNames[category]} ${isActive ? 'enabled' : 'disabled'} for this school`);
      fetchSchoolData();
    } catch (error) {
      toast.error('Failed to update category status');
    }
  };

  const handleAddOnToggle = async (addOnId: number, isActive: boolean) => {
    if (!selectedSchool) return;
    
    try {
      await adminApi.updateSchoolAddOnStatus(selectedSchool, addOnId, {
        is_active: isActive
      });
      
      toast.success(`Add-on ${isActive ? 'enabled' : 'disabled'} for this school`);
      fetchSchoolData();
    } catch (error) {
      toast.error('Failed to update add-on status');
    }
  };

  const handleAdd = async () => {
    try {
      await adminApi.createAddOn({
        name: form.name,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price),
        is_active: form.is_active,
      });
      toast.success('Daily item created');
      setShowAddModal(false);
      setForm({ name: '', description: '', category: 'snacks', price: '', is_active: true });
      fetchAddOns();
    } catch (error) {
      toast.error('Failed to create daily item');
    }
  };

  const handleEdit = async () => {
    if (!selectedAddOn) return;
    try {
      await adminApi.updateAddOn(selectedAddOn.id, {
        name: form.name,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price),
        is_active: form.is_active,
      });
      toast.success('Daily item updated');
      setShowEditModal(false);
      setSelectedAddOn(null);
      setForm({ name: '', description: '', category: 'snacks', price: '', is_active: true });
      fetchAddOns();
    } catch (error) {
      toast.error('Failed to update daily item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this daily item?')) return;
    try {
      await adminApi.deleteAddOn(id);
      toast.success('Daily item deleted');
      fetchAddOns();
    } catch (error) {
      toast.error('Failed to delete daily item');
    }
  };

  const openEditModal = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setForm({
      name: addOn.name,
      description: addOn.description || '',
      category: addOn.category || 'snacks',
      price: addOn.price.toString(),
      is_active: addOn.is_active,
    });
    setShowEditModal(true);
  };

  const openSchoolManageModal = () => {
    setShowSchoolManageModal(true);
    setSelectedSchool(schools[0]?.id || null);
  };

  // Group add-ons by category
  const addOnsByCategory = addOns.reduce((acc, addOn) => {
    const category = addOn.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(addOn);
    return acc;
  }, {} as Record<string, AddOn[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Items Management</h1>
          <p className="text-gray-600">Manage universal daily items and school-specific visibility</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openSchoolManageModal} className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Users className="h-5 w-5" />
            <span>Manage for Schools</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
            <Plus className="h-5 w-5" />
            <span>Add Daily Item</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-items">All Daily Items</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
        </TabsList>

        {/* All Items Tab */}
        <TabsContent value="all-items" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search daily items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="snacks">🍿 Snacks</SelectItem>
                <SelectItem value="bakery">🥐 Bakery</SelectItem>
                <SelectItem value="greek_yoghurt_popsicle">🍦 Greek Yogurt Popsicle</SelectItem>
                <SelectItem value="drinks">🥤 Drinks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{addOns.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">+</span>
                </div>
              </div>
            </div>
            {Object.entries(categoryEmojis).map(([category, emoji]) => (
              <div key={category} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{categoryNames[category]}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {addOns.filter(a => a.category === category).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">{emoji}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Global Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : (!addOns || addOns.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No daily items found</TableCell>
                  </TableRow>
                ) : (
                  addOns.map((addOn) => (
                    <TableRow key={addOn.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{addOn.name}</div>
                          {addOn.description && (
                            <div className="text-sm text-gray-500">{addOn.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryEmojis[addOn.category || 'snacks']}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            addOn.category === 'bakery' ? 'bg-yellow-100 text-yellow-800' :
                            addOn.category === 'snacks' ? 'bg-orange-100 text-orange-800' :
                            addOn.category === 'greek_yoghurt_popsicle' ? 'bg-purple-100 text-purple-800' :
                            addOn.category === 'drinks' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {categoryNames[addOn.category || 'snacks']}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{addOn.price.toFixed(2)} EGP</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          addOn.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {addOn.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(addOn)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(addOn.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* By Category Tab */}
        <TabsContent value="by-category" className="space-y-6">
          {Object.entries(addOnsByCategory).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">{categoryEmojis[category] || '📦'}</span>
                  <div>
                    <div>{categoryNames[category] || category}</div>
                    <div className="text-sm text-gray-500 font-normal">{items.length} items</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((addOn) => (
                    <div key={addOn.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{addOn.name}</h4>
                          {addOn.description && (
                            <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-blue-600">{addOn.price.toFixed(2)} EGP</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              addOn.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {addOn.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(addOn)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(addOn.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* School Management Modal */}
      <Dialog open={showSchoolManageModal} onOpenChange={setShowSchoolManageModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Daily Items for Schools
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* School Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School</label>
              <Select value={selectedSchool?.toString() || ''} onValueChange={(value) => setSelectedSchool(parseInt(value))}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a school..." />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSchool && schoolOverview && (
              <div className="space-y-6">
                <div className="text-lg font-semibold">
                  Managing visibility for: {schoolOverview.school.name}
                </div>

                {/* Category Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Category Controls</CardTitle>
                    <CardDescription>
                      Toggle entire categories on/off. When a category is hidden, all items in that category will be hidden.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryStatuses.map((category) => (
                        <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{categoryEmojis[category.category]}</span>
                            <div>
                              <h4 className="font-medium">{categoryNames[category.category]}</h4>
                              <p className="text-sm text-gray-600">
                                {category.active_for_school_count} of {category.add_on_count} items active
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {category.is_active ? 'Visible' : 'Hidden'}
                            </span>
                            <Switch
                              checked={category.is_active}
                              onCheckedChange={(checked) => handleCategoryToggle(category.category, checked)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Individual Item Controls</CardTitle>
                    <CardDescription>
                      Fine-tune individual item visibility. Items can only be active if their category is also active.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {schoolOverview.categories.map((category) => (
                        <div key={category.category}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{categoryEmojis[category.category]}</span>
                            <h4 className="font-semibold">{categoryNames[category.category]}</h4>
                            <span className={`text-sm px-2 py-1 rounded ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {category.is_active ? 'Category Active' : 'Category Hidden'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.add_ons.map((addOn) => (
                              <div key={addOn.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h5 className="font-medium">{addOn.name}</h5>
                                    <span className="text-sm text-gray-600">{addOn.price.toFixed(2)} EGP</span>
                                  </div>
                                  {addOn.description && (
                                    <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs ${addOn.effective_status ? 'text-green-600' : 'text-red-600'}`}>
                                    {addOn.effective_status ? 'Active' : 'Inactive'}
                                  </span>
                                  <Switch
                                    checked={addOn.school_specific_status ?? addOn.global_active}
                                    onCheckedChange={(checked) => handleAddOnToggle(addOn.id, checked)}
                                    disabled={!category.is_active || !addOn.global_active}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Daily Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snacks">🍿 Snacks</SelectItem>
                <SelectItem value="bakery">🥐 Bakery</SelectItem>
                <SelectItem value="greek_yoghurt_popsicle">🍦 Greek Yogurt Popsicle</SelectItem>
                <SelectItem value="drinks">🥤 Drinks</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span>Active Globally</span>
            </label>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>Add Daily Item</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Daily Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snacks">🍿 Snacks</SelectItem>
                <SelectItem value="bakery">🥐 Bakery</SelectItem>
                <SelectItem value="greek_yoghurt_popsicle">🍦 Greek Yogurt Popsicle</SelectItem>
                <SelectItem value="drinks">🥤 Drinks</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span>Active Globally</span>
            </label>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>Update Daily Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddOns; 