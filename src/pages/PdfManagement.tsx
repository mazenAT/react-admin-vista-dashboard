import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/services/api';
import { Upload, Eye, Trash2, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface GeneralPdf {
  id: number;
  title: string;
  filename: string;
  pdf_url: string;
  uploaded_at: string;
  uploaded_by: string;
  is_active: boolean;
}

const PdfManagement = () => {
  const [pdfs, setPdfs] = useState<GeneralPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<GeneralPdf | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getGeneralPdfsList();
      setPdfs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch PDFs:', error);
      toast.error('Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);

      const response = await adminApi.uploadGeneralPdf(formData);
      
      toast.success('PDF uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setTitle('');
      fetchPdfs();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdfId: number) => {
    if (!confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      await adminApi.deleteGeneralPdf(pdfId);
      toast.success('PDF deleted successfully');
      fetchPdfs();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete PDF');
    }
  };

  const handleViewPdf = (pdf: GeneralPdf) => {
    setSelectedPdf(pdf);
    setShowPdfModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">PDF Management</h1>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload General PDF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter PDF title"
                />
              </div>
              <div>
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded PDFs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : pdfs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PDFs uploaded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdfs.map((pdf) => (
                  <TableRow key={pdf.id}>
                    <TableCell className="font-medium">{pdf.title}</TableCell>
                    <TableCell className="text-sm text-gray-500">{pdf.filename}</TableCell>
                    <TableCell className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {pdf.uploaded_by}
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(pdf.uploaded_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pdf.is_active ? 'default' : 'secondary'}>
                        {pdf.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPdf(pdf)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pdf.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer Modal */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {selectedPdf?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedPdf && (
            <div className="w-full h-96">
              <iframe
                src={selectedPdf.pdf_url}
                className="w-full h-full border rounded"
                title={selectedPdf.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdfManagement; 