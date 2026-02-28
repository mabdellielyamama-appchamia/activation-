'use client';

import { useState } from 'react';

export const CHAMIA_VARIANTS = [
  'CHAMIA 150 G PISTACHE',
  'CHAMIA 150 G VANILLE',
  'CHAMIA 350 G PISTACHE',
  'CHAMIA 350 G VANILLE',
  'CHAMIA 700 G PISTACHE',
  'CHAMIA 700 G VANILLE',
  'CHAMIA 3KG PISTACHE',
  'CHAMIA 3KG VANILLE',
];

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  nomPdv: string;
  productsPurchased: number | '';
  selectedGift: string;
  productDetails: Record<string, number>;
}

export default function RegistrationForm({ onComplete }: { onComplete: (data: FormData) => void }) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    nomPdv: '',
    productsPurchased: '',
    selectedGift: '',
    productDetails: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomPdv || formData.nomPdv.trim() === '') {
      alert("Le nom du point de vente est obligatoire pour la gestion des stocks.");
      return;
    }
    if (!formData.productsPurchased || formData.productsPurchased < 1) {
      alert("Veuillez entrer une quantité valide (minimum 1).");
      return;
    }
    if (formData.productsPurchased === 1 && !formData.selectedGift) {
      alert("Veuillez sélectionner le cadeau remis.");
      return;
    }
    onComplete(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductDetailChange = (variant: string, delta: number) => {
    setFormData(prev => {
      const currentQty = prev.productDetails[variant] || 0;
      const newQty = Math.max(0, currentQty + delta);

      const newDetails = { ...prev.productDetails, [variant]: newQty };
      const newTotal = Object.values(newDetails).reduce((acc, val) => acc + val, 0);

      let gift = prev.selectedGift;
      if (newTotal === 1) {
        gift = ''; // Require explicit selection between Pen / Doming
      } else if (newTotal === 2) {
        gift = 'Notebook';
      } else if (newTotal >= 3) {
        gift = 'TNT Bag';
      } else {
        gift = '';
      }

      return {
        ...prev,
        productDetails: newDetails,
        productsPurchased: newTotal > 0 ? newTotal : '',
        selectedGift: gift
      };
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
      <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Participer à la Tombola
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Prénom
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Ex: Jean"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Nom
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Ex: Dupont"
              style={inputStyle}
            />
          </div>
        </div>
        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            Numéro de téléphone *
          </label>
          <input
            required
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="06 12 34 56 78"
            style={{ ...inputStyle, borderColor: 'var(--primary)' }}
          />
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Adresse
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Quartier, Ville..."
            style={inputStyle}
          />
        </div>

        <div className="input-group" style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
            Détail des Produits Achetés *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
            {CHAMIA_VARIANTS.map(variant => (
              <div key={variant} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{variant}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button type="button" onClick={() => handleProductDetailChange(variant, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                  <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{formData.productDetails[variant] || 0}</span>
                  <button type="button" onClick={() => handleProductDetailChange(variant, 1)} style={{ background: 'var(--primary)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantité Totale :</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{formData.productsPurchased || 0}</span>
          </div>

          {formData.productsPurchased === 1 && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'white' }}>
                Cadeau remis :
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="selectedGift" value="Pen" checked={formData.selectedGift === 'Pen'} onChange={handleChange} />
                  Stylo (Pen)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="selectedGift" value="Doming" checked={formData.selectedGift === 'Doming'} onChange={handleChange} />
                  Doming
                </label>
              </div>
            </div>
          )}

          {typeof formData.productsPurchased === 'number' && formData.productsPurchased > 1 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cadeau automatique :</p>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: 'var(--primary-glow)' }}>
                {formData.selectedGift === 'Notebook' ? 'Carnet (Notebook)' : 'Sac TNT (TNT Bag)'}
              </p>
            </div>
          )}

          {formData.productsPurchased && (
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                Chances Tombola: <strong>{formData.productsPurchased === 1 ? '1' : '3'}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            Nom du point de vente *
          </label>
          <input
            required
            type="text"
            name="nomPdv"
            value={formData.nomPdv}
            onChange={handleChange}
            placeholder="Ex: Carrefour Market"
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(to right, var(--primary), var(--secondary))',
            color: 'white',
            fontWeight: '600',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          S'inscrire et Découvrir mon Cadeau
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  color: 'white',
  outline: 'none',
  transition: 'var(--transition)',
};
