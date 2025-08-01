import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Edit, Trash2, Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactInformation {
  id: number;
  email: string;
  phone: string;
  address: string;
  business_hours?: string;
  response_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ContactInformation = () => {
  const [contactInfo, setContactInfo] = useState<ContactInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactInformation | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    business_hours: '',
    response_time: '',
  });

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getContactInformation();
      setContactInfo(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch contact information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedContact) {
        await adminApi.updateContactInformation(selectedContact.id, formData);
        toast.success('Contact information updated successfully');
      } else {
        await adminApi.createContactInformation(formData);
        toast.success('Contact information created successfully');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedContact(null);
      setFormData({ email: '', phone: '', address: '', business_hours: '', response_time: '' });
      fetchContactInfo();
    } catch (error) {
      toast.error('Failed to save contact information');
    }
  };

  const handleEdit = (contact: ContactInformation) => {
    setSelectedContact(contact);
    setFormData({
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      business_hours: contact.business_hours || '',
      response_time: contact.response_time || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact information?')) return;
    
    try {
      await adminApi.deleteContactInformation(id);
      toast.success('Contact information deleted successfully');
      fetchContactInfo();
    } catch (error) {
      toast.error('Failed to delete contact information');
    }
  };

  const resetForm = () => {
    setFormData({ email: '', phone: '', address: '', business_hours: '', response_time: '' });
    setSelectedContact(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
          <p className="text-gray-600">Manage contact details displayed on the contact page</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact Info
        </Button>
      </div>

      {/* Contact Information Cards */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : contactInfo.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Information</h3>
              <p className="text-gray-600 mb-4">Add contact information to display on the contact page.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact Info
              </Button>
            </CardContent>
          </Card>
        ) : (
          contactInfo.map((contact) => (
            <Card key={contact.id} className={`${contact.is_active ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Contact Information</span>
                    {contact.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-sm text-gray-900">{contact.email}</p>
                        {contact.response_time && (
                          <p className="text-xs text-gray-500">Response time: {contact.response_time}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="text-sm text-gray-900">{contact.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <p className="text-sm text-gray-900">{contact.address}</p>
                      </div>
                    </div>
                    
                    {contact.business_hours && (
                      <div className="flex items-start space-x-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Business Hours</Label>
                          <p className="text-sm text-gray-900">{contact.business_hours}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Contact Information Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Contact Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="support@smartcommunity.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+20 123 456 7890"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Smart Street, Cairo, Egypt"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_hours">Business Hours</Label>
                <Input
                  id="business_hours"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  placeholder="Mon-Fri 9AM-6PM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response_time">Response Time</Label>
                <Input
                  id="response_time"
                  value={formData.response_time}
                  onChange={(e) => setFormData({ ...formData, response_time: e.target.value })}
                  placeholder="We'll respond within 24 hours"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Information Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="support@smartcommunity.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+20 123 456 7890"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Smart Street, Cairo, Egypt"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-business_hours">Business Hours</Label>
                <Input
                  id="edit-business_hours"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  placeholder="Mon-Fri 9AM-6PM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-response_time">Response Time</Label>
                <Input
                  id="edit-response_time"
                  value={formData.response_time}
                  onChange={(e) => setFormData({ ...formData, response_time: e.target.value })}
                  placeholder="We'll respond within 24 hours"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactInformation; 