import React, { useEffect, useState } from 'react';
import { PageHeader, AppButton, ShoppingItem, EmptyState, LoadingState } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import {
  clearPurchasedShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem,
} from '../../services/shoppingService';
import './Shopping.css';

export default function Shopping() {
  const { user } = useAuth();
  const { household, getMemberById } = useHousehold();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const householdId = household?.id || user?.householdId || user?.household_id;

  useEffect(() => {
    let active = true;

    if (!householdId) {
      setItems([]);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError('');
    getShoppingItems(householdId)
      .then((data) => { if (active) setItems(data); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [householdId]);

  const toggleItem = async (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item || !householdId) return;
    setError('');
    try {
      const updated = await updateShoppingItem(id, householdId, !item.purchased);
      setItems((previous) => previous.map((entry) => entry.id === id ? updated : entry));
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const deleteItem = async (id) => {
    if (!householdId) return;
    setError('');
    try {
      await deleteShoppingItem(id, householdId);
      setItems((previous) => previous.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !householdId || saving) return;
    setSaving(true);
    setError('');
    try {
      const item = await createShoppingItem({
        householdId,
        name: newItem.trim(),
        addedBy: user?.id || null,
      });
      setItems((previous) => [item, ...previous]);
      setNewItem('');
    } catch (createError) {
      setError(createError.message);
    } finally {
      setSaving(false);
    }
  };

  const clearPurchased = async () => {
    if (!householdId) return;
    setError('');
    try {
      await clearPurchasedShoppingItems(householdId);
      setItems((previous) => previous.filter((item) => !item.purchased));
    } catch (clearError) {
      setError(clearError.message);
    }
  };

  const pending = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  return (
    <div className="shopping-page page-fade">
      <PageHeader
        title="Shopping List"
        subtitle="Collaborative household shopping"
        action={
          purchased.length > 0 && (
            <AppButton variant="ghost" size="sm" onClick={clearPurchased} disabled={loading}>
              Clear purchased
            </AppButton>
          )
        }
      />

      {/* Add item form */}
      <form onSubmit={addItem} className="shopping-add-form">
        <input
          className="app-form-input shopping-add-input"
          placeholder="Add an item... (e.g. Milk)"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <AppButton type="submit" variant="accent" size="md" icon="+" disabled={!newItem.trim() || !householdId || saving}>
          {saving ? 'Adding...' : 'Add'}
        </AppButton>
      </form>

      {error && <p className="shopping-error" role="alert">{error}</p>}

      {!householdId && !loading && (
        <EmptyState
          icon="🛒"
          title="No household selected"
          description="Join or create a household to use its shopping list."
        />
      )}

      {loading && <LoadingState message="Loading shopping list..." />}

      {/* Pending items */}
      {!loading && pending.length > 0 && (
        <div className="section-block">
          <div className="section-block-header">
            <span className="section-block-title">To buy ({pending.length})</span>
          </div>
          <div className="shopping-items-list">
            {pending.map((item) => (
              <ShoppingItem
                key={item.id}
                item={item}
                adder={getMemberById(item.added_by)}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Purchased items */}
      {!loading && purchased.length > 0 && (
        <div className="section-block">
          <div className="section-block-header">
            <span className="section-block-title">Purchased ({purchased.length})</span>
          </div>
          <div className="shopping-items-list">
            {purchased.map((item) => (
              <ShoppingItem
                key={item.id}
                item={item}
                adder={getMemberById(item.added_by)}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && householdId && items.length === 0 && !error && (
        <EmptyState
          icon="🛒"
          title="List is empty"
          description="Add items to your household shopping list."
        />
      )}
    </div>
  );
}
