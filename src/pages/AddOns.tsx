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
import { Plus, Edit, Trash2, School, Settings, Eye, EyeOff, Save } from 'lucide-react';
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
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
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
      if (response.data?.data?.length > 0 && !selectedSchool) {
        setSelectedSchool(response.data.data[0].id);
      }
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
      toast.success('Add-on created');
      setShowAddModal(false);
      setForm({ name: '', description: '', category: 'snacks', price: '', is_active: true });
      fetchAddOns();
      if (selectedSchool) {
        fetchSchoolData();
      }
    } catch (error) {
      toast.error('Failed to create add-on');
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
      toast.success('Add-on updated');
      setShowEditModal(false);
      setSelectedAddOn(null);
      setForm({ name: '', description: '', category: 'snacks', price: '', is_active: true });
      fetchAddOns();
      if (selectedSchool) {
        fetchSchoolData();
      }
    } catch (error) {
      toast.error('Failed to update add-on');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this add-on?')) return;
    try {
      await adminApi.deleteAddOn(id);
      toast.success('Add-on deleted');
      fetchAddOns();
      if (selectedSchool) {
        fetchSchoolData();
      }
    } catch (error) {
      toast.error('Failed to delete add-on');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Items Management</h1>
          <p className="text-gray-600">Manage meal add-ons and school-specific visibility</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5" />
          <span>Add Daily Item</span>
        </Button>
      </div>

      {/* School Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            School Selection
          </CardTitle>
          <CardDescription>
            Select a school to manage category and item visibility settings
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedSchool && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Category Controls</TabsTrigger>
            <TabsTrigger value="items">Individual Items</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryStatuses.map((category) => (
                <Card key={category.category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{categoryEmojis[category.category]}</span>
                      {categoryNames[category.category]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {category.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Items:</span>
                        <span className="text-sm font-medium">{category.add_on_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active for School:</span>
                        <span className="text-sm font-medium text-blue-600">{category.active_for_school_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {schoolOverview && (
              <Card>
                <CardHeader>
                  <CardTitle>School Status Summary</CardTitle>
                  <CardDescription>
                    Complete overview of category and item visibility for {schoolOverview.school.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {schoolOverview.categories.map((category) => (
                      <div key={category.category} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{categoryEmojis[category.category]}</span>
                            <div>
                              <h4 className="font-semibold">{categoryNames[category.category]}</h4>
                              <p className="text-sm text-gray-600">
                                {category.active_add_ons} of {category.total_add_ons} items active
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {category.is_active ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {category.is_active ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                        
                        {category.is_active && category.add_ons.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {category.add_ons.map((addOn) => (
                                <div key={addOn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{addOn.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{addOn.price.toFixed(2)} EGP</span>
                                    {addOn.effective_status ? (
                                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
                                    ) : (
                                      <div className="w-2 h-2 bg-red-500 rounded-full" title="Inactive" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Category Controls Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Category Visibility Controls
                </CardTitle>
                <CardDescription>
                  Toggle entire categories on/off for {schools.find(s => s.id === selectedSchool)?.name}. 
                  When a category is hidden, all items in that category will be hidden for this school.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStatuses.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryEmojis[category.category]}</span>
                        <div>
                          <h4 className="font-semibold">{categoryNames[category.category]}</h4>
                          <p className="text-sm text-gray-600">
                            {category.add_on_count} items • {category.active_for_school_count} currently active for this school
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
          </TabsContent>

          {/* Individual Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search add-ons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                  <SelectItem value="greek_yoghurt_popsicle">Greek Yogurt Popsicle</SelectItem>
                  <SelectItem value="drinks">Drinks</SelectItem>
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

            {schoolOverview && (
              <Card>
                <CardHeader>
                  <CardTitle>Individual Item Controls</CardTitle>
                  <CardDescription>
                    Manage individual add-on visibility for {schoolOverview.school.name}. 
                    Items can only be active if their category is also active.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {schoolOverview.categories
                      .filter(cat => selectedCategory === 'all' || cat.category === selectedCategory)
                      .map((category) => (
                      <div key={category.category}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{categoryEmojis[category.category]}</span>
                          <h4 className="font-semibold">{categoryNames[category.category]}</h4>
                          <span className={`text-sm px-2 py-1 rounded ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.is_active ? 'Category Active' : 'Category Hidden'}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {category.add_ons
                            .filter(addOn => 
                              !searchQuery || 
                              addOn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              addOn.description?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .filter(addOn => 
                              selectedStatus === 'all' || 
                              (selectedStatus === 'active' && addOn.effective_status) ||
                              (selectedStatus === 'inactive' && !addOn.effective_status)
                            )
                            .map((addOn) => (
                            <div key={addOn.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h5 className="font-medium">{addOn.name}</h5>
                                  <span className="text-sm text-gray-600">{addOn.price.toFixed(2)} EGP</span>
                                  <span className={`text-xs px-2 py-1 rounded ${addOn.global_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {addOn.global_active ? 'Global Active' : 'Global Inactive'}
                                  </span>
                                </div>
                                {addOn.description && (
                                  <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm font-medium">School Status</div>
                                  <span className={`text-xs ${addOn.effective_status ? 'text-green-600' : 'text-red-600'}`}>
                                    {addOn.effective_status ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                
                                <Switch
                                  checked={addOn.school_specific_status ?? addOn.global_active}
                                  onCheckedChange={(checked) => handleAddOnToggle(addOn.id, checked)}
                                  disabled={!category.is_active || !addOn.global_active}
                                />
                                
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm" onClick={() => openEditModal(addOn)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDelete(addOn.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Global Add-ons Table (when no school selected or for global management) */}
      {!selectedSchool && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Global Add-ons Management</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search add-ons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="greek_yoghurt_popsicle">Greek Yogurt Popsicle</SelectItem>
                <SelectItem value="drinks">Drinks</SelectItem>
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
                  <p className="text-sm font-medium text-gray-600">Total Add-ons</p>
                  <p className="text-2xl font-bold text-gray-900">{addOns.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">+</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bakery</p>
                  <p className="text-2xl font-bold text-yellow-600">{addOns.filter(a => a.category === 'bakery').length}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">🍞</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Snacks</p>
                  <p className="text-2xl font-bold text-orange-600">{addOns.filter(a => a.category === 'snacks').length}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-medium">🍿</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drinks</p>
                  <p className="text-2xl font-bold text-blue-600">{addOns.filter(a => a.category === 'drinks').length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">🥤</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : (!addOns || addOns.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No add-ons found</TableCell>
                  </TableRow>
                ) : (
                  addOns.map((addOn) => (
                    <TableRow key={addOn.id}>
                      <TableCell>{addOn.name}</TableCell>
                      <TableCell>{addOn.description}</TableCell>
                      <TableCell>{addOn.price.toFixed(2)} EGP</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${addOn.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{addOn.is_active ? 'Active' : 'Inactive'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          addOn.category === 'bakery' ? 'bg-yellow-100 text-yellow-800' :
                          addOn.category === 'snacks' ? 'bg-orange-100 text-orange-800' :
                          addOn.category === 'greek_yoghurt_popsicle' ? 'bg-purple-100 text-purple-800' :
                          addOn.category === 'drinks' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {addOn.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(addOn)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => handleDelete(addOn.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Daily Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pr-2">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger className="w-[180px]">
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
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pr-2">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger className="w-[180px]">
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