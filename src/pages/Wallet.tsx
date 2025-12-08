
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard, RefreshCw, TrendingUp, Wallet as WalletIcon, Users } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { AlertCircle } from 'lucide-react';

const Wallet: React.FC = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [dailyRecharges, setDailyRecharges] = useState<any>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getWallets({ search, page: currentPage, per_page: 20 });
      const data = res.data.data || res.data;
      setWallets(Array.isArray(data) ? data : data.data || []);
      if (res.data.last_page) {
        setTotalPages(res.data.last_page);
      }
    } catch (e) {
      console.error('Error fetching wallets:', e);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [statsRes, rechargesRes] = await Promise.all([
        adminApi.getWalletStats(),
        adminApi.getDailyRecharges({ days: 7 })
      ]);
      setWalletStats(statsRes.data);
      setDailyRecharges(rechargesRes.data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, [search, currentPage]);

  const handleAddFunds = (wallet: any) => {
    setSelectedWallet(wallet);
    setAmount('');
    setAddFundsOpen(true);
  };

  const handleRefund = (wallet: any) => {
    setSelectedWallet(wallet);
    setAmount('');
    setRefundOpen(true);
  };

  const handleViewTransactions = (wallet: any) => {
    setSelectedWallet(wallet);
    setTransactions([]);
    setTransactionsOpen(true);
    setTxLoading(true);
    adminApi.getStudentTransactions(wallet.user?.id).then(res => {
      setTransactions(res.data.data || res.data || []);
    }).catch(() => {
      toast.error('Failed to load transactions');
    }).finally(() => setTxLoading(false));
  };

  const submitAddFunds = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toast.error('Enter a valid amount');
    }
    try {
      await adminApi.adminTopUp(selectedWallet.user?.id, Number(amount));
      toast.success('Funds added successfully');
      setAddFundsOpen(false);
      setAmount('');
      setSelectedWallet(null);
      fetchWallets();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add funds');
    }
  };

  const submitRefund = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toast.error('Enter a valid amount');
    }
    try {
      await adminApi.adminRefund(selectedWallet.user?.id, { amount: Number(amount) });
      toast.success('Refund processed successfully');
      setRefundOpen(false);
      setAmount('');
      setSelectedWallet(null);
      fetchWallets();
      fetchStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to process refund');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wallet Management</h1>
          <Button variant="outline" onClick={() => { fetchWallets(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                Total Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{walletStats?.wallet_money?.toFixed(2) ?? '-'} EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{walletStats?.pending_withdrawals ?? 0} EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{walletStats?.revenue?.toFixed(2) ?? '-'} EGP</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Today's Recharge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">{walletStats?.today_recharge?.toFixed(2) ?? 0} EGP</p>
              <p className="text-sm text-green-600">{walletStats?.today_recharge_count ?? 0} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Wallets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{wallets.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Recharges */}
        {dailyRecharges?.recent_recharges?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-600" />
                Recent Recharges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">School</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyRecharges.recent_recharges.slice(0, 10).map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{tx.wallet?.user?.name || 'Unknown'}</td>
                        <td className="px-4 py-2">{tx.wallet?.user?.school?.name || '-'}</td>
                        <td className="px-4 py-2 text-right text-green-600 font-medium">+{tx.amount} EGP</td>
                        <td className="px-4 py-2 text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Wallets List */}
        <Card>
          <CardHeader>
            <CardTitle>All Wallets</CardTitle>
            <div className="mt-4">
              <Input 
                placeholder="Search by name or email..." 
                value={search} 
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Family Members</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <LoadingSpinner size={32} />
                      </td>
                    </tr>
                  ) : wallets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <EmptyState icon={<AlertCircle />} message="No wallets found" />
                      </td>
                    </tr>
                  ) : (
                    wallets.map(wallet => (
                      <tr key={wallet.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{wallet.user?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{wallet.user?.email || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{wallet.user?.school?.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={wallet.balance > 0 ? 'text-green-600' : 'text-gray-900'}>
                            {wallet.balance?.toFixed(2) ?? '0.00'} EGP
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{wallet.user?.family_members?.length || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" onClick={() => handleAddFunds(wallet)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRefund(wallet)}>
                              <ArrowDownLeft className="w-4 h-4 mr-1" />
                              Refund
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleViewTransactions(wallet)}>
                              <CreditCard className="w-4 h-4 mr-1" />
                              History
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Funds Dialog */}
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to {selectedWallet?.user?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Current Balance</label>
                <p className="text-lg font-bold">{selectedWallet?.balance?.toFixed(2) ?? 0} EGP</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Amount to Add (EGP)</label>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="Enter amount" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddFundsOpen(false)}>Cancel</Button>
              <Button onClick={submitAddFunds}>Add Funds</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund/Deduct from {selectedWallet?.user?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Current Balance</label>
                <p className="text-lg font-bold">{selectedWallet?.balance?.toFixed(2) ?? 0} EGP</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Amount to Refund (EGP)</label>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="Enter amount" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
              <Button onClick={submitRefund}>Process Refund</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transactions Dialog */}
        <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction History for {selectedWallet?.user?.name}</DialogTitle>
            </DialogHeader>
            {txLoading ? (
              <div className="py-4 flex justify-center"><LoadingSpinner size={32} /></div>
            ) : transactions.length === 0 ? (
              <EmptyState icon={<AlertCircle />} message="No transactions found" />
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === 'recharge' ? 'bg-green-100 text-green-700' :
                            tx.type === 'purchase' ? 'bg-blue-100 text-blue-700' :
                            tx.type === 'refund' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} EGP
                        </td>
                        <td className="px-3 py-2">{tx.status || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{tx.note || tx.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTransactionsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;
