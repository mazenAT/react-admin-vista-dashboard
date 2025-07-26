import React, { useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Users, School, DollarSign, ClipboardList } from 'lucide-react';

const Reports: React.FC = () => {
  // State for each report
  const [overview, setOverview] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [topWallets, setTopWallets] = useState<any>(null);
  const [refunds, setRefunds] = useState<any>(null);
  const [mealOrderStats, setMealOrderStats] = useState<any>(null);
  const [addOnOrderStats, setAddOnOrderStats] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getDashboardStats().then(res => setOverview(res.data?.data)),
      adminApi.getOrdersByStatus().then(res => setOrderStatus(res.data?.data)),
      adminApi.getTopWalletBalances().then(res => setTopWallets(res.data?.data)),
      adminApi.getRefundsReport().then(res => setRefunds(res.data?.data)),
      adminApi.getMealOrderStats().then(res => setMealOrderStats(res.data?.data)),
      adminApi.getAddOnOrderStats().then(res => setAddOnOrderStats(res.data?.data)),
      adminApi.getNotificationStats().then(res => setNotificationStats(res.data?.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleExport = (type: string, format: string) => {
    alert(`Exporting ${type} as ${format}`);
  };

  // Helper for stat cards
  const statCards = overview ? [
    {
      title: 'Total Students',
      value: overview.total_students ?? overview.students ?? 0,
      icon: <Users className="h-6 w-6 text-white" />, color: 'bg-blue-600'
    },
    {
      title: 'Total Schools',
      value: overview.total_schools ?? 0,
      icon: <School className="h-6 w-6 text-white" />, color: 'bg-purple-600'
    },
    {
      title: 'Total Orders',
      value: overview.total_orders ?? 0,
      icon: <ClipboardList className="h-6 w-6 text-white" />, color: 'bg-green-600'
    },
    {
      title: 'Revenue',
      value: overview.revenue !== undefined ? `${overview.revenue.toLocaleString()} EGP` : '0 EGP',
      icon: <DollarSign className="h-6 w-6 text-white" />, color: 'bg-yellow-600'
    },
    {
      title: 'Wallet Money',
      value: overview.wallet_money !== undefined ? `${overview.wallet_money.toLocaleString()} EGP` : '0 EGP',
      icon: <DollarSign className="h-6 w-6 text-white" />, color: 'bg-teal-600'
    },
    {
      title: 'Total Money',
      value: overview.total_money !== undefined ? `${overview.total_money.toLocaleString()} EGP` : '0 EGP',
      icon: <DollarSign className="h-6 w-6 text-white" />, color: 'bg-pink-600'
    },
  ] : [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>
      {loading && <div className="text-center py-8">Loading...</div>}
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className="flex flex-row items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.color}`}>{stat.icon}</div>
          </Card>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Order Status Breakdown</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderStatus && Array.isArray(orderStatus.orders_by_status) && orderStatus.orders_by_status.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Wallet Balances */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Wallet Balances</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Balance (EGP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWallets && Array.isArray(topWallets.top_wallets) && topWallets.top_wallets.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.user?.name || row.user_id}</TableCell>
                    <TableCell>{row.balance !== undefined ? row.balance.toLocaleString() : 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Report */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Refunds Report</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount (EGP)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds && Array.isArray(refunds.refunds?.data) && refunds.refunds.data.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.user?.name || row.user_id}</TableCell>
                    <TableCell>{row.amount !== undefined ? row.amount.toLocaleString() : 0}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Meal Order Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meal Order Stats</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Meal Name</TableHead>
                  <TableHead>Meal Price</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealOrderStats && Array.isArray(mealOrderStats.meal_order_stats) && mealOrderStats.meal_order_stats.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.subcategory ?? ''}</TableCell>
                    <TableCell>{row.meal_name ?? ''}</TableCell>
                    <TableCell>{row.meal_price !== undefined ? row.meal_price : ''}</TableCell>
                    <TableCell>{row.count !== undefined ? row.count : 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add-On Order Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add-On Order Stats</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Add-on</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Revenue (EGP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addOnOrderStats && Array.isArray(addOnOrderStats.add_on_order_stats) && addOnOrderStats.add_on_order_stats.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.add_on_name || row.name}</TableCell>
                    <TableCell>{row.count !== undefined ? row.count : (row.total_ordered !== undefined ? row.total_ordered : 0)}</TableCell>
                    <TableCell>{row.revenue !== undefined ? row.revenue.toLocaleString() : (row.total_revenue !== undefined ? row.total_revenue.toLocaleString() : 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Notification Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Notification Stats</h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationStats && Array.isArray(notificationStats.stats) && notificationStats.stats.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Example Export Buttons */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Button onClick={() => handleExport('sales', 'pdf')}>Export Sales Report (PDF)</Button>
        <Button onClick={() => handleExport('sales', 'csv')}>Export Sales Report (CSV)</Button>
        <Button onClick={() => handleExport('users', 'pdf')}>Export User Report (PDF)</Button>
        <Button onClick={() => handleExport('financial', 'csv')}>Export Financial Report (CSV)</Button>
      </div>
    </div>
  );
};

export default Reports; 