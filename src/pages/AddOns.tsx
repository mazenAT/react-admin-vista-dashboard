import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddOn {
  id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
  is_active: boolean;
}

const AddOns = () => {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    category: 'bakery',
    price: '', 
    is_active: true 
  });

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAddOns();
      setAddOns(response.data);
    } catch (error) {
      toast.error('Failed to fetch add-ons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddOns();
  }, []);

  const handleAdd = async () => {
    try {
      await adminApi.createAddOn({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        is_active: form.is_active,
      });
      toast.success('Add-on created');
      setShowAddModal(false);
      setForm({ name: '', description: '', category: 'bakery', price: '', is_active: true });
      fetchAddOns();
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
      setForm({ name: '', description: '', category: 'bakery', price: '', is_active: true });
      fetchAddOns();
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
    } catch (error) {
      toast.error('Failed to delete add-on');
    }
  };

  const openEditModal = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setForm({
      name: addOn.name,
      description: addOn.description || '',
      category: addOn.category || 'bakery',
      price: addOn.price.toString(),
      is_active: addOn.is_active,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add-ons</h1>
          <p className="text-gray-600">Manage meal add-ons and extras</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5" />
          <span>Add Add-on</span>
        </Button>
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
            ) : addOns.length === 0 ? (
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
                  <TableCell>{addOn.category}</TableCell>
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
      {/* Add Modal */}
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Add-on</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pr-2">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span>Active</span>
            </label>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>Add Add-on</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Modal */}
              <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Add-on</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pr-2">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Select onValueChange={(value) => setForm(f => ({ ...f, category: value }))} value={form.category}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span>Active</span>
            </label>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>Update Add-on</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddOns; 