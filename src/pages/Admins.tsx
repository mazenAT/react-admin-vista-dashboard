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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  school_id?: number;
  is_active: boolean;
}

interface School {
  id: number;
  name: string;
}

const Admins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', school_id: '', role: 'admin', is_active: true });
  const [schools, setSchools] = useState<School[]>([]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAdmins();
      setAdmins(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await adminApi.getSchools();
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch schools');
    }
  };

  const handleAdd = async () => {
    try {
      await adminApi.createAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password,
        role: form.role,
        school_id: form.role === 'admin' ? parseInt(form.school_id) : undefined,
        is_active: form.is_active,
      });
      toast.success('Admin created');
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', school_id: '', role: 'admin', is_active: true });
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  const handleEdit = async () => {
    if (!selectedAdmin) return;
    try {
      await adminApi.updateAdmin(selectedAdmin.id, {
        name: form.name,
        email: form.email,
        role: form.role,
        school_id: form.role === 'admin' ? parseInt(form.school_id) : undefined,
        is_active: form.is_active,
      });
      toast.success('Admin updated');
      setShowEditModal(false);
      setSelectedAdmin(null);
      setForm({ name: '', email: '', password: '', school_id: '', role: 'admin', is_active: true });
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to update admin');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await adminApi.deleteAdmin(id);
      toast.success('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      school_id: admin.school_id?.toString() || '',
      role: admin.role,
      is_active: admin.is_active,
    });
    setShowEditModal(true);
  };

  return (
    <AdminProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admins</h1>
            <p className="text-gray-600">Manage admin users (super admin only)</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
            <Plus className="h-5 w-5" />
            <span>Add Admin</span>
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">No admins found</TableCell>
                </TableRow>
              ) : (
                admins && Array.isArray(admins) ? admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{admin.is_active ? 'Active' : 'Inactive'}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(admin)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" className="ml-2" onClick={() => handleDelete(admin.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">Error loading admins</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
        {/* Add Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pr-2">
              <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <Select value={form.role} onValueChange={value => setForm(f => ({ ...f, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {form.role === 'admin' && (
                <Select value={form.school_id} onValueChange={value => setForm(f => ({ ...f, school_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active</span>
              </label>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>Add Admin</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pr-2">
              <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Select value={form.role} onValueChange={value => setForm(f => ({ ...f, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {form.role === 'admin' && (
                <Select value={form.school_id} onValueChange={value => setForm(f => ({ ...f, school_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active</span>
              </label>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEdit}>Update Admin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminProtectedRoute>
  );
};

export default Admins; 