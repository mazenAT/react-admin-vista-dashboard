import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRevenueStatistics } from '../services/api';
import { useAuth } from '@/contexts/AuthContext';

interface SchoolRevenueData {
  school_id: number;
  school_name: string;
  monthly_revenue: { [key: string]: number };
  yearly_total: number;
}

const SchoolRevenueStats = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SchoolRevenueData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(4); // Show only 4 schools by default

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedYear, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // For normal admins, pass their school_id to filter to their school only
      // For super admins, don't pass school_id to see all schools
      const schoolId = user?.role === 'admin' && user?.school_id ? user.school_id : undefined;
      const response = await getRevenueStatistics(selectedYear, schoolId);
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

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 4); // Load 4 more schools
  };

  const handleShowLess = () => {
    setDisplayCount(4); // Reset to show only 4 schools
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Get the schools to display (limited by displayCount)
  const displayedSchools = data.slice(0, displayCount);
  const hasMoreSchools = data.length > displayCount;
  const hasShownMore = displayCount > 4;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">School Revenue Statistics</h3>
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
        {displayedSchools && displayedSchools.length > 0 ? (
          displayedSchools.map((school) => (
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

      {/* Load More / Show Less Controls */}
      <div className="flex justify-center space-x-4">
        {hasMoreSchools && (
          <Button 
            onClick={handleLoadMore}
            variant="outline"
            className="px-6"
          >
            Load More Schools
          </Button>
        )}
        {hasShownMore && (
          <Button 
            onClick={handleShowLess}
            variant="outline"
            className="px-6"
          >
            Show Less
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-500">
        Showing {displayedSchools.length} of {data.length} schools
      </div>
    </div>
  );
};

export default SchoolRevenueStats; 