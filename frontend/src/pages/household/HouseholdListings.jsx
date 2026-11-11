import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import ListingPhoto, { LISTINGS_URL } from './ListingPhoto';
import './HouseholdListings.css';

const money = new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' });

function ListingCard({ listing }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoId = listing.photoIds[photoIndex];
  return (
    <article className="listing-card">
      <div className="listing-gallery">
        <ListingPhoto key={photoId} photo={photoId} alt={`${listing.name}, photo ${photoIndex + 1}`} lazy />
        {listing.photoIds.length > 1 && (
          <div className="listing-gallery-controls">
            <button type="button" aria-label="Photo précédente" disabled={photoIndex === 0}
              onClick={() => setPhotoIndex(photoIndex - 1)}>‹</button>
            <span aria-live="polite">{photoIndex + 1} / {listing.photoIds.length}</span>
            <button type="button" aria-label="Photo suivante" disabled={photoIndex === listing.photoIds.length - 1}
              onClick={() => setPhotoIndex(photoIndex + 1)}>›</button>
          </div>
        )}
      </div>
      <div className="listing-card-body">
        <p className="listing-location">{listing.location}</p>
        <h2>{listing.name}</h2>
        <div className="listing-facts">
          <span><strong>{money.format(listing.monthlyRent)}</strong> / mois</span>
          <span>{listing.bedrooms} {listing.bedrooms === 1 ? 'chambre' : 'chambres'}</span>
        </div>
        <div className="listing-contact">
          <p>Contact du foyer <strong>{listing.administratorName}</strong></p>
          {listing.contactEmail && <a href={`mailto:${listing.contactEmail}`}>{listing.contactEmail}</a>}
          {listing.contactPhone && <a href={`tel:${listing.contactPhone.replace(/[^+0-9]/g, '')}`}>{listing.contactPhone}</a>}
        </div>
      </div>
    </article>
  );
}

export default function HouseholdListings() {
  const { user, loading } = useAuth();
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState('');
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    apiFetch(LISTINGS_URL, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const listings = await response.json();
        if (!controller.signal.aborted) setResult({ listings });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ error: true });
      });
    return () => controller.abort();
  }, [userId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const term = query.trim().toLocaleLowerCase('fr');
  const listings = result?.listings?.filter((listing) =>
    `${listing.name} ${listing.location}`.toLocaleLowerCase('fr').includes(term)
  );

  return (
    <main className="household-listings">
      <nav className="listings-nav" aria-label="Navigation">
        <Link className="auth-logo" to={user.householdId || user.household_id ? '/dashboard' : '/household/join'}>
          <span className="logo-icon" /><span className="brand-name">Cohabit</span>
        </Link>
        <Link className="app-btn app-btn-ghost app-btn-sm"
          to={user.householdId || user.household_id ? '/dashboard' : '/household/join'}>
          {user.householdId || user.household_id ? 'Mon foyer' : 'J’ai un code d’invitation'}
        </Link>
      </nav>
      <header className="listings-heading">
        <h1>Trouver une colocation</h1>
        <p>Découvrez les foyers qui cherchent de nouveaux colocataires et contactez-les directement.</p>
      </header>
      <label className="app-form-group listings-search">
        <span className="app-form-label">Ville, quartier ou nom du foyer</span>
        <input className="app-form-input" type="search" value={query}
          onChange={(event) => setQuery(event.target.value)} placeholder="Ex. Casablanca" />
      </label>
      {!result && <p role="status">Chargement des annonces…</p>}
      {result?.error && <p role="alert">Impossible de charger les annonces. Réessayez en actualisant la page.</p>}
      {listings?.length === 0 && <p role="status">{term ? 'Aucune annonce ne correspond à cette recherche.' : 'Aucun foyer ne cherche de colocataires pour le moment.'}</p>}
      <div className="listings-grid">
        {listings?.map((listing) => <ListingCard key={listing.householdId} listing={listing} />)}
      </div>
    </main>
  );
}
