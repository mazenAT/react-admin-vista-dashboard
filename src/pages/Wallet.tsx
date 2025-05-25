
import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard } from 'lucide-react';

const Wallet = () => {
  const wallets = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      balance: '$850.00',
      status: 'Active'
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      balance: '$120.50',
      status: 'Active'
    },
    {
      name: 'Carol Williams',
      email: 'carol@example.com',
      balance: '$340.25',
      status: 'Pending'
    }
  ];

  const transactions = [
    {
      type: 'incoming',
      description: 'Wallet Recharge',
      name: 'Alice Johnson',
      amount: '+$50.00',
      date: 'Oct 15, 2023',
      status: 'completed'
    },
    {
      type: 'outgoing',
      description: 'Course Payment',
      name: 'Bob Smith',
      amount: '-$25.00',
      date: 'Oct 14, 2023',
      status: 'completed'
    },
    {
      type: 'incoming',
      description: 'Refund',
      name: 'Carol Williams',
      amount: '+$15.00',
      date: 'Oct 13, 2023',
      status: 'pending'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
            <p className="text-gray-600">Monitor student wallets and transactions</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Funds</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Student Wallets */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Student Wallets</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {wallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{wallet.name}</p>
                        <p className="text-sm text-gray-500">{wallet.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{wallet.balance}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        wallet.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wallet.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'incoming' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'incoming' ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">$1,310.75</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                <p className="text-2xl font-bold text-green-600">+$245.50</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">$15.00</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <ArrowUpRight className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;
