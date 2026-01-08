import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchoolFilter } from '@/hooks/useSchoolFilter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Delivery {
  id: number;
  pre_order_id: number;
  pre_order_item_id: number;
  user_id: number;
  school_id: number;
  delivery_date: string;
  status: 'pending' | 'delivered' | 'failed' | 'cancelled';
  delivered_at?: string;
  delivered_by?: number;
  delivery_notes?: string;
  amount: number;
  revenue_calculated: boolean;
  revenue_calculated_at?: string;
  preOrder: {
    user: {
      name: string;
    };
  };
  preOrderItem: {
    meal: {
      name: string;
    };
  };
  school: {
    name: string;
  };
  deliveredBy?: {
    name: string;
  };
}

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  
  // Use school filter hook - handles admin role restrictions automatically
  const { schools, selectedSchool, setSelectedSchool, schoolIdParam, showSchoolSelector } = useSchoolFilter();
  
  // Modal states
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [actionType, setActionType] = useState<'delivered' | 'failed' | 'cancelled'>('delivered');
  const [actionNotes, setActionNotes] = useState('');
  const [performingAction, setPerformingAction] = useState(false);

  // Fetch deliveries
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (schoolIdParam) params.school_id = schoolIdParam;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await adminApi.getDeliveries(params);
      // Handle null/undefined response data
      const deliveriesData = response.data?.data || [];
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
    } catch (error) {
      toast.error('Failed to fetch deliveries');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch delivery stats
  const fetchStats = async () => {
    try {
      const response = await adminApi.getDeliveryStats();
      // Handle null/undefined response data
      const statsData = response.data?.data || {};
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch delivery stats:', error);
      setStats({});
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, [selectedStatus, schoolIdParam, startDate, endDate]);

  // Handle delivery action
  const handleDeliveryAction = async () => {
    if (!selectedDelivery) return;

    try {
      setPerformingAction(true);
      
      switch (actionType) {
        case 'delivered':
          await adminApi.markDeliveryAsDelivered(selectedDelivery.id, { notes: actionNotes });
          toast.success('Delivery marked as delivered');
          break;
        case 'failed':
          await adminApi.markDeliveryAsFailed(selectedDelivery.id, { notes: actionNotes });
          toast.success('Delivery marked as failed');
          break;
        case 'cancelled':
          await adminApi.markDeliveryAsCancelled(selectedDelivery.id, { notes: actionNotes });
          toast.success('Delivery marked as cancelled');
          break;
      }
      
      setShowActionModal(false);
      setSelectedDelivery(null);
      setActionNotes('');
      fetchDeliveries();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update delivery status');
    } finally {
      setPerformingAction(false);
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Deliveries</h1>
          <p className="text-gray-600">Manage meal delivery status and track revenue</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_deliveries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_deliveries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered_today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Calculated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${stats.revenue_calculated?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search deliveries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {showSchoolSelector && (
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
        )}
        <Input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[150px]"
        />
        <Input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[150px]"
        />
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (!deliveries || deliveries.length === 0) ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No deliveries found
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>{delivery.id}</TableCell>
                  <TableCell>{delivery.preOrder?.user?.name || 'N/A'}</TableCell>
                  <TableCell>{delivery.preOrderItem?.meal?.name || 'N/A'}</TableCell>
                  <TableCell>{delivery.school?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(delivery.delivery_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(delivery.status)}
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>${delivery.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {delivery.revenue_calculated ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-xs">
                        {delivery.revenue_calculated ? 'Calculated' : 'Pending'}
                      </span>
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
                        {delivery.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDelivery(delivery);
                              setActionType('delivered');
                              setShowActionModal(true);
                            }}>
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDelivery(delivery);
                              setActionType('failed');
                              setShowActionModal(true);
                            }}>
                              Mark as Failed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDelivery(delivery);
                              setActionType('cancelled');
                              setShowActionModal(true);
                            }}>
                              Mark as Cancelled
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mark as {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add any notes about this delivery..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedDelivery(null);
                  setActionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeliveryAction}
                disabled={performingAction}
                className={
                  actionType === 'delivered' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'failed' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }
              >
                {performingAction ? 'Updating...' : `Mark as ${actionType}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deliveries; 