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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, Calendar, User, DollarSign, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { AlertCircle, Eye, Edit, Trash2, CheckCircle, XCircle, Download, RotateCcw, MessageSquare } from 'lucide-react';

interface PreOrderItem {
  id: number;
  meal_id: number;
  meal_date: string;
  meal: {
    id: number;
    name: string;
    category: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  add_ons?: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface PreOrder {
  id: number;
  user: { 
    id: number; 
    name: string;
    email: string;
  };
  family_member_id?: number;
  family_member?: {
    id: number;
    name: string;
    grade: string;
    class: string;
  };
  weekly_plan: {
    id: number;
    start_date: string;
    end_date: string;
    school: {
      id: number;
      name: string;
    };
  };
  items: PreOrderItem[];
  status: 'confirmed' | 'delivered' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  total_amount: number;
  notes?: string;
  order_cutoff_at: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  
  confirmed_orders: number;
  cancelled_orders: number;
  today_orders: number;
  today_revenue: number;
  delivered_orders: number;
}

const Orders = () => {
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [filteredPreOrders, setFilteredPreOrders] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [schools, setSchools] = useState<Array<{id: number, name: string}>>([]);
  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [preOrderToDelete, setPreOrderToDelete] = useState<PreOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [showBulkNotesDialog, setShowBulkNotesDialog] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');

  const fetchPreOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPreOrders();
      // The backend returns paginated data
      const ordersData = response.data?.data?.data || response.data?.data || response.data || [];
      console.log('Orders Response:', response);
      console.log('Orders Data:', ordersData);
      const orders = Array.isArray(ordersData) ? ordersData : [];
      setPreOrders(orders);
      setFilteredPreOrders(orders);
    } catch (error) {
      console.error('Orders Error:', error);
      toast.error('Failed to fetch pre-orders');
      setPreOrders([]);
      setFilteredPreOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getOrderStats();
      // The backend returns the data directly
      const statsData = response.data?.data || response.data || {};
      console.log('Stats Response:', response);
      console.log('Stats Data:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total_orders: 0,
        total_revenue: 0,

        confirmed_orders: 0,
        cancelled_orders: 0,
        today_orders: 0,
        today_revenue: 0,
        delivered_orders: 0
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await adminApi.getSchools();
      // Handle null/undefined response data
      const schoolsData = response.data?.data || response.data || [];
      console.log('Schools Response:', response);
      console.log('Schools Data:', schoolsData);
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      setSchools([]);
    }
  };

  useEffect(() => {
    fetchPreOrders();
    fetchStats();
    fetchSchools();
  }, []);

  useEffect(() => {
    let filtered = preOrders || [];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.family_member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by school
    if (selectedSchool !== 'all') {
      filtered = filtered.filter(order => order.weekly_plan?.school?.id?.toString() === selectedSchool);
    }

    setFilteredPreOrders(filtered);
  }, [preOrders, searchTerm, selectedStatus, selectedSchool]);

  const handleViewDetails = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setShowDetailsModal(true);
  };

  const handleEditNotes = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setEditNotes(preOrder.notes || '');
    setShowEditModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedPreOrder) return;
    
    try {
      await adminApi.updatePreOrder(selectedPreOrder.id, { notes: editNotes });
      toast.success('Notes updated successfully');
      setShowEditModal(false);
      fetchPreOrders();
    } catch (error) {
      toast.error('Failed to update notes');
    }
  };

  const handleDeletePreOrder = (preOrder: PreOrder) => {
    setPreOrderToDelete(preOrder);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!preOrderToDelete) return;
    
    try {
      await adminApi.deletePreOrder(preOrderToDelete.id);
      toast.success('Pre-order deleted successfully');
      setDeleteDialogOpen(false);
      setPreOrderToDelete(null);
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete pre-order');
    }
  };

  const handleCancelPreOrder = async (preOrder: PreOrder) => {
    try {
      await adminApi.cancelPreOrder(preOrder.id);
      toast.success('Pre-order cancelled successfully');
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel pre-order');
    }
  };

  const handleMarkAsDelivered = async (preOrder: PreOrder) => {
    try {
      await adminApi.markAsDelivered(preOrder.id);
      toast.success('Pre-order marked as delivered successfully');
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark pre-order as delivered');
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    console.log('Selecting order:', orderId, 'checked:', checked);
    setSelectedOrders(prev => {
      const newSelection = checked ? [...prev, orderId] : prev.filter(id => id !== orderId);
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    console.log('Select all:', checked, 'filtered orders:', filteredPreOrders.map(o => o.id));
    setSelectedOrders(checked ? filteredPreOrders.map(order => order.id) : []);
  };

  const handleBulkMarkAsDelivered = async () => {
    // Filter to confirmed orders only
    const deliverableOrders = selectedOrders.filter(id => {
      const order = preOrders.find(o => o.id === id);
      return order?.status === 'confirmed';
    });

    if (deliverableOrders.length === 0) {
      toast.error('No confirmed orders selected');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = deliverableOrders.map(id => adminApi.markAsDelivered(id));
      await Promise.all(promises);
      toast.success(`${deliverableOrders.length} orders marked as delivered successfully`);
      setSelectedOrders([]);
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark some orders as delivered');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to cancel');
      return;
    }

    // Filter to confirmed orders only
    const cancellableOrders = selectedOrders.filter(id => {
      const order = preOrders.find(o => o.id === id);
      return order?.status === 'confirmed';
    });

    if (cancellableOrders.length === 0) {
      toast.error('No confirmed orders selected');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = cancellableOrders.map(id => adminApi.cancelPreOrder(id));
      await Promise.all(promises);
      toast.success(`${cancellableOrders.length} orders cancelled successfully`);
      setSelectedOrders([]);
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel some orders');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to delete');
      return;
    }

    // Filter to confirmed orders only
    const deletableOrders = selectedOrders.filter(id => {
      const order = preOrders.find(o => o.id === id);
      return order?.status === 'confirmed';
    });

    if (deletableOrders.length === 0) {
      toast.error('No confirmed orders selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${deletableOrders.length} confirmed orders? This action cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = deletableOrders.map(id => adminApi.deletePreOrder(id));
      await Promise.all(promises);
      toast.success(`${deletableOrders.length} orders deleted successfully`);
      setSelectedOrders([]);
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete some orders');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Enhanced bulk actions (refund functionality removed - parents handle refunds)

  const handleBulkUpdateNotes = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to update notes');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedOrders.map(id => 
        adminApi.updatePreOrder(id, { notes: bulkNotes })
      );
      await Promise.all(promises);
      toast.success(`Notes updated for ${selectedOrders.length} orders`);
      setSelectedOrders([]);
      setBulkNotes('');
      setShowBulkNotesDialog(false);
      fetchPreOrders();
    } catch (error) {
      toast.error('Failed to update notes for some orders');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkExport = async () => {
    const exportData = selectedOrders.map(id => {
      const order = preOrders.find(o => o.id === id);
      return {
        id: order?.id,
        family_member: order?.family_member?.name || 'N/A',
        parent: order?.user.name,
        parent_email: order?.user.email,
        status: order?.status,
        total_amount: order?.total_amount,
        created_at: order?.created_at,
        school: order?.weekly_plan?.school?.name,
        notes: order?.notes || '',
      };
    });
    
    // Convert to CSV
    const headers = ['ID', 'Family Member', 'Parent', 'Parent Email', 'Status', 'Total Amount', 'Created At', 'School', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => [
        row.id,
        `"${row.family_member}"`,
        `"${row.parent}"`,
        `"${row.parent_email}"`,
        row.status,
        row.total_amount,
        row.created_at,
        `"${row.school}"`,
        `"${row.notes}"`
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedOrders.length} orders to CSV`);
    setSelectedOrders([]);
  };

  // Get available bulk actions based on selected orders
  const getAvailableBulkActions = () => {
    const statusCounts = selectedOrders.reduce((acc, id) => {
      const order = preOrders.find(o => o.id === id);
      const status = order?.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      canDeliver: statusCounts.confirmed > 0,
      canCancel: statusCounts.confirmed > 0,
      canDelete: statusCounts.confirmed > 0,
      canExport: selectedOrders.length > 0,
      canUpdateNotes: selectedOrders.length > 0,
      statusBreakdown: statusCounts,
    };
  };

  // Handle bulk action with confirmation
  const handleBulkActionWithConfirm = (action: string) => {
    setPendingBulkAction(action);
    setShowBulkConfirmDialog(true);
  };

  // Execute bulk action after confirmation
  const executeBulkAction = async () => {
    switch (pendingBulkAction) {
      case 'deliver':
        await handleBulkMarkAsDelivered();
        break;
      case 'cancel':
        await handleBulkCancel();
        break;
      case 'delete':
        await handleBulkDelete();
        break;
      case 'export':
        await handleBulkExport();
        break;
      case 'notes':
        setShowBulkNotesDialog(true);
        break;
    }
    setShowBulkConfirmDialog(false);
    setPendingBulkAction(null);
  };

  // Get action button style
  const getActionButtonStyle = (action: string) => {
    switch (action) {
      case 'deliver':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'cancel':
        return 'border-orange-500 text-orange-600 hover:bg-orange-50';
      case 'delete':
        return 'border-red-500 text-red-600 hover:bg-red-50';
      case 'export':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'notes':
        return 'border-gray-500 text-gray-600 hover:bg-gray-50';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            handleSelectAll(true);
            break;
          case 'd':
            e.preventDefault();
            if (selectedOrders.length > 0) {
              handleBulkActionWithConfirm('deliver');
            }
            break;
          case 'c':
            e.preventDefault();
            if (selectedOrders.length > 0) {
              handleBulkActionWithConfirm('cancel');
            }
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedOrders]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';

      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (preOrder: PreOrder) => {
    return preOrder.items.reduce((total, item) => {
      const mealCount = item.quantity;
      const addOnCount = item.add_ons?.reduce((sum, addon) => sum + addon.quantity, 0) || 0;
      return total + mealCount + addOnCount;
    }, 0);
  };

  const formatMealDetails = (preOrder: PreOrder) => {
    return preOrder.items.map((item, index) => {
      const mealName = item.meal?.name || 'Unknown Meal';
      const addOns = item.add_ons?.map(addon => `${addon.name} (${addon.quantity})`).join(', ') || '';
      
      return (
        <div key={index} className="mb-2 last:mb-0">
          <div className="text-sm font-medium text-gray-900">
            {mealName} {item.quantity > 1 && `(x${item.quantity})`}
          </div>
          {addOns && (
            <div className="text-xs text-gray-500 mt-1">
              Add-ons: {addOns}
            </div>
          )}
        </div>
      );
    });
  };

  const getEarliestDeliveryDate = (preOrder: PreOrder): string | null => {
    if (!preOrder.items || preOrder.items.length === 0) {
      return null;
    }
    
    const mealDates = preOrder.items
      .map(item => item.meal_date)
      .filter(date => date != null)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return mealDates.length > 0 ? mealDates[0] : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pre-Orders Management</h1>
          <p className="text-gray-600">Manage all student pre-orders and meal selections</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                {Number(stats.total_revenue).toFixed(2)} EGP total revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today_orders}</div>
              <p className="text-xs text-muted-foreground">
                {Number(stats.today_revenue).toFixed(2)} EGP today's revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed_orders}</div>
              <p className="text-xs text-muted-foreground">
                Ready for delivery
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered_orders}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by family member name, parent name, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>⌘A: Select All</span>
          <span>⌘D: Mark Delivered</span>
          <span>⌘C: Cancel Orders</span>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>

            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="School" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map(school => (
              <SelectItem key={school.id} value={school.id.toString()}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pre-Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input 
                  type="checkbox" 
                  checked={selectedOrders.length === filteredPreOrders.length && filteredPreOrders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Family Member</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Week Plan</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <LoadingSpinner size={32} />
                </TableCell>
              </TableRow>
            ) : (!filteredPreOrders || filteredPreOrders.length === 0) ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  <EmptyState icon={<AlertCircle />} message="No pre-orders found" />
                </TableCell>
              </TableRow>
            ) : (
              filteredPreOrders.map((preOrder) => (
                <TableRow key={preOrder.id}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.includes(preOrder.id)}
                      onChange={(e) => handleSelectOrder(preOrder.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{preOrder.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {preOrder.family_member ? preOrder.family_member.name : preOrder.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {preOrder.family_member ? `${preOrder.family_member.grade} - ${preOrder.family_member.class}` : preOrder.user.email}
                      </div>
                      {preOrder.family_member && (
                        <div className="text-xs text-gray-400">
                          Parent: {preOrder.user.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{preOrder.weekly_plan?.school?.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {formatMealDetails(preOrder)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <p className="text-sm text-gray-600">
                      {Number(preOrder.total_amount).toFixed(2)} EGP
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(preOrder.status)}>
                      {preOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(preOrder.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-blue-600">
                      {getEarliestDeliveryDate(preOrder) 
                        ? formatDate(getEarliestDeliveryDate(preOrder)!) 
                        : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(preOrder.weekly_plan.start_date)} - {formatDate(preOrder.weekly_plan.end_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(preOrder)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditNotes(preOrder)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Notes
                        </DropdownMenuItem>

                        {preOrder.status === 'confirmed' && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkAsDelivered(preOrder)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelPreOrder(preOrder)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeletePreOrder(preOrder)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
            
            {/* Status breakdown */}
            <div className="text-xs text-gray-600 flex gap-2">
              {Object.entries(getAvailableBulkActions().statusBreakdown).map(([status, count]) => (
                <span key={status} className="px-2 py-1 bg-gray-100 rounded">
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Mark as Delivered */}
            {getAvailableBulkActions().canDeliver && (
              <Button 
                onClick={() => handleBulkActionWithConfirm('deliver')}
                disabled={bulkActionLoading}
                className={getActionButtonStyle('deliver')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {bulkActionLoading ? 'Processing...' : `Mark ${selectedOrders.length} as Delivered`}
              </Button>
            )}
            
            {/* Cancel Orders */}
            {getAvailableBulkActions().canCancel && (
              <Button 
                onClick={() => handleBulkActionWithConfirm('cancel')}
                disabled={bulkActionLoading}
                variant="outline"
                className={getActionButtonStyle('cancel')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {bulkActionLoading ? 'Processing...' : `Cancel ${selectedOrders.length}`}
              </Button>
            )}
            

            
            {/* Update Notes */}
            {getAvailableBulkActions().canUpdateNotes && (
              <Button 
                onClick={() => handleBulkActionWithConfirm('notes')}
                disabled={bulkActionLoading}
                variant="outline"
                className={getActionButtonStyle('notes')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Update Notes
              </Button>
            )}
            
            {/* Export Orders */}
            {getAvailableBulkActions().canExport && (
              <Button 
                onClick={() => handleBulkActionWithConfirm('export')}
                disabled={bulkActionLoading}
                className={getActionButtonStyle('export')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            
            {/* Delete Orders */}
            {getAvailableBulkActions().canDelete && (
              <Button 
                onClick={() => handleBulkActionWithConfirm('delete')}
                disabled={bulkActionLoading}
                variant="outline"
                className={getActionButtonStyle('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkActionLoading ? 'Processing...' : `Delete ${selectedOrders.length}`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pre-Order Details #{selectedPreOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedPreOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Family Member Information</h3>
                  <p><strong>Family Member:</strong> {selectedPreOrder.family_member ? selectedPreOrder.family_member.name : 'N/A'}</p>
                  <p><strong>Grade & Class:</strong> {selectedPreOrder.family_member ? `${selectedPreOrder.family_member.grade} - ${selectedPreOrder.family_member.class}` : 'N/A'}</p>
                  <p><strong>Parent:</strong> {selectedPreOrder.user.name}</p>
                  <p><strong>Parent Email:</strong> {selectedPreOrder.user.email}</p>
                  <p><strong>School:</strong> {selectedPreOrder.weekly_plan?.school?.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedPreOrder.status)}`}>
                      {selectedPreOrder.status}
                    </Badge>
                  </p>
                  <p><strong>Total Amount:</strong> {Number(selectedPreOrder.total_amount).toFixed(2)} EGP</p>
                  <p><strong>Order Date:</strong> {formatDate(selectedPreOrder.created_at)}</p>
                  <p><strong>Cutoff Date:</strong> {formatDate(selectedPreOrder.order_cutoff_at)}</p>
                </div>
              </div>

              {/* Week Plan */}
              <div>
                <h3 className="font-semibold mb-2">Weekly Plan</h3>
                <p><strong>Period:</strong> {formatDate(selectedPreOrder.weekly_plan.start_date)} - {formatDate(selectedPreOrder.weekly_plan.end_date)}</p>
              </div>

              {/* Notes */}
              {selectedPreOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPreOrder.notes}</p>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedPreOrder.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.meal.name}</h4>
                          <p className="text-sm text-gray-500">Category: {item.meal.category}</p>
                          <p className="text-sm text-gray-500">Date: {formatDate(item.meal_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Number(item.total_price).toFixed(2)} EGP</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      
                      {/* Add-ons */}
                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="font-medium text-sm mb-2">Add-ons:</h5>
                          <div className="space-y-1">
                            {item.add_ons.map((addon, addonIndex) => (
                              <div key={addonIndex} className="flex justify-between items-center text-sm">
                                <span>{addon.name} ({addon.category})</span>
                                <span>{Number(addon.total_price).toFixed(2)} EGP (Qty: {addon.quantity})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order Notes</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-3"
            rows={4}
            placeholder="Add notes about this order..."
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pre-Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pre-order? This action cannot be undone and will refund the student's wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showBulkConfirmDialog} onOpenChange={setShowBulkConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingBulkAction === 'deliver' && 'Mark Orders as Delivered'}
              {pendingBulkAction === 'cancel' && 'Cancel Orders'}
              {pendingBulkAction === 'delete' && 'Delete Orders'}
              {pendingBulkAction === 'export' && 'Export Orders'}
              {pendingBulkAction === 'notes' && 'Update Notes'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBulkAction === 'deliver' && `Are you sure you want to mark ${selectedOrders.length} order(s) as delivered?`}
              {pendingBulkAction === 'cancel' && `Are you sure you want to cancel ${selectedOrders.length} order(s)? This will refund the student's wallet.`}
              {pendingBulkAction === 'delete' && `Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`}
              {pendingBulkAction === 'export' && `Export ${selectedOrders.length} order(s) to CSV file?`}
              {pendingBulkAction === 'notes' && `Update notes for ${selectedOrders.length} order(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkConfirmDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} className={
              pendingBulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
              pendingBulkAction === 'cancel' ? 'bg-orange-600 hover:bg-orange-700' :
              'bg-blue-600 hover:bg-blue-700'
            }>
              {pendingBulkAction === 'deliver' && 'Mark as Delivered'}
              {pendingBulkAction === 'cancel' && 'Cancel Orders'}
              {pendingBulkAction === 'delete' && 'Delete Orders'}
              {pendingBulkAction === 'export' && 'Export CSV'}
              {pendingBulkAction === 'notes' && 'Update Notes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Notes Update Dialog */}
      <Dialog open={showBulkNotesDialog} onOpenChange={setShowBulkNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Notes for {selectedOrders.length} Order(s)</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-3"
            rows={4}
            placeholder="Enter notes to add to all selected orders..."
            value={bulkNotes}
            onChange={(e) => setBulkNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBulkNotesDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdateNotes} disabled={bulkActionLoading}>
              {bulkActionLoading ? 'Updating...' : 'Update Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders; 