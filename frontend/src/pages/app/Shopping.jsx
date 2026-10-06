import React, { useState } from 'react';
import { PageHeader, AppButton, ShoppingItem, EmptyState } from '../../components/shared/SharedComponents';
import { MOCK_SHOPPING, getMemberById } from '../../data/mockData';
import './Shopping.css';

export default function Shopping() {
  const [items, setItems] = useState(MOCK_SHOPPING);
  const [newItem, setNewItem] = useState('');
  const currentUserId = 1;

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, purchased: !i.purchased } : i))
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item = {
      id: Date.now(),
      household_id: 1,
      name: newItem.trim(),
      purchased: false,
      added_by: currentUserId,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setNewItem('');
  };

  const clearPurchased = () => {
    setItems((prev) => prev.filter((i) => !i.purchased));
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
            <AppButton variant="ghost" size="sm" onClick={clearPurchased}>
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
        <AppButton type="submit" variant="accent" size="md" icon="+" disabled={!newItem.trim()}>
          Add
        </AppButton>
      </form>

      {/* Pending items */}
      {pending.length > 0 && (
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
      {purchased.length > 0 && (
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
      {items.length === 0 && (
        <EmptyState
          icon="🛒"
          title="List is empty"
          description="Add items to your household shopping list."
        />
      )}
    </div>
  );
}
