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
import { AlertCircle, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

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
  school: {
    id: number;
    name: string;
  };
  weekly_plan: {
    id: number;
    start_date: string;
    end_date: string;
  };
  items: PreOrderItem[];
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  total_amount: number;
  notes?: string;
  order_cutoff_at: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchPreOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPreOrders();
      // Handle null/undefined response data
      const ordersData = response.data?.data || [];
      const orders = Array.isArray(ordersData) ? ordersData : [];
      setPreOrders(orders);
      setFilteredPreOrders(orders);
    } catch (error) {
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
      // Handle null/undefined response data
      const statsData = response.data?.data || {};
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total_orders: 0,
        total_revenue: 0,
        pending_orders: 0,
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
      const schoolsData = response.data?.data || [];
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
        order.id.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by school
    if (selectedSchool !== 'all') {
      filtered = filtered.filter(order => order.school?.id?.toString() === selectedSchool);
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
    setSelectedOrders(prev => 
      checked ? [...prev, orderId] : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? filteredPreOrders.map(order => order.id) : []);
  };

  const handleBulkMarkAsDelivered = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to mark as delivered');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedOrders.map(id => adminApi.markAsDelivered(id));
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} orders marked as delivered successfully`);
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

    setBulkActionLoading(true);
    try {
      const promises = selectedOrders.map(id => adminApi.cancelPreOrder(id));
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} orders cancelled successfully`);
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

    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedOrders.map(id => adminApi.deletePreOrder(id));
      await Promise.all(promises);
      toast.success(`${selectedOrders.length} orders deleted successfully`);
      setSelectedOrders([]);
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete some orders');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleRefund = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setRefundAmount(preOrder.total_amount.toString());
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedPreOrder || !refundAmount) {
      toast.error('Please enter a refund amount');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0) {
      toast.error('Refund amount must be greater than 0');
      return;
    }

    setRefundLoading(true);
    try {
      await adminApi.adminRefund(selectedPreOrder.user.id, {
        amount: amount,
        reason: refundReason || undefined
      });
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      fetchPreOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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
                ${stats.total_revenue.toFixed(2)} total revenue
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
                ${stats.today_revenue.toFixed(2)} today's revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_orders}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
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
            placeholder="Search by student name, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
              <TableHead>Student</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Week Plan</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <LoadingSpinner size={32} />
                </TableCell>
              </TableRow>
            ) : (!filteredPreOrders || filteredPreOrders.length === 0) ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                      <div className="font-medium">{preOrder.user.name}</div>
                      <div className="text-sm text-gray-500">{preOrder.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{preOrder.school.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {getTotalItems(preOrder)} total items
                      </div>
                      <div className="text-xs text-gray-500">
                        {preOrder.items.length} meal selections
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${preOrder.total_amount.toFixed(2)}
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
                        {preOrder.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleCancelPreOrder(preOrder)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsDelivered(preOrder)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeletePreOrder(preOrder)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-purple-600" 
                              onClick={() => handleRefund(preOrder)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Refund
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

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg mt-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleBulkMarkAsDelivered} 
              disabled={bulkActionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkActionLoading ? 'Processing...' : `Mark ${selectedOrders.length} as Delivered`}
            </Button>
            <Button 
              onClick={handleBulkCancel} 
              disabled={bulkActionLoading}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              {bulkActionLoading ? 'Processing...' : `Cancel ${selectedOrders.length}`}
            </Button>
            <Button 
              onClick={handleBulkDelete} 
              disabled={bulkActionLoading}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              {bulkActionLoading ? 'Processing...' : `Delete ${selectedOrders.length}`}
            </Button>
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
                  <h3 className="font-semibold mb-2">Student Information</h3>
                  <p><strong>Name:</strong> {selectedPreOrder.user.name}</p>
                  <p><strong>Email:</strong> {selectedPreOrder.user.email}</p>
                  <p><strong>School:</strong> {selectedPreOrder.school.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedPreOrder.status)}`}>
                      {selectedPreOrder.status}
                    </Badge>
                  </p>
                  <p><strong>Total Amount:</strong> ${selectedPreOrder.total_amount.toFixed(2)}</p>
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
                          <p className="font-medium">${item.total_price.toFixed(2)}</p>
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
                                <span>${addon.total_price.toFixed(2)} (Qty: {addon.quantity})</span>
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

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Student: {selectedPreOrder?.user.name}</p>
            <p>Email: {selectedPreOrder?.user.email}</p>
            <p>Total Amount: ${selectedPreOrder?.total_amount.toFixed(2)}</p>
            <div>
              <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700">Refund Amount</label>
              <input
                type="number"
                id="refundAmount"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full border rounded p-2"
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="refundReason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
              <textarea
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            <Button onClick={handleRefundSubmit} disabled={refundLoading}>
              {refundLoading ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders; 