import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Search, MessageSquare, User, Mail, Phone, Calendar, Eye, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface ContactNote {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_response?: string;
  responded_by?: number;
  responded_at?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  respondedBy?: {
    id: number;
    name: string;
  };
}

interface Statistics {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  unread: number;
  today: number;
  this_week: number;
  this_month: number;
}

const ContactNotes = () => {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReadStatus, setSelectedReadStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ContactNote | null>(null);
  const [responseText, setResponseText] = useState('');

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getContactNotes({
        search: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        is_read: selectedReadStatus !== 'all' ? selectedReadStatus === 'read' : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      // Handle null/undefined response data
      const notesData = response.data?.data || [];
      setNotes(Array.isArray(notesData) ? notesData : []);
    } catch (error) {
      toast.error('Failed to fetch contact notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await adminApi.getContactNotesStatistics();
      // Handle null/undefined response data
      const statsData = response.data?.data || {};
      setStatistics(statsData);
    } catch (error) {
      toast.error('Failed to fetch statistics');
      setStatistics({
        total: 0,
        pending: 0,
        in_progress: 0,
        resolved: 0,
        unread: 0,
        today: 0,
        this_week: 0,
        this_month: 0
      });
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchStatistics();
  }, [searchQuery, selectedStatus, selectedReadStatus, dateFrom, dateTo]);

  // Handle note deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact note?')) return;
    
    try {
      await adminApi.deleteContactNote(id);
      toast.success('Contact note deleted successfully');
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to delete contact note');
    }
  };

  // Handle status update
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateContactNoteStatus(id, status);
      toast.success('Status updated successfully');
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle view note
  const handleView = async (note: ContactNote) => {
    setSelectedNote(note);
    setShowViewModal(true);
    
    // Mark as read if not already read
    if (!note.is_read) {
      try {
        await adminApi.markContactNoteAsRead(note.id);
        fetchNotes();
        fetchStatistics();
      } catch (error) {
        console.error('Failed to mark as read');
      }
    }
  };

  // Handle respond
  const handleRespond = (note: ContactNote) => {
    setSelectedNote(note);
    setResponseText(note.admin_response || '');
    setShowResponseModal(true);
  };

  // Handle send response
  const handleSendResponse = async () => {
    if (!selectedNote || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await adminApi.respondToContactNote(selectedNote.id, responseText);
      toast.success('Response sent successfully');
      setShowResponseModal(false);
      setSelectedNote(null);
      setResponseText('');
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await adminApi.markAllContactNotesAsRead();
      toast.success('All notes marked as read');
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Notes</h1>
          <p className="text-gray-600">Manage user inquiries and support requests</p>
        </div>
        <Button 
          variant="outline"
          onClick={handleMarkAllAsRead}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{statistics.in_progress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{statistics.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{statistics.unread}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{statistics.today}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{statistics.this_week}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{statistics.this_month}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedReadStatus} onValueChange={setSelectedReadStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Read Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From Date"
          className="w-[150px]"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To Date"
          className="w-[150px]"
        />
      </div>

      {/* Contact Notes Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Read</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (!notes || notes.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No contact notes found
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id} className={!note.is_read ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{note.name}</span>
                        {note.user && (
                          <Badge variant="secondary" className="text-xs">
                            Registered User
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span>{note.email}</span>
                      </div>
                      {note.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{note.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm line-clamp-2">{note.message}</div>
                      {note.admin_response && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Responded
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(note.status)}`}>
                      {note.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      note.is_read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {note.is_read ? 'Read' : 'Unread'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(note)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRespond(note)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Respond
                        </DropdownMenuItem>
                        {note.status !== 'resolved' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(note.id, 'resolved')}>
                            Mark as Resolved
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(note.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Note Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Note Details</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Name</Label>
                  <p className="text-sm">{selectedNote.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm">{selectedNote.email}</p>
                </div>
                {selectedNote.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="text-sm">{selectedNote.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date</Label>
                  <p className="text-sm">{formatDate(selectedNote.created_at)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedNote.message}</p>
                </div>
              </div>

              {selectedNote.admin_response && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Admin Response</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.admin_response}</p>
                    {selectedNote.respondedBy && (
                      <p className="text-xs text-gray-600 mt-2">
                        Responded by {selectedNote.respondedBy.name} on {formatDate(selectedNote.responded_at!)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleRespond(selectedNote);
                }}>
                  <Reply className="w-4 h-4 mr-2" />
                  Respond
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Contact Note</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Original Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedNote.message}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="response" className="text-sm font-medium text-gray-700">
                  Your Response *
                </Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendResponse}>
                  <Reply className="w-4 h-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactNotes; 