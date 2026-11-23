import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton, Modal, EmptyState, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { apiFetch } from '../../services/api';
import MarketplacePhoto from './MarketplacePhoto';
import {
  IconSearch,
  IconPlus,
  IconGrid,
  IconFurniture,
  IconAppliances,
  IconClothing,
  IconBooks,
  IconElectronics,
  IconOther,
  IconTag,
  IconLock,
  IconHandshake,
  IconUpload,
  IconCamera,
  IconMessage,
  IconEdit,
  IconClock,
  IconCheck,
  IconTrash,
  IconClose,
  IconChevronLeft,
  IconChevronRight,
  IconShoppingBag,
  IconFilter,
  IconReset,
} from './MarketplaceIcons';
import './Marketplace.css';

const CATEGORIES = [
  { key: 'ALL', label: 'Tous les articles', Icon: IconGrid },
  { key: 'FURNITURE', label: 'Meubles & Déco', Icon: IconFurniture },
  { key: 'APPLIANCES', label: 'Électroménager', Icon: IconAppliances },
  { key: 'CLOTHING', label: 'Vêtements & Mode', Icon: IconClothing },
  { key: 'BOOKS_HOBBIES', label: 'Livres & Loisirs', Icon: IconBooks },
  { key: 'ELECTRONICS', label: 'High-Tech', Icon: IconElectronics },
  { key: 'OTHER', label: 'Autre', Icon: IconOther },
];

const CATEGORY_ICONS = {
  FURNITURE: IconFurniture,
  APPLIANCES: IconAppliances,
  CLOTHING: IconClothing,
  BOOKS_HOBBIES: IconBooks,
  ELECTRONICS: IconElectronics,
  OTHER: IconOther,
};

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
  FURNITURE: 'Meubles & Déco',
  APPLIANCES: 'Électroménager',
  CLOTHING: 'Vêtements & Mode',
  BOOKS_HOBBIES: 'Livres & Loisirs',
  ELECTRONICS: 'High-Tech',
  OTHER: 'Autre',
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
  const fileInputRef = useRef(null);

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
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFilesUpload = (files) => {
    setFormError('');
    if (!files || files.length === 0) return;

    const currentCount = existingPhotoIds.length + newPhotos.length;
    if (currentCount + files.length > 5) {
      setFormError('Vous pouvez ajouter jusqu’à 5 photos au maximum.');
      return;
    }

    const invalid = files.some(
      (f) => f.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(f.type)
    );
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
    payload.append(
      'details',
      new Blob(
        [
          JSON.stringify({
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            price: priceNum,
            priceType: formData.priceType,
            category: formData.category,
            itemSize: formData.itemSize?.trim() || null,
            itemCondition: formData.itemCondition,
            status: formData.status,
            photoIds: existingPhotoIds,
          }),
        ],
        { type: 'application/json' }
      )
    );

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

  const totalPhotosCount = existingPhotoIds.length + newPhotos.length;
  const hasActiveFilters = search || selectedCategory !== 'ALL' || selectedCondition !== 'ALL' || selectedPriceType !== 'ALL' || maxPrice;

  return (
    <div className="marketplace-page page-fade">
      <PageHeader
        title="Marketplace"
        subtitle="Achetez et vendez des meubles, vêtements et objets utiles entre colocataires à petits prix"
        action={
          <AppButton variant="primary" size="md" icon={<IconPlus size={16} />} onClick={openCreateModal}>
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
          <IconShoppingBag size={18} />
          <span>Explorer les articles</span>
        </button>
        <button
          type="button"
          className={`marketplace-tab${activeTab === 'mine' ? ' active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          <IconTag size={18} />
          <span>Mes articles & ventes</span>
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Categories Bar */}
          <div className="marketplace-categories-scroll">
            {CATEGORIES.map(({ key, label, Icon }) => {
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`category-chip${isActive ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  <Icon size={16} className="category-chip-icon" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters */}
          <div className="marketplace-filters-panel">
            <div className="mp-search-container">
              <IconSearch size={16} className="mp-search-icon" />
              <input
                type="search"
                className="mp-search-input"
                placeholder="Rechercher par titre, meuble, coloc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="mp-search-clear" onClick={() => setSearch('')}>
                  <IconClose size={12} />
                </button>
              )}
            </div>

            <select
              className="mp-filter-select"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <select
              className="mp-filter-select"
              value={selectedPriceType}
              onChange={(e) => setSelectedPriceType(e.target.value)}
            >
              <option value="ALL">Tous types de prix</option>
              <option value="FIXED">Prix fixe</option>
              <option value="NEGOTIABLE">Prix négociable</option>
            </select>

            <div className="mp-price-input-wrapper">
              <input
                type="number"
                min="0"
                className="mp-price-input"
                placeholder="Prix max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <span className="mp-price-currency">MAD</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="mp-reset-btn"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setSelectedCondition('ALL');
                  setSelectedPriceType('ALL');
                  setMaxPrice('');
                }}
              >
                <IconReset size={13} />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Grid of items */}
      {loading ? (
        <div className="mp-loading-box">
          <div className="mp-spinner" />
          <p>Chargement des articles du marketplace...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="mp-empty-container">
          <div className="mp-empty-icon-wrap">
            <IconShoppingBag size={42} />
          </div>
          <h3 className="mp-empty-title">
            {activeTab === 'mine' ? 'Vous n’avez publié aucun article' : 'Aucun article trouvé'}
          </h3>
          <p className="mp-empty-desc">
            {activeTab === 'mine'
              ? 'Donnez une seconde vie à vos objets en publiant votre première annonce dès maintenant.'
              : 'Essayez d’ajuster vos critères de recherche ou soyez le premier à publier un article.'}
          </p>
          <AppButton variant="primary" size="md" icon={<IconPlus size={16} />} onClick={openCreateModal}>
            Publier un article
          </AppButton>
        </div>
      ) : (
        <div className="marketplace-grid">
          {items.map((item) => {
            const coverPhotoId = item.photoIds && item.photoIds.length > 0 ? item.photoIds[0] : null;
            const CategoryIcon = CATEGORY_ICONS[item.category] || IconOther;

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
                    <span className="mp-price-amount">{Number(item.price).toFixed(0)} <small>MAD</small></span>
                    {item.priceType === 'NEGOTIABLE' ? (
                      <span className="mp-price-type mp-price-negotiable">
                        <IconHandshake size={11} /> Négociable
                      </span>
                    ) : (
                      <span className="mp-price-type mp-price-fixed">
                        <IconLock size={10} /> Fixe
                      </span>
                    )}
                  </div>
                </div>

                <div className="mp-card-body">
                  <div className="mp-card-header">
                    <span className="mp-pill mp-pill-category">
                      <CategoryIcon size={12} className="mp-pill-icon" />
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span className="mp-pill mp-pill-condition">
                      {CONDITION_LABELS[item.itemCondition] || item.itemCondition}
                    </span>
                    {item.itemSize && (
                      <span className="mp-pill mp-pill-size">{item.itemSize}</span>
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
                      <span className="mp-card-seller-name">
                        {item.sellerName}{item.householdName ? ` • ${item.householdName}` : ''}
                      </span>
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
                <>
                  <button
                    type="button"
                    className="mp-gallery-nav-btn mp-gallery-prev"
                    disabled={detailPhotoIndex === 0}
                    onClick={() => setDetailPhotoIndex(detailPhotoIndex - 1)}
                    aria-label="Photo précédente"
                  >
                    <IconChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="mp-gallery-nav-btn mp-gallery-next"
                    disabled={detailPhotoIndex === detailItem.photoIds.length - 1}
                    onClick={() => setDetailPhotoIndex(detailPhotoIndex + 1)}
                    aria-label="Photo suivante"
                  >
                    <IconChevronRight size={20} />
                  </button>
                  <div className="mp-gallery-counter">
                    {detailPhotoIndex + 1} / {detailItem.photoIds.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {detailItem.photoIds?.length > 1 && (
              <div className="mp-detail-thumbs">
                {detailItem.photoIds.map((pId, idx) => (
                  <button
                    key={pId}
                    type="button"
                    className={`mp-detail-thumb-btn${idx === detailPhotoIndex ? ' active' : ''}`}
                    onClick={() => setDetailPhotoIndex(idx)}
                  >
                    <MarketplacePhoto photoId={pId} alt="Miniature" lazy={false} />
                  </button>
                ))}
              </div>
            )}

            <div className="mp-detail-header">
              <div>
                <h2 className="mp-detail-title">{detailItem.title}</h2>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`mp-status-tag mp-status-${detailItem.status}`} style={{ position: 'static' }}>
                    {STATUS_LABELS[detailItem.status] || detailItem.status}
                  </span>
                </div>
              </div>
              <div className="mp-detail-price-box">
                <span className="mp-detail-price">{Number(detailItem.price).toFixed(0)} <small>MAD</small></span>
                <span className="mp-detail-price-type">
                  {detailItem.priceType === 'NEGOTIABLE' ? (
                    <>
                      <IconHandshake size={13} /> Prix négociable
                    </>
                  ) : (
                    <>
                      <IconLock size={12} /> Prix fixe
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Specs / Tags */}
            <div className="mp-detail-specs">
              <div className="mp-spec-item">
                <span className="mp-spec-label">Catégorie</span>
                <strong className="mp-spec-val">{CATEGORY_LABELS[detailItem.category] || detailItem.category}</strong>
              </div>
              <div className="mp-spec-item">
                <span className="mp-spec-label">État</span>
                <strong className="mp-spec-val">{CONDITION_LABELS[detailItem.itemCondition] || detailItem.itemCondition}</strong>
              </div>
              {detailItem.itemSize && (
                <div className="mp-spec-item">
                  <span className="mp-spec-label">Taille / Dimensions</span>
                  <strong className="mp-spec-val">{detailItem.itemSize}</strong>
                </div>
              )}
            </div>

            {/* Description */}
            {detailItem.description && (
              <div className="mp-detail-desc-card">
                <span className="mp-desc-label">Description du vendeur</span>
                <p className="mp-detail-desc">{detailItem.description}</p>
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
                  Colocation : {detailItem.householdName || 'Colocataire'}
                </div>
              </div>
            </div>

            {contactError && <p className="form-error" role="alert">{contactError}</p>}

            {/* Actions */}
            <div className="mp-detail-actions">
              {isOwner(detailItem) ? (
                <>
                  <AppButton variant="ghost" size="md" icon={<IconEdit size={16} />} onClick={() => openEditModal(detailItem)}>
                    Modifier
                  </AppButton>
                  {detailItem.status === 'AVAILABLE' && (
                    <AppButton variant="warning" size="md" icon={<IconClock size={16} />} onClick={() => handleStatusChange(detailItem.id, 'RESERVED')}>
                      Marquer comme réservé
                    </AppButton>
                  )}
                  {detailItem.status === 'RESERVED' && (
                    <AppButton variant="accent" size="md" icon={<IconCheck size={16} />} onClick={() => handleStatusChange(detailItem.id, 'AVAILABLE')}>
                      Marquer comme disponible
                    </AppButton>
                  )}
                  {detailItem.status !== 'SOLD' && (
                    <AppButton variant="primary" size="md" icon={<IconTag size={16} />} onClick={() => handleStatusChange(detailItem.id, 'SOLD')}>
                      Marquer comme vendu
                    </AppButton>
                  )}
                  <AppButton variant="danger" size="md" icon={<IconTrash size={16} />} onClick={() => handleDeleteItem(detailItem.id)}>
                    Supprimer
                  </AppButton>
                </>
              ) : (
                <AppButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<IconMessage size={18} />}
                  disabled={contacting || detailItem.status === 'SOLD'}
                  onClick={() => handleContactSeller(detailItem)}
                >
                  {contacting ? 'Ouverture de la discussion...' : 'Contacter le vendeur (Messagerie)'}
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
        <form onSubmit={handleSaveForm} className="app-form mp-form">
          {formError && <p className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{formError}</p>}

          <div className="app-form-group">
            <label className="app-form-label">Titre de l’article *</label>
            <input
              className="app-form-input"
              placeholder="Ex: Grille-pain Philips, Table basse bois, Veste en jean..."
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
                <option value="FURNITURE">Meubles & Déco</option>
                <option value="APPLIANCES">Électroménager</option>
                <option value="CLOTHING">Vêtements & Mode</option>
                <option value="BOOKS_HOBBIES">Livres & Loisirs</option>
                <option value="ELECTRONICS">High-Tech</option>
                <option value="OTHER">Autre</option>
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
              <div className="mp-price-input-wrapper">
                <input
                  className="app-form-input mp-price-form-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                <span className="mp-price-currency">MAD</span>
              </div>
            </div>

            <div className="app-form-group">
              <label className="app-form-label">Type de prix</label>
              <div className="mp-radio-group">
                <button
                  type="button"
                  className={`mp-radio-btn${formData.priceType === 'FIXED' ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, priceType: 'FIXED' })}
                >
                  <IconLock size={15} />
                  <span>Prix fixe</span>
                </button>
                <button
                  type="button"
                  className={`mp-radio-btn${formData.priceType === 'NEGOTIABLE' ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, priceType: 'NEGOTIABLE' })}
                >
                  <IconHandshake size={15} />
                  <span>Négociable</span>
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
            <span className="mp-field-hint">
              Recommandé pour les vêtements, chaussures ou meubles.
            </span>
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Description (facultative)</label>
            <textarea
              className="app-form-input"
              rows={3}
              placeholder="Précisez les caractéristiques, la marque, la raison de la vente..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Photos Upload Zone */}
          <div className="app-form-group">
            <div className="mp-photos-header">
              <label className="app-form-label">Photos du produit</label>
              <span className="mp-photo-counter">{totalPhotosCount} / 5 photos</span>
            </div>

            <div
              className={`mp-dropzone${isDragging ? ' dragging' : ''}${totalPhotosCount >= 5 ? ' disabled' : ''}`}
              onClick={() => totalPhotosCount < 5 && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (totalPhotosCount < 5) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFilesUpload(Array.from(e.dataTransfer.files));
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFilesUpload(Array.from(e.target.files));
                  e.target.value = '';
                }}
                disabled={totalPhotosCount >= 5}
              />
              <div className="mp-dropzone-icon">
                <IconUpload size={22} />
              </div>
              <div className="mp-dropzone-texts">
                <span className="mp-dropzone-main">
                  {totalPhotosCount >= 5 ? 'Limite de 5 photos atteinte' : 'Cliquez ou glissez vos photos ici'}
                </span>
                <span className="mp-dropzone-sub">
                  Formats JPEG ou PNG &bull; 2 Mo maximum par photo
                </span>
              </div>
            </div>

            {/* Photos Previews */}
            {totalPhotosCount > 0 && (
              <div className="mp-photo-previews">
                {existingPhotoIds.map((pId, index) => (
                  <div key={pId} className="mp-photo-preview-item">
                    <MarketplacePhoto photoId={pId} alt={`Photo ${index + 1}`} lazy={false} />
                    {index === 0 && <span className="mp-cover-badge">Couverture</span>}
                    <button
                      type="button"
                      className="mp-photo-remove-btn"
                      onClick={() => setExistingPhotoIds(existingPhotoIds.filter((id) => id !== pId))}
                      title="Supprimer la photo"
                    >
                      <IconClose size={12} />
                    </button>
                  </div>
                ))}

                {newPhotos.map(({ file, key }, index) => {
                  const actualIndex = existingPhotoIds.length + index;
                  return (
                    <div key={key} className="mp-photo-preview-item">
                      <MarketplacePhoto photoId={file} alt={file.name} lazy={false} />
                      {actualIndex === 0 && <span className="mp-cover-badge">Couverture</span>}
                      <button
                        type="button"
                        className="mp-photo-remove-btn"
                        onClick={() => setNewPhotos(newPhotos.filter((item) => item.key !== key))}
                        title="Supprimer la photo"
                      >
                        <IconClose size={12} />
                      </button>
                    </div>
                  );
                })}

                {totalPhotosCount < 5 && (
                  <button
                    type="button"
                    className="mp-photo-add-slot"
                    onClick={() => fileInputRef.current?.click()}
                    title="Ajouter une autre photo"
                  >
                    <IconPlus size={20} />
                    <span>Ajouter</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <AppButton type="submit" variant="primary" size="lg" fullWidth disabled={formSaving}>
              {formSaving
                ? 'Enregistrement en cours...'
                : editingItem
                ? 'Mettre à jour l’article'
                : 'Publier l’article'}
            </AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
