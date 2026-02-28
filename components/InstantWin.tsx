'use client';

import { useEffect, useState } from 'react';

const PRIZES = [
    "Un Bon d'achat de 10€",
    "Une Boisson Gratuite",
    "Un Porte-clés Exclusif",
    "Une Remise de 20%",
    "Une Surprise de la Part du Staff"
];

export default function InstantWin({ prize }: { prize: string }) {
    const [revealed, setRevealed] = useState(false);

    if (!revealed) {
        return (
            <div className="glass-card animate-fade-in" style={containerStyle}>
                <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Félicitations !</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Vous êtes inscrit. Prêt à découvrir votre cadeau ?
                </p>
                <div
                    onClick={() => setRevealed(true)}
                    style={boxStyle}
                    className="gift-box-animate"
                >
                    🎁
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                    Touchez le cadeau pour l'ouvrir
                </p>
                <style jsx>{`
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .gift-box-animate {
            animation: bounce 2s infinite ease-in-out;
            cursor: pointer;
          }
          .gift-box-animate:active {
            transform: scale(0.9);
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="glass-card animate-fade-in" style={containerStyle}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Vous avez gagné :
            </h2>
            <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                margin: '1.5rem 0',
                border: '2px dashed var(--primary-glow)',
                color: 'var(--primary-glow)'
            }}>
                {prize}
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
                Présentez cet écran à l'accueil pour récupérer votre prix.
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: '2rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--glass-bg)',
                    color: 'white',
                    border: '1px solid var(--glass-border)'
                }}
            >
                Retour à l'accueil
            </button>
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    padding: '3rem 2rem',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const boxStyle: React.CSSProperties = {
    fontSize: '6rem',
    lineHeight: '1',
    userSelect: 'none',
    filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))',
};
