import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentDetailsProps {
  student: {
    id: number;
    name: string;
    email: string;
    school?: {
      id: number;
      name: string;
    } | null;
    school_id?: number;
    wallet?: {
      balance: number;
    };
    wallet_balance?: number;
  };
  open: boolean;
  onClose: () => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({
  student,
  open,
  onClose,
}) => {
  // Safety check - if no student data, don't render
  if (!student) {
    return null;
  }

  // Debug logging to see what data we're receiving
  console.log('StudentDetails received student:', student);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{student.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{student.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">School Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">School</p>
                  <p className="font-medium">{student.school?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Wallet Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(student.wallet?.balance || student.wallet_balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetails; 