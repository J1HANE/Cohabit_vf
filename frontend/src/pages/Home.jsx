import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import heroBg from '../assets/cohabit.png';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateFoyer = () => {
    if (user) {
      navigate('/household/create');
    } else {
      navigate('/register');
    }
  };

  const handleJoinFoyer = () => {
    if (user) {
      navigate('/household/join');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className={`app-container ${mounted ? 'mounted' : ''}`}>
      <div className="hero-frame">
        <div 
          className="hero-background" 
          style={{ backgroundImage: `url(${heroBg})` }}
        ></div>
        <div className="hero-overlay"></div>
        
        <nav className="navbar">
          <div className="nav-left">
            <div className="logo-icon"></div>
            <span className="brand-name">Cohabit</span>
          </div>
          <div className="nav-center">
            <a href="#foyers">Foyers</a>
            <a href="#depenses">Dépenses</a>
            <a href="#taches">Tâches</a>
            <a href="#how">Comment ça marche</a>
          </div>
          <div className="nav-right">
            {user ? (
              <>
                <span className="login-link">Bonjour, {user.name} 👋</span>
                <button className="btn btn-primary-nav" onClick={logout}>Se déconnecter</button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">Connexion</Link>
                <Link to="/register"><button className="btn btn-primary-nav">S'inscrire</button></Link>
              </>
            )}
          </div>
        </nav>

        <main className="hero-content">
          <div className="hero-left">
            <h1 className="hero-headline">
              <span className="text-highlight">La vie en coloc.</span>
              <br />
              <span className="text-muted">Sans les embrouilles.</span>
            </h1>
            <p className="hero-subheadline">
              Gérez vos dépenses partagées, répartissez les tâches ménagères et organisez vos courses en un seul endroit. Simplifiez votre vie en communauté.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={handleCreateFoyer}>Créer un foyer</button>
              <button className="btn btn-secondary" onClick={handleJoinFoyer}>Rejoindre un foyer</button>
            </div>
          </div>

          <div className="hero-right">
            <div className="floating-card">
              <div className="card-header">
                <span className="card-badge">Ce mois-ci</span>
                <span className="card-title">Équilibre de la coloc</span>
              </div>
              <h3 className="card-subtitle">Vous devez 5000dh à Jihane </h3>
              <p className="card-location">Courses de la semaine</p>
              
              <div className="avatars">
                <div className="avatar" style={{backgroundImage: 'url(https://i.pravatar.cc/150?img=33)'}}></div>
                <div className="avatar" style={{backgroundImage: 'url(https://i.pravatar.cc/150?img=11)'}}></div>
                <div className="avatar" style={{backgroundImage: 'url(https://i.pravatar.cc/150?img=47)'}}></div>
              </div>

              <div className="card-details">
                <div className="detail-item">
                  <span className="detail-label">Votre tâche</span>
                  <span className="detail-value">Sortir la poubelle</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Statut</span>
                  <span className="detail-value text-alert">En retard</span>
                </div>
              </div>
              <Link to="/login" style={{textDecoration: 'none'}}><button className="btn btn-card">Régler mes dettes</button></Link>
            </div>
          </div>
        </main>

        <div className="hero-bottom-left">
          <h4>Coordinateur de foyer</h4>
          <p>La solution web centralisée pour automatiser vos calculs et équilibrer la vie de communauté.</p>
        </div>
      </div>

      <section id="how" className="how-it-works">
        <div className="section-header">
          <h2>Comment ça marche ?</h2>
          <p>Un système articulé autour de 3 modules complémentaires pour une colocation sereine.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>1. Gestion du Foyer</h3>
            <p>Créez votre foyer et générez un code d'invitation unique. Vos colocataires utilisent ce code pour vous rejoindre. Chaque membre possède son propre profil personnalisé.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💶</div>
            <h3>2. Équilibre des Dépenses</h3>
            <p>Enregistrez un achat et indiquez pour qui la dépense doit être répartie. L'application calcule les dettes croisées en temps réel et optimise les remboursements.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>3. Tâches & Courses</h3>
            <p>Profitez d'une roue tournante pour attribuer les tâches ménagères équitablement. Maintenez une liste de courses et convertissez directement vos achats en dépenses.</p>
          </div>
        </div>
      </section>

      {/* NEW: Testimonials Section */}
      <section className="testimonials">
        <div className="section-header">
          <h2>Ils adorent Cohabit</h2>
          <p>Découvrez comment notre application a sauvé des dizaines de colocations.</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="quote">"Fini les prises de tête à la fin du mois pour savoir qui a payé l'électricité. Tout est calculé automatiquement !"</p>
            <div className="testimonial-author">
              <div className="avatar" style={{backgroundImage: 'url(https://i.pravatar.cc/150?img=12)'}}></div>
              <div>
                <strong>Sophie</strong>
                <span>Coloc de 4</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p className="quote">"La roue des tâches est géniale. Plus personne ne peut dire 'Je ne savais pas que c'était mon tour'."</p>
            <div className="testimonial-author">
              <div className="avatar" style={{backgroundImage: 'url(https://i.pravatar.cc/150?img=59)'}}></div>
              <div>
                <strong>Marc</strong>
                <span>Coloc de 3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: CTA Section */}
      <section className="bottom-cta">
        <div className="cta-content">
          <h2>Prêt à simplifier votre coloc ?</h2>
          <p>Rejoignez des milliers de colocataires qui vivent enfin en paix.</p>
          <Link to="/register"><button className="btn btn-primary cta-large">Commencer gratuitement</button></Link>
        </div>
      </section>

      {/* NEW: Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon"></div>
            <span className="brand-name">Cohabit</span>
          </div>
          <div className="footer-links">
            <a href="#">Conditions</a>
            <a href="#">Confidentialité</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Cohabit. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
