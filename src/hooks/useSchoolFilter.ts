import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/api';

interface School {
  id: number;
  name: string;
}

interface UseSchoolFilterResult {
  schools: School[];
  selectedSchool: string;
  setSelectedSchool: (school: string) => void;
  loading: boolean;
  isSuperAdmin: boolean;
  // The actual school_id to use in API calls (undefined means all schools)
  schoolIdParam: number | undefined;
  // Whether to show the school selector (only for super admins)
  showSchoolSelector: boolean;
}

/**
 * Hook to manage school filtering based on admin role.
 * - Super admins can see and select all schools
 * - Normal admins can only see their assigned school
 */
export const useSchoolFilter = (): UseSchoolFilterResult => {
  const { user, isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      // If normal admin, don't fetch all schools - just use their assigned school
      if (!isSuperAdmin) {
        if (user?.school_id) {
          setSelectedSchool(String(user.school_id));
        }
        setLoading(false);
        return;
      }

      // Super admin can see all schools
      try {
        const response = await adminApi.getSchools();
        setSchools(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [isSuperAdmin, user?.school_id]);

  // Calculate the school_id parameter to use in API calls
  const schoolIdParam = useMemo(() => {
    if (!isSuperAdmin && user?.school_id) {
      // Normal admin - always filter by their school
      return user.school_id;
    }
    
    if (isSuperAdmin && selectedSchool !== 'all') {
      // Super admin with a specific school selected
      return Number(selectedSchool);
    }
    
    // Super admin with "All Schools" selected
    return undefined;
  }, [isSuperAdmin, user?.school_id, selectedSchool]);

  return {
    schools,
    selectedSchool: isSuperAdmin ? selectedSchool : String(user?.school_id || 'all'),
    setSelectedSchool: isSuperAdmin ? setSelectedSchool : () => {}, // No-op for normal admins
    loading,
    isSuperAdmin,
    schoolIdParam,
    showSchoolSelector: isSuperAdmin,
  };
};

export default useSchoolFilter;
