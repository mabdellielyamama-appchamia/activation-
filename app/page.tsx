'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';

export default function Home() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegistrationComplete = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const chances = data.productsPurchased === 1 ? 1 : 3;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-project-url') {
        const { supabase } = await import('@/lib/supabase');
        const { error: dbError } = await supabase
          .from('participants')
          .insert([{
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            address: data.address,
            nom_pdv: data.nomPdv,
            products_purchased: data.productsPurchased,
            product_details: data.productDetails,
            chances: chances
          }]);

        if (dbError) throw dbError;
      } else {
        console.warn("Supabase keys missing or default. Falling back to localStorage.");
        const participants = JSON.parse(localStorage.getItem('tombola_participants') || '[]');
        participants.push({
          id: Math.random().toString(36).substr(2, 9),
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          address: data.address,
          nom_pdv: data.nomPdv,
          products_purchased: data.productsPurchased,
          product_details: data.productDetails,
          chances: chances,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('tombola_participants', JSON.stringify(participants));
      }

      setSuccessMessage("Participation enregistrée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving data:", err);
      setError("Désolé, une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={mainStyle}>
      <header style={headerStyle}>
        <div className="gradient-text" style={{ fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
          TOMBOLA
        </div>
        <a href="/admin" style={{ textDecoration: 'none' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'default' }}>
            Événement Spécial Activation
          </p>
        </a>
      </header>

      <section style={contentStyle}>
        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {isSubmitting ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: '1.25rem' }}>Traitement en cours...</div>
          </div>
        ) : successMessage ? (
          <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {successMessage}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Le formulaire est prêt pour le prochain participant.</p>
          </div>
        ) : (
          <RegistrationForm onComplete={handleRegistrationComplete} />
        )}
      </section>

      <footer style={footerStyle}>
        © 2026 Tombola App. Tous droits réservés.
      </footer>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '2rem 1rem',
  gap: '2rem',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '2rem',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const footerStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  opacity: 0.6,
  marginTop: 'auto',
  paddingBottom: '1rem',
};
