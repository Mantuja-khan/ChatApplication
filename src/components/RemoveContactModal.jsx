import React from 'react';
import { supabase } from '../lib/supabase';
import { deleteChat } from '../utils/messageUtils';

export default function RemoveContactModal({ user, onClose, onRemoved }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // First delete all chats with this user
      const { error: chatDeleteError } = await deleteChat(currentUser.id, user.id);
      if (chatDeleteError) throw chatDeleteError;

      // Get current hidden contacts first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('hidden_contacts')
        .eq('id', currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      // Prepare new hidden contacts array
      const hiddenContacts = Array.isArray(profile?.hidden_contacts) 
        ? [...profile.hidden_contacts, user.id]
        : [user.id];

      // Update with new array
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ hidden_contacts: hiddenContacts })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      onRemoved();
      onClose();
    } catch (error) {
      console.error('Error removing contact:', error);
      setError(error.message || 'Failed to remove contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-xl font-semibold mb-4">Remove Contact</h3>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove {user.name || user.email.split('@')[0]} from your chat list? 
          This will delete all chat history. You can still find them through search if you want to chat again later.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}