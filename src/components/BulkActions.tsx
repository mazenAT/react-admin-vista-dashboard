import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, Edit, Archive, Download, Eye } from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: (selectedIds: (string | number)[]) => void;
  confirm?: boolean;
  confirmMessage?: string;
}

interface BulkActionsProps {
  items: Array<{ id: string | number; [key: string]: any }>;
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  actions: BulkAction[];
  selectAllLabel?: string;
  selectedLabel?: string;
  className?: string;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  items,
  selectedIds,
  onSelectionChange,
  actions,
  selectAllLabel = 'Select All',
  selectedLabel = 'Selected',
  className = ''
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const allIds = items.map(item => item.id);
  const isAllSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.confirm) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      action.onClick(selectedIds);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction.onClick(selectedIds);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className={`flex items-center justify-between p-4 bg-gray-50 border-b ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium text-gray-700">
              {selectAllLabel}
            </span>
          </div>
          
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedIds.length} {selectedLabel}
            </Badge>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleActionClick(action)}
                className="flex items-center space-x-2"
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action) => (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className="flex items-center space-x-2"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmMessage || 
                `Are you sure you want to perform "${pendingAction?.label}" on ${selectedIds.length} selected items? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="bg-red-600 hover:bg-red-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActions; 