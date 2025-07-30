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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Campaign {
  id?: number;
  title: string;
  description: string;
  image_url?: string;
  link_url?: string;
  type: 'promotion' | 'announcement' | 'offer' | 'update';
  status: 'active' | 'inactive' | 'draft';
  target_audience: 'all' | 'students' | 'parents' | 'specific_school';
  school_id?: number;
  start_date?: string;
  end_date?: string;
  display_order: number;
  is_featured: boolean;
}

interface School {
  id: number;
  name: string;
}

interface CampaignFormProps {
  initialData?: Campaign | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const [form, setForm] = useState<Campaign>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    type: 'promotion',
    status: 'draft',
    target_audience: 'all',
    school_id: undefined,
    start_date: '',
    end_date: '',
    display_order: 0,
    is_featured: false,
  });

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Load schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await adminApi.getSchools();
        setSchools(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch schools');
      }
    };
    fetchSchools();
  }, []);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
        end_date: initialData.end_date ? initialData.end_date.split('T')[0] : '',
      });
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('status', form.status);
      formData.append('target_audience', form.target_audience);
      formData.append('display_order', form.display_order.toString());
      formData.append('is_featured', form.is_featured.toString());
      
      if (form.link_url) {
        formData.append('link_url', form.link_url);
      }
      
      if (form.start_date) {
        formData.append('start_date', form.start_date);
      }
      
      if (form.end_date) {
        formData.append('end_date', form.end_date);
      }
      
      if (form.target_audience === 'specific_school' && form.school_id) {
        formData.append('school_id', form.school_id.toString());
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (initialData?.id) {
        await adminApi.updateCampaign(initialData.id, formData);
        toast.success('Campaign updated successfully');
      } else {
        await adminApi.createCampaign(formData);
        toast.success('Campaign created successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter campaign title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter campaign description"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="link_url">Link URL</Label>
            <Input
              id="link_url"
              type="url"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Campaign Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target_audience">Target Audience *</Label>
            <Select value={form.target_audience} onValueChange={(value) => setForm({ ...form, target_audience: value as any })}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="specific_school">Specific School</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.target_audience === 'specific_school' && (
            <div>
              <Label htmlFor="school_id">School *</Label>
              <Select value={form.school_id?.toString() || ''} onValueChange={(value) => setForm({ ...form, school_id: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label htmlFor="image">Campaign Image</Label>
        <div className="mt-2">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="cursor-pointer"
          />
        </div>
        {imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
          </div>
        )}
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_featured"
          checked={form.is_featured}
          onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
        />
        <Label htmlFor="is_featured">Featured Campaign</Label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (initialData ? 'Update Campaign' : 'Create Campaign')}
        </Button>
      </div>
    </form>
  );
};

export default CampaignForm; 