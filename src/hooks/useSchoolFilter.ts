import { useState, useEffect, useMemo, useCallback } from 'react';
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
  // The actual school_id to use in API calls (undefined means all schools for super admin)
  schoolIdParam: number | undefined;
  // Whether to show the school selector (only for super admins)
  showSchoolSelector: boolean;
  // Function to refresh schools list
  refreshSchools: () => Promise<void>;
}

/**
 * Hook to manage school filtering based on admin role.
 * - Super admins can see and select all schools (default: "All Schools" = no filtering)
 * - Normal admins can only see their assigned school (always filtered)
 * 
 * IMPORTANT: This hook preserves existing functionality:
 * - Super admins: Full access to all schools, can filter or view all
 * - Normal admins: Restricted to their assigned school only
 */
export const useSchoolFilter = (): UseSchoolFilterResult => {
  const { user, isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchoolState] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Fetch schools for super admin
  const fetchSchools = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      const response = await adminApi.getSchools();
      setSchools(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // For normal admin, always use their school_id
  // For super admin, use the selected school or 'all'
  const effectiveSelectedSchool = useMemo(() => {
    if (!isSuperAdmin && user?.school_id) {
      return String(user.school_id);
    }
    return selectedSchool;
  }, [isSuperAdmin, user?.school_id, selectedSchool]);

  // Calculate the school_id parameter to use in API calls
  // undefined = no filtering (all schools) - only for super admin with "all" selected
  const schoolIdParam = useMemo(() => {
    // Normal admin - ALWAYS filter by their assigned school
    if (!isSuperAdmin && user?.school_id) {
      return user.school_id;
    }
    
    // Super admin with a specific school selected - filter by that school
    if (isSuperAdmin && selectedSchool !== 'all') {
      return Number(selectedSchool);
    }
    
    // Super admin with "All Schools" selected - NO filtering (return undefined)
    return undefined;
  }, [isSuperAdmin, user?.school_id, selectedSchool]);

  // Wrapper for setSelectedSchool - only works for super admin
  const setSelectedSchool = useCallback((school: string) => {
    if (isSuperAdmin) {
      setSelectedSchoolState(school);
    }
    // No-op for normal admins - they can't change their school
  }, [isSuperAdmin]);

  return {
    schools,
    selectedSchool: effectiveSelectedSchool,
    setSelectedSchool,
    loading,
    isSuperAdmin,
    schoolIdParam,
    showSchoolSelector: isSuperAdmin,
    refreshSchools: fetchSchools,
  };
};

export default useSchoolFilter;
