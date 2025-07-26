
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard } from 'lucide-react';
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
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.getUsers({ search }).then(async res => {
      let students = res.data.data || res.data;
      // If wallet is not present, fetch for each student
      students = await Promise.all(students.map(async (student: any) => {
        if (!student.wallet) {
          try {
            const walletRes = await adminApi.getUser(student.id);
            return { ...student, wallet: walletRes.data.wallet };
          } catch {
            return student;
          }
        }
        return student;
      }));
      setStudents(students);
    }).finally(() => setLoading(false));
    adminApi.getWalletStats().then(res => setWalletStats(res.data));
  }, [search]);

  const handleAddFunds = (student: any) => {
    setSelectedStudent(student);
    setAmount('');
    setAddFundsOpen(true);
  };
  const handleRefund = (student: any) => {
    setSelectedStudent(student);
    setAmount('');
    setRefundOpen(true);
  };
  const handleViewTransactions = (student: any) => {
    setSelectedStudent(student);
    setTransactions([]);
    setTransactionsOpen(true);
    setTxLoading(true);
    adminApi.getStudentTransactions(student.id).then(res => setTransactions(res.data.data || res.data)).finally(() => setTxLoading(false));
  };
  const submitAddFunds = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return toast.error('Enter a valid amount');
    try {
      await adminApi.adminTopUp(selectedStudent.id, Number(amount));
      toast.success('Funds added successfully');
      setAddFundsOpen(false);
      setAmount('');
      setSelectedStudent(null);
      // Refresh students
      setLoading(true);
      adminApi.getUsers({ search }).then(async res => {
        let students = res.data.data || res.data;
        // If wallet is not present, fetch for each student
        students = await Promise.all(students.map(async (student: any) => {
          if (!student.wallet) {
            try {
              const walletRes = await adminApi.getUser(student.id);
              return { ...student, wallet: walletRes.data.wallet };
            } catch {
              return student;
            }
          }
          return student;
        }));
        setStudents(students);
      }).finally(() => setLoading(false));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add funds');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Wallet Balance</CardTitle></CardHeader>
            <CardContent>{walletStats?.wallet_money ?? '-'}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pending Withdrawals</CardTitle></CardHeader>
            <CardContent>{walletStats?.pending_withdrawals ?? '-'}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
            <CardContent>{walletStats?.revenue ?? '-'}</CardContent>
          </Card>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <LoadingSpinner size={32} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <EmptyState icon={<AlertCircle />} message="No students found" />
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.wallet?.balance ?? '-'}</td>
                    <td>{student.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <Button size="sm" onClick={() => handleAddFunds(student)}>Add Funds</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRefund(student)} className="ml-2">Refund</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleViewTransactions(student)} className="ml-2">Transactions</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to {selectedStudent?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="number" min="1" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={submitAddFunds}>Add Funds</Button>
              <Button variant="ghost" onClick={() => setAddFundsOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund/Deduct from {selectedStudent?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="number" min="1" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              {/* Add refund logic here */}
            </div>
            <DialogFooter>
              <Button disabled>Refund (Coming Soon)</Button>
              <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transactions for {selectedStudent?.name}</DialogTitle>
            </DialogHeader>
            {txLoading ? (
              <div className="py-4"><LoadingSpinner size={32} /></div>
            ) : transactions.length === 0 ? (
              <EmptyState icon={<AlertCircle />} message="No transactions found" />
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td>{tx.created_at}</td>
                        <td>{tx.type}</td>
                        <td>{tx.amount}</td>
                        <td>{tx.status}</td>
                        <td>{tx.note}</td>
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
