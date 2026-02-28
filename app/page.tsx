'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import InstantWin from '@/components/InstantWin';

export default function Home() {
  const [step, setStep] = useState<'register' | 'reveal'>('register');
  const [prize, setPrize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegistrationComplete = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const chances = data.productsPurchased === 1 ? 1 : 3;
      const selectedGift = data.selectedGift;

      // Stock management per PDV
      let allStock = JSON.parse(localStorage.getItem('tombola_stock') || '{}');
      const pdv = data.nomPdv;

      // Initialize PDV stock if it doesn't exist
      if (!allStock[pdv]) {
        allStock[pdv] = {
          Pen: 50,
          Doming: 50,
          Notebook: 100,
          'TNT Bag': 50
        };
      }

      const pdvStock = allStock[pdv];

      if (selectedGift && pdvStock[selectedGift] !== undefined) {
        pdvStock[selectedGift] = Math.max(0, pdvStock[selectedGift] - 1);
        allStock[pdv] = pdvStock; // Update back
        localStorage.setItem('tombola_stock', JSON.stringify(allStock));
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
            chances: chances,
            prize: selectedGift
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
          prize: selectedGift,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('tombola_participants', JSON.stringify(participants));
      }

      setPrize(selectedGift);
      setStep('reveal');
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
        ) : step === 'register' ? (
          <RegistrationForm onComplete={handleRegistrationComplete} />
        ) : (
          <InstantWin prize={prize} />
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
