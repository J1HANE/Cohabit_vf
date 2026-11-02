import React, { useEffect, useState } from 'react';
import { PageHeader, AppButton, ShoppingItem, EmptyState, Modal } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './Shopping.css';

const API_URL = 'http://localhost:8081/api/shopping';

function mapShoppingItem(item) {
  return {
    ...item,
    household_id: item.householdId ?? item.household_id,
    added_by: item.addedById ?? item.added_by,
    created_at: item.createdAt ?? item.created_at,
    purchase_price: item.purchasePrice ?? item.purchase_price,
    purchase_expense_id: item.purchaseExpenseId ?? item.purchase_expense_id,
  };
}

export default function Shopping() {
  const { user } = useAuth();
  const { household, getMemberById } = useHousehold();
  const householdId = household?.id || user?.householdId || user?.household_id;
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/household/${householdId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) throw new Error(data?.message || 'Could not load shopping items.');
        if (!cancelled) setItems(data.map(mapShoppingItem));
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [householdId]);

  const toggleItem = (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.purchased) return;
    setError('');
    setPurchaseItem(item);
    setPurchasePrice('');
  };

  const confirmPurchase = async (event) => {
    event.preventDefault();
    const price = Number(purchasePrice);
    if (!purchaseItem || !Number.isFinite(price) || price <= 0) {
      setError('Saisissez un prix supérieur à zéro.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/${purchaseItem.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, purchaserId: user?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Impossible d’enregistrer cet achat.');
      setItems((prev) => prev.map((item) => item.id === data.id ? mapShoppingItem(data) : item));
      setPurchaseItem(null);
      setPurchasePrice('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete shopping item.');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addItem = async (event) => {
    event.preventDefault();
    if (!newItem.trim() || !householdId) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          name: newItem.trim(),
          purchased: false,
          addedById: user?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not add shopping item.');
      setItems((prev) => [mapShoppingItem(data), ...prev]);
      setNewItem('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const clearPurchased = async () => {
    try {
      const results = await Promise.all(purchased.map((item) => fetch(`${API_URL}/${item.id}`, { method: 'DELETE' })));
      if (results.some((res) => !res.ok)) throw new Error('Could not clear all purchased items.');
      setItems((prev) => prev.filter((item) => !item.purchased));
    } catch (err) {
      setError(err.message);
    }
  };

  const pending = items.filter((item) => !item.purchased);
  const purchased = items.filter((item) => item.purchased);

  return (
    <div className="shopping-page page-fade">
      <PageHeader
        title="Shopping List"
        subtitle="Collaborative household shopping"
        action={purchased.length > 0 && (
          <AppButton variant="ghost" size="sm" onClick={clearPurchased}>Clear purchased</AppButton>
        )}
      />

      <form onSubmit={addItem} className="shopping-add-form">
        <input
          className="app-form-input shopping-add-input"
          placeholder="Add an item... (e.g. Milk)"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
        />
        <AppButton type="submit" variant="accent" size="md" icon="+" disabled={!newItem.trim() || !householdId}>
          Add
        </AppButton>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p className="shopping-loading">Loading shopping list...</p> : <>
        {pending.length > 0 && (
          <div className="section-block">
            <div className="section-block-header"><span className="section-block-title">To buy ({pending.length})</span></div>
            <div className="shopping-items-list">
              {pending.map((item) => (
                <ShoppingItem key={item.id} item={item} adder={getMemberById(item.added_by)} onToggle={toggleItem} onDelete={deleteItem} />
              ))}
            </div>
          </div>
        )}

        {purchased.length > 0 && (
          <div className="section-block">
            <div className="section-block-header"><span className="section-block-title">Purchased ({purchased.length})</span></div>
            <div className="shopping-items-list">
              {purchased.map((item) => (
                <ShoppingItem key={item.id} item={item} adder={getMemberById(item.added_by)} onToggle={toggleItem} onDelete={deleteItem} />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <EmptyState icon="🛒" title="List is empty" description="Add items to your household shopping list." />
        )}
      </>}

      <Modal isOpen={Boolean(purchaseItem)} onClose={() => !saving && setPurchaseItem(null)} title="Enregistrer l’achat">
        <form onSubmit={confirmPurchase} className="app-form">
          <p>Quel prix avez-vous payé pour « {purchaseItem?.name} » ? La dépense sera ajoutée automatiquement et partagée entre les membres du foyer.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="shopping-purchase-price">Prix payé (MAD)</label>
            <input
              id="shopping-purchase-price"
              className="app-form-input"
              type="number"
              min="0.01"
              step="0.01"
              required
              autoFocus
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <AppButton type="button" variant="ghost" onClick={() => setPurchaseItem(null)} disabled={saving}>Annuler</AppButton>
            <AppButton type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Acheter et ajouter la dépense'}</AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
