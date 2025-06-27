import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import * as XLSX from 'xlsx';

interface MealImportFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MealImportForm: React.FC<MealImportFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate required columns
        const requiredColumns = ['name', 'description', 'price', 'category', 'image_url'];
        const firstRow = jsonData[0] as any;
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
          setFile(null);
          setPreview([]);
          return;
        }

        setPreview(jsonData.slice(0, 5)); // Show first 5 rows
      } catch (error) {
        toast.error('Error reading file');
        console.error('File Read Error:', error);
        setFile(null);
        setPreview([]);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file');
      setFile(null);
      setPreview([]);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      await adminApi.importMeals(formData);
      toast.success('Meals imported successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import meals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="mt-1 text-sm text-gray-500">
            Please upload a CSV or Excel file with the following columns: name, description, price, category, image_url
          </p>
        </div>

        {preview.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, i) => (
                        <td
                          key={i}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !file}
        >
          {loading ? 'Importing...' : 'Import Meals'}
        </Button>
      </div>
    </form>
  );
};

export default MealImportForm; 