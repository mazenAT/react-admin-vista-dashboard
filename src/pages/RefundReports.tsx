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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  User, 
  Package,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Refund {
  id: number;
  type: 'meal_order' | 'wallet';
  user_id: number;
  user_name: string;
  user_email: string;
  order_id: number | null;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

interface RefundStats {
  total_refunds: number;
  total_amount: number;
  pending_refunds: number;
  approved_refunds: number;
  rejected_refunds: number;
  completed_refunds: number;
  today_refunds: number;
  today_amount: number;
  this_week_refunds: number;
  this_month_refunds: number;
  average_refund_amount: number;
}

const RefundReports = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

  // Fetch refunds
  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getRefundsReport({
        search: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        date_range: selectedDateRange !== 'all' ? selectedDateRange : undefined,
        min_amount: minAmount || undefined,
        max_amount: maxAmount || undefined,
      });
      // Handle null/undefined response data
      const refundsData = response.data?.data || [];
      const refundsArray = Array.isArray(refundsData) ? refundsData : [];
      setRefunds(refundsArray);
      setFilteredRefunds(refundsArray);
    } catch (error) {
      toast.error('Failed to fetch refunds');
      setRefunds([]);
      setFilteredRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch refund statistics
  const fetchStats = async () => {
    try {
      const response = await adminApi.getRefundStats();
      // Handle null/undefined response data
      const statsData = response.data?.data || {};
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch refund stats:', error);
      setStats({
        total_refunds: 0,
        total_amount: 0,
        pending_refunds: 0,
        approved_refunds: 0,
        rejected_refunds: 0,
        completed_refunds: 0,
        today_refunds: 0,
        today_amount: 0,
        this_week_refunds: 0,
        this_month_refunds: 0,
        average_refund_amount: 0
      });
    }
  };

  useEffect(() => {
    fetchRefunds();
    fetchStats();
  }, [searchQuery, selectedStatus, selectedDateRange, minAmount, maxAmount]);

  // Handle refund status update
  const handleStatusUpdate = async (refundId: number, status: 'approved' | 'rejected') => {
    try {
      await adminApi.updateRefundStatus(refundId, status);
      toast.success(`Refund ${status} successfully`);
      fetchRefunds();
      fetchStats();
    } catch (error) {
      toast.error(`Failed to ${status} refund`);
    }
  };

  // Handle view details
  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowDetailsModal(true);
  };

  // Export refunds
  const handleExport = async () => {
    try {
      const response = await adminApi.exportRefunds({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        date_range: selectedDateRange !== 'all' ? selectedDateRange : undefined,
        min_amount: minAmount || undefined,
        max_amount: maxAmount || undefined,
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `refunds-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Refund report exported successfully');
    } catch (error) {
      toast.error('Failed to export refund report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refund Reports</h1>
          <p className="text-gray-600">Track and manage refund requests</p>
        </div>
        <Button 
          variant="outline"
          onClick={handleExport}
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_refunds || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.total_amount || 0)} total amount
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_refunds || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Refunds</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.today_refunds || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.today_amount || 0)} today
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Refund</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.average_refund_amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per refund request
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by user name, email, or refund ID..."
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
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-[120px]"
          />
          <Input
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-[120px]"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Refund ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (!filteredRefunds || filteredRefunds.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No refunds found
                </TableCell>
              </TableRow>
            ) : (
              filteredRefunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-medium">#{refund.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{refund.user_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{refund.user_email || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {refund.order_id ? `#${refund.order_id}` : 'N/A'}
                    {refund.type === 'wallet' && (
                      <div className="text-xs text-gray-400">Wallet Refund</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-red-600">
                    {formatCurrency(refund.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={refund.reason}>
                      {refund.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(refund.status)}
                      <Badge className={getStatusColor(refund.status)}>
                        {refund.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(refund.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(refund)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {refund.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(refund.id, 'approved')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(refund.id, 'rejected')}
                              className="text-red-600"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Reject
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

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund Details #{selectedRefund?.id}</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedRefund.user_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Email: {selectedRefund.user_email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Refund Type</h4>
                  <p className="text-sm text-gray-600">Type: {selectedRefund.type === 'meal_order' ? 'Meal Order Refund' : 'Wallet Refund'}</p>
                  {selectedRefund.order_id && (
                    <p className="text-sm text-gray-600">Order ID: #{selectedRefund.order_id}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Refund Information</h4>
                <p className="text-sm text-gray-600">Amount: <span className="font-medium text-red-600">{formatCurrency(selectedRefund.amount)}</span></p>
                <p className="text-sm text-gray-600">Status: <Badge className={getStatusColor(selectedRefund.status)}>{selectedRefund.status}</Badge></p>
                <p className="text-sm text-gray-600">Reason: {selectedRefund.reason}</p>
                {selectedRefund.admin_notes && (
                  <p className="text-sm text-gray-600">Notes: {selectedRefund.admin_notes}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Timeline</h4>
                  <p className="text-sm text-gray-600">Requested: {formatDate(selectedRefund.created_at)}</p>
                  {selectedRefund.processed_at && (
                    <p className="text-sm text-gray-600">Processed: {formatDate(selectedRefund.processed_at)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundReports; 