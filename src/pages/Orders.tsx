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
import { MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { AlertCircle } from 'lucide-react';

interface Order {
  id: number;
  student?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
  meal?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    name: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  total_amount?: number | string;
  total_price?: number | string;
}

// Add PreOrder type
interface PreOrder {
  id: number;
  student: { id: number; name: string };
  items: { 
    meal_id: number; 
    meal_date: string; 
    meal: { name: string };
    add_ons?: Array<{
      id: number;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  created_at: string;
  total_amount: number;
  notes?: string;
  user?: { id: number; name: string }; // Added user property for consistency
}

// Add AddOnOrder type
interface AddOnOrder {
  id: number;
  user?: {
    id: number;
    name: string;
  };
  add_on?: {
    id: number;
    name: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [preOrderToEdit, setPreOrderToEdit] = useState<PreOrder | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [preOrderToDelete, setPreOrderToDelete] = useState<PreOrder | null>(null);
  const [addOnOrders, setAddOnOrders] = useState<AddOnOrder[]>([]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOrders();
      setOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pre-orders
  const fetchPreOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPreOrders();
      setPreOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch pre-orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch add-on orders
  const fetchAddOnOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAddOnOrders();
      setAddOnOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch add-on orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPreOrders();
    fetchAddOnOrders();
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.meal?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  function handleConfirmClick(orderId: number) {
    setOrderToConfirm(orderId);
    setConfirmDialogOpen(true);
  }

  function handleConfirmOrder() {
    if (!orderToConfirm) return;
    adminApi.approvePreOrder(orderToConfirm)
      .then(() => {
        toast.success(`Order #${orderToConfirm} confirmed and wallet debited!`);
        fetchOrders();
      })
      .catch((error) => {
        const msg = error?.response?.data?.message || 'Failed to confirm order.';
        toast.error(msg);
      })
      .finally(() => {
        setConfirmDialogOpen(false);
        setOrderToConfirm(null);
      });
  }

  // Bulk actions
  const handleSelectOrder = (orderId: number, checked: boolean) => {
    setSelectedOrders(prev => checked ? [...prev, orderId] : prev.filter(id => id !== orderId));
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? filteredOrders.map(o => o.id) : []);
  };
  const handleBulkConfirm = async () => {
    for (const id of selectedOrders) {
      try {
        await adminApi.approvePreOrder(id);
      } catch {}
    }
    toast.success('Selected orders confirmed');
    setSelectedOrders([]);
    fetchOrders();
  };
  const handleBulkCancel = async () => {
    for (const id of selectedOrders) {
      try {
        await adminApi.updateOrderStatus(id, 'cancelled');
      } catch {}
    }
    toast.success('Selected orders cancelled');
    setSelectedOrders([]);
    fetchOrders();
  };
  const handleViewTimeline = async (order: Order) => {
    setTimelineOrder(order);
    setTimelineOpen(true);
    setTimelineLogs([]);
    setTimelineLoading(true);
    try {
      const res = await adminApi.getActivityLogs({ model_type: 'pre_order', model_id: order.id, type: 'order' });
      setTimelineLogs(res.data.data || res.data);
    } catch {
      setTimelineLogs([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Add handlers for edit and delete
  const handleEditPreOrder = (preOrder: PreOrder) => {
    setPreOrderToEdit(preOrder);
    setEditNotes(preOrder.notes || '');
    setEditDialogOpen(true);
  };
  const handleSaveEdit = async () => {
    if (!preOrderToEdit) return;
    try {
      await adminApi.updatePreOrder(preOrderToEdit.id, { notes: editNotes });
      toast.success('Pre-order updated');
      setEditDialogOpen(false);
      fetchPreOrders();
    } catch (error) {
      toast.error('Failed to update pre-order');
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
      toast.success('Pre-order deleted');
      setDeleteDialogOpen(false);
      fetchPreOrders();
    } catch (error) {
      toast.error('Failed to delete pre-order');
    }
  };
  const handleConfirmPreOrder = async (id: number) => {
    try {
      await adminApi.confirmPreOrder(id);
      toast.success('Pre-order confirmed');
      fetchPreOrders();
    } catch (error) {
      toast.error('Failed to confirm pre-order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage meal orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0} onChange={e => handleSelectAll(e.target.checked)} />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <LoadingSpinner size={32} />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  <EmptyState icon={<AlertCircle />} message="No orders found" />
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={e => handleSelectOrder(order.id, e.target.checked)} />
                  </TableCell>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{(order.student && order.student.name) ? order.student.name : (order.user && order.user.name) ? order.user.name : 'N/A'}</TableCell>
                  <TableCell>{(order.meal && order.meal.name) ? order.meal.name : (order.product && order.product.name) ? order.product.name : 'N/A'}</TableCell>
                  <TableCell>{order.total_amount !== undefined && order.total_amount !== null && !isNaN(Number(order.total_amount)) ? `$${Number(order.total_amount).toFixed(2)}` : (order.total_price !== undefined && order.total_price !== null && !isNaN(Number(order.total_price)) ? `$${Number(order.total_price).toFixed(2)}` : 'N/A')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTimeline(order)}>View Timeline</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {order.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleConfirmClick(order.id)}>Confirm</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Cancel Order
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
      {selectedOrders.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button onClick={handleBulkConfirm} size="sm">Bulk Confirm</Button>
          <Button onClick={handleBulkCancel} size="sm" variant="outline">Bulk Cancel</Button>
          <span className="text-sm text-gray-500">{selectedOrders.length} selected</span>
        </div>
      )}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this order? This will deduct the amount from the student's wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Timeline for #{timelineOrder?.id}</DialogTitle>
          </DialogHeader>
          {timelineLoading ? (
            <div className="py-4 text-gray-500">Loading...</div>
          ) : timelineLogs.length === 0 ? (
            <div className="py-4 text-gray-500">No timeline events found.</div>
          ) : (
            <div className="py-4">
              <ol className="border-l-2 border-blue-500 pl-4">
                {timelineLogs.map((log: any) => (
                  <li key={log.id} className="mb-6">
                    <div className="flex items-center gap-2">
                      <span className="block w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="font-semibold">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="ml-4 text-sm text-gray-700">
                      {log.description}
                      {log.user && (
                        <span className="ml-2 text-xs text-gray-500">by {log.user.name}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTimelineOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6 mt-10">
        <h2 className="text-2xl font-bold">Pre-Orders</h2>
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PreOrder ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <LoadingSpinner size={32} />
                  </TableCell>
                </TableRow>
              ) : preOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <EmptyState icon={<AlertCircle />} message="No pre-orders found" />
                  </TableCell>
                </TableRow>
              ) : (
                preOrders.map((preOrder) => (
                  <TableRow key={preOrder.id}>
                    <TableCell className="font-medium">#{preOrder.id}</TableCell>
                    <TableCell>{(preOrder.student && preOrder.student.name) ? preOrder.student.name : (preOrder.user && preOrder.user.name) ? preOrder.user.name : 'N/A'}</TableCell>
                    <TableCell>
                      {Array.isArray(preOrder.items) && preOrder.items.length > 0
                        ? preOrder.items.map(item => {
                            const mealText = `${item.meal?.name || 'N/A'} (${item.meal_date || 'N/A'})`;
                            const addOnsText = item.add_ons && item.add_ons.length > 0 
                              ? ` + ${item.add_ons.map(addon => `${addon.quantity}x ${addon.name}`).join(', ')}`
                              : '';
                            return mealText + addOnsText;
                          }).join(', ')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {preOrder.total_amount !== undefined && preOrder.total_amount !== null && !isNaN(Number(preOrder.total_amount))
                        ? `$${Number(preOrder.total_amount).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        preOrder.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : preOrder.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {preOrder.status}
                      </span>
                    </TableCell>
                    <TableCell>{preOrder.created_at ? new Date(preOrder.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{preOrder.notes || ''}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPreOrder(preOrder)}>Edit Notes</DropdownMenuItem>
                          {preOrder.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleConfirmPreOrder(preOrder.id)}>Confirm</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePreOrder(preOrder)}>
                                Delete
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
        {/* Edit Notes Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pre-Order Notes</DialogTitle>
            </DialogHeader>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pre-Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this pre-order? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Add-on Orders Section */}
      <div className="space-y-6 mt-10">
        <h2 className="text-2xl font-bold">Add-on Orders</h2>
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Add-on</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <LoadingSpinner size={32} />
                  </TableCell>
                </TableRow>
              ) : addOnOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <EmptyState icon={<AlertCircle />} message="No add-on orders found" />
                  </TableCell>
                </TableRow>
              ) : (
                addOnOrders.map((addOnOrder) => (
                  <TableRow key={addOnOrder.id}>
                    <TableCell className="font-medium">#{addOnOrder.id}</TableCell>
                    <TableCell>{addOnOrder.user?.name || 'N/A'}</TableCell>
                    <TableCell>{addOnOrder.add_on?.name || 'N/A'}</TableCell>
                    <TableCell>{addOnOrder.quantity}</TableCell>
                    <TableCell>{
                      typeof addOnOrder.unit_price === 'number' && !isNaN(addOnOrder.unit_price)
                        ? `$${addOnOrder.unit_price.toFixed(2)}`
                        : (addOnOrder.unit_price && !isNaN(Number(addOnOrder.unit_price)))
                          ? `$${Number(addOnOrder.unit_price).toFixed(2)}`
                          : 'N/A'
                    }</TableCell>
                    <TableCell>{
                      typeof addOnOrder.total_price === 'number' && !isNaN(addOnOrder.total_price)
                        ? `$${addOnOrder.total_price.toFixed(2)}`
                        : (addOnOrder.total_price && !isNaN(Number(addOnOrder.total_price)))
                          ? `$${Number(addOnOrder.total_price).toFixed(2)}`
                          : 'N/A'
                    }</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        addOnOrder.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : addOnOrder.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {addOnOrder.status}
                      </span>
                    </TableCell>
                    <TableCell>{addOnOrder.created_at ? new Date(addOnOrder.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          {addOnOrder.status === 'pending' && (
                            <>
                              <DropdownMenuItem>Mark Completed</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
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
      </div>
    </div>
  );
};

export default Orders; 