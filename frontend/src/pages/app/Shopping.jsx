import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader, AppButton, ShoppingItem, EmptyState, Modal } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import './Shopping.css';

export default function Shopping() {
  const { user } = useAuth();
  const { household, getMemberById } = useHousehold();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const householdId = household?.id || user?.householdId;

  const loadItems = useCallback(async () => {
    if (!householdId) {
      setItems([]);
      return;
    }
    const response = await apiFetch(`http://localhost:8081/api/shopping/household/${householdId}`);
    if (!response.ok) throw new Error('Impossible de charger la liste.');
    setItems(await response.json());
  }, [householdId]);

  useEffect(() => {
    loadItems().catch((loadError) => setError(loadError.message));
  }, [loadItems]);

  const toggleItem = (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.purchased) return;
    setPurchaseItem(item);
    setPrice('');
    setError('');
  };

  const deleteItem = async (id) => {
    const response = await apiFetch(`http://localhost:8081/api/shopping/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Impossible de supprimer cet article.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !householdId) return;
    try {
      const response = await apiFetch('http://localhost:8081/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, name: newItem.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’ajouter cet article.');
      setItems((prev) => [data, ...prev]);
      setNewItem('');
      setError('');
    } catch (addError) {
      setError(addError.message);
    }
  };

  const confirmPurchase = async (event) => {
    event.preventDefault();
    if (!purchaseItem) return;
    try {
      const response = await apiFetch(`http://localhost:8081/api/shopping/${purchaseItem.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(price) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer cet achat.');
      setItems((prev) => prev.map((item) => item.id === data.id ? data : item));
      setPurchaseItem(null);
      setError('');
    } catch (purchaseError) {
      setError(purchaseError.message);
    }
  };

  const clearPurchased = async () => {
    const purchasedItems = items.filter((item) => item.purchased);
    const results = await Promise.all(purchasedItems.map((item) =>
      apiFetch(`http://localhost:8081/api/shopping/${item.id}`, { method: 'DELETE' })
    ));
    if (results.some((response) => !response.ok)) {
      setError('Certains articles achetés n’ont pas pu être supprimés.');
      await loadItems();
      return;
    }
    setItems((prev) => prev.filter((item) => !item.purchased));
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
      {error && <p className="form-error" role="alert">{error}</p>}

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
                adder={getMemberById(item.added_by || item.addedById)}
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
                adder={getMemberById(item.added_by || item.addedById)}
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

      <Modal
        isOpen={Boolean(purchaseItem)}
        onClose={() => setPurchaseItem(null)}
        title={`Acheter ${purchaseItem?.name || ''}`}
      >
        <form onSubmit={confirmPurchase} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="shopping-purchase-price">Prix payé (MAD)</label>
            <input
              id="shopping-purchase-price"
              className="app-form-input"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              autoFocus
            />
          </div>
          <AppButton type="submit" variant="primary" fullWidth>Confirmer l’achat</AppButton>
        </form>
      </Modal>
    </div>
  );
}
