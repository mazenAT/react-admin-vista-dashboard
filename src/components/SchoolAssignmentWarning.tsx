import React from 'react';
import { AlertCircle, School } from 'lucide-react';

interface SchoolAssignmentWarningProps {
  userRole?: string;
  userEmail?: string;
  schoolId?: number | null;
}

const SchoolAssignmentWarning: React.FC<SchoolAssignmentWarningProps> = ({ 
  userRole, 
  userEmail, 
  schoolId 
}) => {
  // Super admin emails that should never see this warning
  const SUPER_ADMIN_EMAILS = [
    'ahmedabdelhamed974@gmail.com',
    'ahmedsayedhalim65@gmail.com',
    'shahira.mazhar@gmail.com'
  ];

  // Only show warning for regular admins who don't have a school assignment
  // Super admins should NEVER see this warning - they can access all schools
  if (
    userRole === 'super_admin' || 
    SUPER_ADMIN_EMAILS.includes(userEmail || '') ||
    schoolId || 
    userRole === 'student'
  ) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            School Assignment Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            You are not currently assigned to any school. Please contact a super administrator to assign you to a school.
          </p>
          <div className="mt-3 flex items-center space-x-2 text-xs text-yellow-600">
            <School className="w-4 h-4" />
            <span>Contact: {SUPER_ADMIN_EMAILS.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAssignmentWarning; 