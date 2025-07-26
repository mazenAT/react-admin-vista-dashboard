import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRevenueStatistics } from '../services/api';

interface SchoolRevenueData {
  school_id: number;
  school_name: string;
  monthly_revenue: { [key: string]: number };
  yearly_total: number;
}

const SchoolRevenueStats = () => {
  const [data, setData] = useState<SchoolRevenueData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getRevenueStatistics(selectedYear);
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData([]); // Ensure data is always an array
      }
    } catch (error) {
      console.error('Error fetching revenue statistics:', error);
      setData([]); // Set to empty array on error as well
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'short' });
  };

  const prepareChartData = (schoolData: SchoolRevenueData) => {
    return Object.entries(schoolData.monthly_revenue).map(([month, amount]) => ({
      month: getMonthName(parseInt(month)),
      amount: amount
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data && data.length > 0 ? (
          data.map((school) => (
            <Card key={school.school_id}>
              <CardHeader>
                <CardTitle>{school.school_name}</CardTitle>
                <p className="text-sm text-gray-500">
                  Total Revenue: {formatCurrency(school.yearly_total)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareChartData(school)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} domain={[0, dataMax => dataMax * 1.2]} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `${label} ${selectedYear}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Revenue" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No revenue data available for the selected year.</p>
        )}
      </div>
    </div>
  );
};

export default SchoolRevenueStats; 