import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppButton } from '../../components/shared/SharedComponents';
import { apiFetch } from '../../services/api';
import ListingPhoto, { LISTINGS_URL } from './ListingPhoto';
import './HouseholdListings.css';

const SETTINGS_URL = `${LISTINGS_URL}/mine`;
const fields = [
  { key: 'location', label: 'Ville et quartier', maxLength: 160, placeholder: 'Ex. Casablanca, Maârif' },
  { key: 'monthlyRent', label: 'Loyer mensuel demandé (MAD)', type: 'number', min: '0.01', max: '99999999.99', step: '0.01' },
  { key: 'bedrooms', label: 'Nombre de chambres', type: 'number', min: '1', max: '2147483647', step: '1' },
  { key: 'contactEmail', label: 'E-mail de contact', type: 'email', maxLength: 254 },
  { key: 'contactPhone', label: 'Téléphone de contact', type: 'tel', maxLength: 32 },
];

export default function ListingSettings() {
  const [form, setForm] = useState(null);
  const [newPhotos, setNewPhotos] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch(SETTINGS_URL, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!controller.signal.aborted) setForm(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Impossible de charger les paramètres de l’annonce.');
      });
    return () => controller.abort();
  }, []);

  function addPhotos(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    setError('');
    setMessage('');
    if (files.length + newPhotos.length + form.photoIds.length > 5) {
      setError('Vous pouvez ajouter jusqu’à cinq photos.');
      return;
    }
    if (files.some((file) => file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))) {
      setError('Choisissez des fichiers JPEG ou PNG de 2 Mo maximum.');
      return;
    }
    setNewPhotos((previous) => [...previous, ...files.map((file) => ({ file, key: crypto.randomUUID() }))]);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = new FormData();
    payload.append('details', new Blob([JSON.stringify({
      location: form.location?.trim(),
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      contactEmail: form.contactEmail?.trim(),
      contactPhone: form.contactPhone?.trim(),
      published: form.published,
      hideContact: form.hideContact,
      photoIds: form.photoIds,
    })], { type: 'application/json' }));
    newPhotos.forEach(({ file }) => payload.append('photos', file));

    try {
      const response = await apiFetch(SETTINGS_URL, { method: 'PUT', body: payload });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Vérifiez les champs et les photos de votre annonce.');
      setForm(data);
      setNewPhotos([]);
      setMessage(data.published ? 'Annonce publiée.' : 'Annonce enregistrée hors ligne.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="app-card hs-card listing-settings" aria-labelledby="listing-settings-title">
      <div className="listing-settings-heading">
        <h3 id="listing-settings-title" className="profile-section-title">Annonce de colocation</h3>
        <Link to="/household/search">Voir les annonces</Link>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="listing-success" role="status">{message}</p>}
      {!form && !error && <p role="status">Chargement…</p>}
      {form && (
        <form onSubmit={save} className="app-form">
          <fieldset disabled={saving} className="listing-fields">
            <div className="listing-field-grid">
              {fields.map(({ key, label, type = 'text', ...attributes }) => (
                <label className="app-form-group" key={key}>
                  <span className="app-form-label">{label}</span>
                  <input className="app-form-input" type={type} value={form[key] ?? ''} {...attributes}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                </label>
              ))}
            </div>
            <p>Les personnes intéressées pourront vous écrire dans la messagerie Cohabit.</p>
            <label className="listing-publish">
              <input type="checkbox" checked={form.hideContact}
                onChange={(event) => setForm({ ...form, hideContact: event.target.checked })} />
              Masquer mon e-mail et mon numéro sur l’annonce
            </label>
            <label className="app-form-group">
              <span className="app-form-label">Photos du foyer</span>
              <input className="app-form-input" type="file" accept="image/jpeg,image/png" multiple onChange={addPhotos} />
              <span>Jusqu’à cinq photos JPEG ou PNG de 2 Mo chacune. La première sert de couverture.</span>
            </label>
            <div className="listing-previews">
              {form.photoIds.map((id, index) => (
                <div key={id} className="listing-preview">
                  <ListingPhoto photo={id} alt={`Photo ${index + 1} du foyer`} />
                  <AppButton size="sm" variant="ghost" onClick={() => setForm({
                    ...form, photoIds: form.photoIds.filter((photoId) => photoId !== id),
                  })}>Retirer</AppButton>
                </div>
              ))}
              {newPhotos.map(({ file, key }) => (
                <div key={key} className="listing-preview">
                  <ListingPhoto photo={file} alt={file.name} />
                  <AppButton size="sm" variant="ghost" onClick={() => setNewPhotos(
                    newPhotos.filter((photo) => photo.key !== key)
                  )}>Retirer</AppButton>
                </div>
              ))}
            </div>
            <label className="listing-publish">
              <input type="checkbox" checked={form.published}
                onChange={(event) => setForm({ ...form, published: event.target.checked })} />
              Rechercher des colocataires et afficher l’annonce
            </label>
            <AppButton type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer l’annonce'}</AppButton>
          </fieldset>
        </form>
      )}
    </section>
  );
}
