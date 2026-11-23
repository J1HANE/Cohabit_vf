import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton, Modal, EmptyState, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { apiFetch } from '../../services/api';
import MarketplacePhoto from './MarketplacePhoto';
import './Marketplace.css';

const CATEGORIES = [
  { key: 'ALL', label: 'Tous', icon: '✨' },
  { key: 'FURNITURE', label: 'Meubles & Déco', icon: '🪑' },
  { key: 'APPLIANCES', label: 'Électroménager', icon: '🔌' },
  { key: 'CLOTHING', label: 'Vêtements & Mode', icon: '👕' },
  { key: 'BOOKS_HOBBIES', label: 'Livres & Loisirs', icon: '📚' },
  { key: 'ELECTRONICS', label: 'High-Tech', icon: '📱' },
  { key: 'OTHER', label: 'Autre', icon: '📦' },
];

const CONDITIONS = [
  { key: 'ALL', label: 'Tous les états' },
  { key: 'NEW', label: 'Neuf' },
  { key: 'LIKE_NEW', label: 'Comme neuf' },
  { key: 'VERY_GOOD', label: 'Très bon état' },
  { key: 'GOOD', label: 'Bon état' },
  { key: 'FAIR', label: 'État satisfaisant' },
];

const CONDITION_LABELS = {
  NEW: 'Neuf',
  LIKE_NEW: 'Comme neuf',
  VERY_GOOD: 'Très bon état',
  GOOD: 'Bon état',
  FAIR: 'État satisfaisant',
};

const CATEGORY_LABELS = {
  FURNITURE: '🪑 Meubles & Déco',
  APPLIANCES: '🔌 Électroménager',
  CLOTHING: '👕 Vêtements & Mode',
  BOOKS_HOBBIES: '📚 Livres & Loisirs',
  ELECTRONICS: '📱 High-Tech',
  OTHER: '📦 Autre',
};

const STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
};

export default function Marketplace() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'mine'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedPriceType, setSelectedPriceType] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState('');

  // Detail Modal
  const [detailItem, setDetailItem] = useState(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [contactError, setContactError] = useState('');

  // Create / Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceType: 'FIXED',
    category: 'FURNITURE',
    itemSize: '',
    itemCondition: 'GOOD',
    status: 'AVAILABLE',
  });
  const [existingPhotoIds, setExistingPhotoIds] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'mine') {
        const res = await apiFetch('/api/marketplace/mine');
        if (!res.ok) throw new Error('Impossible de charger vos articles.');
        setItems(await res.json());
      } else {
        const queryParams = new URLSearchParams();
        if (selectedCategory !== 'ALL') queryParams.set('category', selectedCategory);
        if (selectedCondition !== 'ALL') queryParams.set('condition', selectedCondition);
        if (selectedPriceType !== 'ALL') queryParams.set('priceType', selectedPriceType);
        if (search.trim()) queryParams.set('search', search.trim());
        if (maxPrice && !isNaN(Number(maxPrice))) queryParams.set('maxPrice', maxPrice);

        const res = await apiFetch(`/api/marketplace?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Impossible de charger les articles du marketplace.');
        setItems(await res.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedCondition, selectedPriceType, search, maxPrice]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      priceType: 'FIXED',
      category: 'FURNITURE',
      itemSize: '',
      itemCondition: 'GOOD',
      status: 'AVAILABLE',
    });
    setExistingPhotoIds([]);
    setNewPhotos([]);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      priceType: item.priceType || 'FIXED',
      category: item.category || 'FURNITURE',
      itemSize: item.itemSize || '',
      itemCondition: item.itemCondition || 'GOOD',
      status: item.status || 'AVAILABLE',
    });
    setExistingPhotoIds(item.photoIds || []);
    setNewPhotos([]);
    setFormError('');
    setDetailItem(null);
    setShowFormModal(true);
  };

  const handleAddPhotos = (event) => {
    const files = Array.from(event.target.files);
    event.target.value = '';
    setFormError('');

    if (existingPhotoIds.length + newPhotos.length + files.length > 5) {
      setFormError('Vous pouvez ajouter jusqu’à 5 photos au maximum.');
      return;
    }

    const invalid = files.some((f) => f.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(f.type));
    if (invalid) {
      setFormError('Choisissez des fichiers JPEG ou PNG de 2 Mo maximum chacun.');
      return;
    }

    setNewPhotos((prev) => [...prev, ...files.map((file) => ({ file, key: crypto.randomUUID() }))]);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Le titre de l’article est requis.');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Veuillez saisir un prix valide supérieur à 0.');
      return;
    }

    setFormSaving(true);
    const payload = new FormData();
    payload.append('details', new Blob([JSON.stringify({
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      price: priceNum,
      priceType: formData.priceType,
      category: formData.category,
      itemSize: formData.itemSize?.trim() || null,
      itemCondition: formData.itemCondition,
      status: formData.status,
      photoIds: existingPhotoIds,
    })], { type: 'application/json' }));

    newPhotos.forEach(({ file }) => payload.append('photos', file));

    try {
      const url = editingItem ? `/api/marketplace/${editingItem.id}` : '/api/marketplace';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’enregistrement de l’article.');

      setShowFormModal(false);
      await loadItems();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const res = await apiFetch(`/api/marketplace/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Impossible de modifier le statut.');
      const updated = await res.json();
      if (detailItem && detailItem.id === itemId) {
        setDetailItem(updated);
      }
      await loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    try {
      const res = await apiFetch(`/api/marketplace/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Impossible de supprimer cet article.');
      setDetailItem(null);
      await loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open chat with seller
  const handleContactSeller = async (item) => {
    setContacting(true);
    setContactError('');
    try {
      const res = await apiFetch(`/api/conversations/marketplace/${item.id}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Impossible d’ouvrir la conversation avec le vendeur.');
      navigate(`/messages/${data.id}`);
    } catch (err) {
      setContactError(err.message);
      setContacting(false);
    }
  };

  const isOwner = (item) => {
    if (!user || !item) return false;
    return Number(item.sellerId) === Number(user.id);
  };

  return (
    <div className="marketplace-page page-fade">
      <PageHeader
        title="Marketplace de la Coloc"
        subtitle="Vendez et achetez des meubles, vêtements et électro à petits prix entre colocataires"
        action={
          <AppButton variant="primary" size="md" icon="+" onClick={openCreateModal}>
            Vendre un article
          </AppButton>
        }
      />

      {/* Tabs */}
      <div className="marketplace-tabs">
        <button
          type="button"
          className={`marketplace-tab${activeTab === 'browse' ? ' active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🛍️ Explorer les articles
        </button>
        <button
          type="button"
          className={`marketplace-tab${activeTab === 'mine' ? ' active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          🏷️ Mes articles & ventes
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Categories Carousel */}
          <div className="marketplace-categories-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`category-chip${selectedCategory === cat.key ? ' active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary Filters */}
          <div className="marketplace-filters-panel">
            <input
              type="search"
              className="app-form-input mp-search-input"
              placeholder="Rechercher un article, un meuble, un foyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="app-form-select mp-filter-select"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <select
              className="app-form-select mp-filter-select"
              value={selectedPriceType}
              onChange={(e) => setSelectedPriceType(e.target.value)}
            >
              <option value="ALL">Tous types de prix</option>
              <option value="FIXED">Prix fixe</option>
              <option value="NEGOTIABLE">Négociable</option>
            </select>

            <input
              type="number"
              min="0"
              className="app-form-input mp-price-input"
              placeholder="Prix max (MAD)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            {(search || selectedCategory !== 'ALL' || selectedCondition !== 'ALL' || selectedPriceType !== 'ALL' || maxPrice) && (
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setSelectedCondition('ALL');
                  setSelectedPriceType('ALL');
                  setMaxPrice('');
                }}
              >
                Réinitialiser
              </AppButton>
            )}
          </div>
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Grid of items */}
      {loading ? (
        <p role="status" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
          Chargement des articles...
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={activeTab === 'mine' ? 'Vous n’avez publié aucun article' : 'Aucun article trouvé'}
          description={
            activeTab === 'mine'
              ? 'Donnez une seconde vie à vos objets en publiant votre première annonce dès maintenant !'
              : 'Essayez de modifier vos critères de recherche ou ajoutez le premier article.'
          }
          action={
            <AppButton variant="primary" size="md" onClick={openCreateModal}>
              Publier un article
            </AppButton>
          }
        />
      ) : (
        <div className="marketplace-grid">
          {items.map((item) => {
            const coverPhotoId = item.photoIds && item.photoIds.length > 0 ? item.photoIds[0] : null;
            return (
              <article
                key={item.id}
                className="marketplace-card"
                onClick={() => {
                  setDetailItem(item);
                  setDetailPhotoIndex(0);
                  setContactError('');
                }}
              >
                <div className="mp-card-media">
                  <MarketplacePhoto photoId={coverPhotoId} alt={item.title} />
                  {item.status !== 'AVAILABLE' && (
                    <span className={`mp-status-tag mp-status-${item.status}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  )}
                  <div className="mp-price-tag">
                    <span className="mp-price-amount">{Number(item.price).toFixed(2)} MAD</span>
                    {item.priceType === 'NEGOTIABLE' && (
                      <span className="mp-price-type">Négoc.</span>
                    )}
                  </div>
                </div>

                <div className="mp-card-body">
                  <div className="mp-card-header">
                    <span className="mp-pill">{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span className="mp-pill mp-pill-condition">
                      {CONDITION_LABELS[item.itemCondition] || item.itemCondition}
                    </span>
                    {item.itemSize && (
                      <span className="mp-pill mp-pill-size">Taille : {item.itemSize}</span>
                    )}
                  </div>

                  <h3 className="mp-card-title">{item.title}</h3>
                  {item.description && <p className="mp-card-desc">{item.description}</p>}

                  <div className="mp-card-footer">
                    <div className="mp-card-seller">
                      <HouseholdMemberAvatar
                        member={{ name: item.sellerName, color: item.sellerColor }}
                        size="xs"
                      />
                      <span>{item.sellerName}{item.householdName ? ` (${item.householdName})` : ''}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      <Modal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={detailItem?.title || 'Détails de l’article'}
      >
        {detailItem && (
          <div className="mp-detail-content">
            {/* Gallery */}
            <div className="mp-gallery">
              <MarketplacePhoto
                key={detailItem.photoIds?.[detailPhotoIndex] || 'no-photo'}
                photoId={detailItem.photoIds?.[detailPhotoIndex]}
                alt={detailItem.title}
                lazy={false}
              />
              {detailItem.photoIds?.length > 1 && (
                <div className="mp-gallery-controls">
                  <button
                    type="button"
                    className="mp-gallery-btn"
                    disabled={detailPhotoIndex === 0}
                    onClick={() => setDetailPhotoIndex(detailPhotoIndex - 1)}
                  >
                    ‹
                  </button>
                  <span>{detailPhotoIndex + 1} / {detailItem.photoIds.length}</span>
                  <button
                    type="button"
                    className="mp-gallery-btn"
                    disabled={detailPhotoIndex === detailItem.photoIds.length - 1}
                    onClick={() => setDetailPhotoIndex(detailPhotoIndex + 1)}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            <div className="mp-detail-header">
              <div>
                <h2 className="mp-detail-title">{detailItem.title}</h2>
                <span className={`mp-status-tag mp-status-${detailItem.status}`} style={{ position: 'static', display: 'inline-block', marginTop: '0.4rem' }}>
                  {STATUS_LABELS[detailItem.status] || detailItem.status}
                </span>
              </div>
              <div className="mp-detail-price-box">
                <span className="mp-detail-price">{Number(detailItem.price).toFixed(2)} MAD</span>
                <span className="mp-detail-price-type">
                  {detailItem.priceType === 'NEGOTIABLE' ? '🤝 Prix négociable' : '🔒 Prix fixe'}
                </span>
              </div>
            </div>

            {/* Specs / Tags */}
            <div className="mp-detail-specs">
              <div className="mp-spec-item">
                <span>Catégorie :</span>
                <strong>{CATEGORY_LABELS[detailItem.category] || detailItem.category}</strong>
              </div>
              <div className="mp-spec-item">
                <span>État :</span>
                <strong>{CONDITION_LABELS[detailItem.itemCondition] || detailItem.itemCondition}</strong>
              </div>
              {detailItem.itemSize && (
                <div className="mp-spec-item">
                  <span>Taille / Dimensions :</span>
                  <strong>{detailItem.itemSize}</strong>
                </div>
              )}
            </div>

            {/* Description */}
            {detailItem.description && (
              <div className="mp-detail-desc">
                {detailItem.description}
              </div>
            )}

            {/* Seller info */}
            <div className="mp-detail-seller-card">
              <HouseholdMemberAvatar
                member={{ name: detailItem.sellerName, color: detailItem.sellerColor }}
                size="md"
              />
              <div className="mp-detail-seller-info">
                <div className="mp-detail-seller-name">{detailItem.sellerName}</div>
                <div className="mp-detail-seller-household">
                  Foyer : {detailItem.householdName || 'Colocation'}
                </div>
              </div>
            </div>

            {contactError && <p className="form-error" role="alert">{contactError}</p>}

            {/* Actions */}
            <div className="mp-detail-actions">
              {isOwner(detailItem) ? (
                <>
                  <AppButton variant="ghost" size="md" onClick={() => openEditModal(detailItem)}>
                    ✏️ Modifier
                  </AppButton>
                  {detailItem.status === 'AVAILABLE' && (
                    <AppButton variant="warning" size="md" onClick={() => handleStatusChange(detailItem.id, 'RESERVED')}>
                      ⏳ Marquer comme réservé
                    </AppButton>
                  )}
                  {detailItem.status === 'RESERVED' && (
                    <AppButton variant="accent" size="md" onClick={() => handleStatusChange(detailItem.id, 'AVAILABLE')}>
                      ✓ Marquer comme disponible
                    </AppButton>
                  )}
                  {detailItem.status !== 'SOLD' && (
                    <AppButton variant="primary" size="md" onClick={() => handleStatusChange(detailItem.id, 'SOLD')}>
                      🏷️ Marquer comme vendu
                    </AppButton>
                  )}
                  <AppButton variant="danger" size="md" onClick={() => handleDeleteItem(detailItem.id)}>
                    🗑️ Supprimer
                  </AppButton>
                </>
              ) : (
                <AppButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={contacting || detailItem.status === 'SOLD'}
                  onClick={() => handleContactSeller(detailItem)}
                >
                  {contacting ? 'Ouverture de la discussion...' : '💬 Contacter le vendeur (Chat)'}
                </AppButton>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Publish / Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => !formSaving && setShowFormModal(false)}
        title={editingItem ? 'Modifier l’article' : 'Vendre un article sur le Marketplace'}
      >
        <form onSubmit={handleSaveForm} className="app-form">
          {formError && <p className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{formError}</p>}

          <div className="app-form-group">
            <label className="app-form-label">Titre de l’article *</label>
            <input
              className="app-form-input"
              placeholder="Ex: Grille-pain Philips, Table basse Ikea, Veste en jean..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={160}
              required
            />
          </div>

          <div className="mp-form-grid">
            <div className="app-form-group">
              <label className="app-form-label">Catégorie *</label>
              <select
                className="app-form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="FURNITURE">🪑 Meubles & Déco</option>
                <option value="APPLIANCES">🔌 Électroménager</option>
                <option value="CLOTHING">👕 Vêtements & Mode</option>
                <option value="BOOKS_HOBBIES">📚 Livres & Loisirs</option>
                <option value="ELECTRONICS">📱 High-Tech</option>
                <option value="OTHER">📦 Autre</option>
              </select>
            </div>

            <div className="app-form-group">
              <label className="app-form-label">État du produit *</label>
              <select
                className="app-form-select"
                value={formData.itemCondition}
                onChange={(e) => setFormData({ ...formData, itemCondition: e.target.value })}
              >
                <option value="NEW">Neuf (avec étiquette/emballage)</option>
                <option value="LIKE_NEW">Comme neuf</option>
                <option value="VERY_GOOD">Très bon état</option>
                <option value="GOOD">Bon état</option>
                <option value="FAIR">État satisfaisant</option>
              </select>
            </div>
          </div>

          <div className="mp-form-grid">
            <div className="app-form-group">
              <label className="app-form-label">Prix (MAD) *</label>
              <input
                className="app-form-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex: 50.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="app-form-group">
              <label className="app-form-label">Type de prix</label>
              <div className="mp-radio-group">
                <button
                  type="button"
                  className={`mp-radio-btn${formData.priceType === 'FIXED' ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, priceType: 'FIXED' })}
                >
                  🔒 Prix fixe
                </button>
                <button
                  type="button"
                  className={`mp-radio-btn${formData.priceType === 'NEGOTIABLE' ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, priceType: 'NEGOTIABLE' })}
                >
                  🤝 Négociable
                </button>
              </div>
            </div>
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Taille / Dimensions (facultatif)</label>
            <input
              className="app-form-input"
              placeholder="Ex: M, L, 42, 120x60 cm, 2 places..."
              value={formData.itemSize}
              onChange={(e) => setFormData({ ...formData, itemSize: e.target.value })}
              maxLength={50}
            />
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem', display: 'block' }}>
              Idéal pour les vêtements, chaussures ou meubles.
            </span>
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Description (facultative)</label>
            <textarea
              className="app-form-input"
              rows={3}
              placeholder="Précisez les détails, la marque, les dimensions, la raison de la vente..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Photos */}
          <div className="app-form-group">
            <label className="app-form-label">Photos (jusqu’à 5 photos)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="app-form-input"
              onChange={handleAddPhotos}
              disabled={existingPhotoIds.length + newPhotos.length >= 5}
            />
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem', display: 'block' }}>
              JPEG ou PNG de 2 Mo maximum par photo.
            </span>

            {/* Previews */}
            <div className="mp-photo-previews">
              {existingPhotoIds.map((pId) => (
                <div key={pId} className="mp-photo-preview-item">
                  <MarketplacePhoto photoId={pId} alt="Aperçu" lazy={false} />
                  <button
                    type="button"
                    className="mp-photo-remove-btn"
                    onClick={() => setExistingPhotoIds(existingPhotoIds.filter((id) => id !== pId))}
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPhotos.map(({ file, key }) => (
                <div key={key} className="mp-photo-preview-item">
                  <MarketplacePhoto photoId={file} alt={file.name} lazy={false} />
                  <button
                    type="button"
                    className="mp-photo-remove-btn"
                    onClick={() => setNewPhotos(newPhotos.filter((item) => item.key !== key))}
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <AppButton type="submit" variant="primary" size="lg" fullWidth disabled={formSaving}>
            {formSaving ? 'Enregistrement en cours...' : editingItem ? 'Mettre à jour l’article' : 'Publier sur le Marketplace'}
          </AppButton>
        </form>
      </Modal>
    </div>
  );
}
