import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * RlsTestPage - Superadmin-only test/dev area for RLS CRUD testing.
 * Future-proof: add more test/dev features as needed.
 * Only visible to superadmins.
 *
 * Props:
 * - userProfile: current user's profile (must have is_superadmin)
 * - onBack: function to return to SuperAdminPanel
 */
export default function RlsTestPage({ userProfile, onBack }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Only allow superadmins
  if (!userProfile?.is_superadmin) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Access denied. Superadmin only.
      </div>
    );
  }

  // Fetch items
  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('rls_test_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError('Failed to load test items');
      toast({ title: 'Error', description: 'Failed to load test items', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);

  // Insert new item
  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rls_test_items')
        .insert({ owner_id: userProfile.user_id, value: newValue });
      if (error) throw error;
      setNewValue('');
      toast({ title: 'Success', description: 'Item added' });
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rls_test_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Item deleted' });
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const startEdit = (id, value) => {
    setEditingId(id);
    setEditingValue(value);
  };

  // Save edit
  const handleEditSave = async () => {
    if (!editingValue.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rls_test_items')
        .update({ value: editingValue })
        .eq('id', editingId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Item updated' });
      setEditingId(null);
      setEditingValue('');
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValue('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold">RLS Test & Dev Area</h2>
      </div>
      <div className="mb-4 text-gray-600">
        <p>This area is for superadmin-only RLS and database feature testing. Use it to verify CRUD operations and future dev features safely.</p>
      </div>
      <div className="flex items-center mb-4">
        <Input
          type="text"
          placeholder="New item value..."
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="mr-2"
          disabled={saving}
        />
        <Button onClick={handleAdd} disabled={saving || !newValue.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center p-8">
          <Loader2 className="animate-spin mr-2" />
          <span>Loading test items...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : (
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Value</th>
              <th className="border p-2">Owner</th>
              <th className="border p-2">Created</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border p-2">
                  {editingId === item.id ? (
                    <div className="flex items-center">
                      <Input
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        className="mr-2"
                        disabled={saving}
                      />
                      <Button onClick={handleEditSave} disabled={saving || !editingValue.trim()} size="sm">Save</Button>
                      <Button onClick={handleEditCancel} variant="ghost" size="sm" className="ml-1">Cancel</Button>
                    </div>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </td>
                <td className="border p-2 text-xs">{item.owner_id}</td>
                <td className="border p-2 text-xs">{item.created_at?.slice(0, 19).replace('T', ' ')}</td>
                <td className="border p-2">
                  <Button onClick={() => startEdit(item.id, item.value)} size="sm" variant="outline" className="mr-2">Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} size="sm" variant="destructive" disabled={saving}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Future dev/test features can be added below */}
    </div>
  );
} 