'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Participant {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    nom_pdv: string;
    products_purchased: number;
    product_details?: Record<string, number>;
    chances: number;
    prize: string;
    created_at: string;
}

const CHAMIA_VARIANTS = [
    'CHAMIA 150 G PISTACHE',
    'CHAMIA 150 G VANILLE',
    'CHAMIA 350 G PISTACHE',
    'CHAMIA 350 G VANILLE',
    'CHAMIA 700 G PISTACHE',
    'CHAMIA 700 G VANILLE',
    'CHAMIA 3KG PISTACHE',
    'CHAMIA 3KG VANILLE',
];

interface Stock {
    Pen: number;
    Doming: number;
    Notebook: number;
    'TNT Bag': number;
}

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [stockByPdv, setStockByPdv] = useState<Record<string, Stock>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPdv, setSelectedPdv] = useState<string>('Tous');
    const [winnersByPdv, setWinnersByPdv] = useState<Record<string, Participant[]>>({});
    const [isDrawing, setIsDrawing] = useState(false);

    const ADMIN_PASSCODE = '1234'; // In a real app, this would be an env variable

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === ADMIN_PASSCODE) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            alert('Code incorrect');
            setPasscode('');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const isConfigured =
                process.env.NEXT_PUBLIC_SUPABASE_URL &&
                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
                !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

            if (isConfigured) {
                const { data, error: dbError } = await supabase
                    .from('participants')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (dbError) throw dbError;
                setParticipants(data || []);
            } else {
                // Fallback to local storage for demo if supabase not configured
                console.warn('Supabase not configured. Loading from localStorage.');
                const localData = JSON.parse(localStorage.getItem('tombola_participants') || '[]');

                // Normalize data for display (handling old broken records)
                const normalizedData = localData.map((p: any) => ({
                    id: p.id || Math.random().toString(),
                    first_name: p.first_name || p.firstName || '',
                    last_name: p.last_name || p.lastName || '',
                    phone: p.phone || '',
                    address: p.address || '',
                    nom_pdv: p.nom_pdv || p.nomPdv || '',
                    products_purchased: p.products_purchased || p.productsPurchased || 0,
                    product_details: p.product_details || {},
                    chances: p.chances || 0,
                    prize: p.prize || '',
                    created_at: p.created_at || p.date || new Date().toISOString()
                }));

                setParticipants(normalizedData);
            }

            // Load Stock from localStorage always
            const localStock = JSON.parse(localStorage.getItem('tombola_stock') || '{}');
            setStockByPdv(localStock);

        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError('Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    // Derived State for Filtering
    const availablePdvs = Array.from(new Set([
        ...participants.map(p => p.nom_pdv).filter(Boolean),
        ...Object.keys(stockByPdv)
    ])).sort();

    const filteredParticipants = selectedPdv === 'Tous'
        ? participants
        : participants.filter(p => p.nom_pdv === selectedPdv);

    const filteredStockByPdv = selectedPdv === 'Tous'
        ? stockByPdv
        : (stockByPdv[selectedPdv] ? { [selectedPdv]: stockByPdv[selectedPdv] } : {});

    const exportToCSV = () => {
        const dataToExport = selectedPdv === 'Tous' ? participants : filteredParticipants;
        if (dataToExport.length === 0) return;

        const headers = ['Prénom', 'Nom', 'Téléphone', 'Adresse', 'Point de Vente', 'Total Produits', ...CHAMIA_VARIANTS, 'Chances', 'Cadeau', 'Date'];
        const rows = dataToExport.map(p => {
            const details = p.product_details || {};
            return [
                p.first_name,
                p.last_name,
                p.phone,
                p.address,
                p.nom_pdv,
                p.products_purchased.toString(),
                ...CHAMIA_VARIANTS.map(v => (details[v] || 0).toString()),
                p.chances.toString(),
                p.prize,
                new Date(p.created_at).toLocaleString()
            ];
        });

        // Use semicolon as separator for European locales in Excel
        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        // Add UTF-8 BOM (\uFEFF) to force Excel to read UTF-8 properly (accents etc)
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tombola_data_${selectedPdv === 'Tous' ? 'global' : selectedPdv.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDrawWinners = () => {
        if (participants.length === 0) {
            alert("Aucun participant pour le tirage au sort.");
            return;
        }

        setIsDrawing(true);
        setWinnersByPdv({});

        // Fake delay for suspense
        setTimeout(() => {
            const results: Record<string, Participant[]> = {};

            // Get unique POS names (ignoring empty ones if any)
            const pdvs = Array.from(new Set(participants.map(p => p.nom_pdv).filter(Boolean)));

            pdvs.forEach(pdv => {
                const pdvParticipants = participants.filter(p => p.nom_pdv === pdv);
                const pdvWinners: Participant[] = [];
                // Pick up to 3 distinct winners
                const numWinnersToPick = Math.min(3, pdvParticipants.length);
                const selectedIds = new Set<string>();

                while (pdvWinners.length < numWinnersToPick) {
                    const pool: Participant[] = [];
                    pdvParticipants.forEach(p => {
                        if (!selectedIds.has(p.id)) {
                            const chances = Number(p.chances) || 1; // Default to 1 if no chances recorded
                            for (let i = 0; i < chances; i++) {
                                pool.push(p);
                            }
                        }
                    });

                    if (pool.length === 0) break; // Fallback to avoid infinite loops

                    const randomIndex = Math.floor(Math.random() * pool.length);
                    const chosen = pool[randomIndex];

                    pdvWinners.push(chosen);
                    selectedIds.add(chosen.id);
                }

                if (pdvWinners.length > 0) {
                    results[pdv] = pdvWinners;
                }
            });

            if (Object.keys(results).length === 0) {
                alert("Aucun participant n'a pu être sélectionné.");
                setIsDrawing(false);
                return;
            }

            setWinnersByPdv(results);
            setIsDrawing(false);
        }, 3000);
    };

    const handleResetData = async () => {
        if (window.confirm("⚠️ ATTENTION: Voulez-vous vraiment supprimer TOUTES les participations et réinitialiser les stocks ? Cette action est irréversible.")) {
            try {
                // Clear local storage
                localStorage.removeItem('tombola_participants');
                localStorage.removeItem('tombola_stock');

                // If Supabase is configured, also attempt to clear it
                const isConfigured =
                    process.env.NEXT_PUBLIC_SUPABASE_URL &&
                    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
                    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

                if (isConfigured) {
                    const { error } = await supabase
                        .from('participants')
                        .delete()
                        .neq('id', '0'); // Delete all rows trick
                    if (error) console.error("Database clear error:", error);
                }

                // Update UI state
                setParticipants([]);
                setStockByPdv({});
                setWinnersByPdv({});
                alert("Toutes les données ont été effacées et le stock a été réinitialisé.");

            } catch (err) {
                console.error("Erreur lors de la réinitialisation:", err);
                alert("Une erreur est survenue lors de la suppression.");
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={loginContainerStyle}>
                <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h1 className="gradient-text" style={{ marginBottom: '2rem' }}>Acces Admin</h1>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Code Secret"
                            autoFocus
                            style={inputStyle}
                        />
                        <button type="submit" style={buttonStyle}>Se Connecter</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={dashboardContainerStyle}>
            <header style={headerStyle}>
                <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Données Tombola</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={selectedPdv}
                        onChange={(e) => setSelectedPdv(e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, width: 'auto', padding: '0.5rem 1rem', fontSize: '1rem', letterSpacing: 'normal' }}
                    >
                        <option value="Tous">Tous les PDV</option>
                        {availablePdvs.map(pdv => (
                            <option key={pdv} value={pdv}>{pdv}</option>
                        ))}
                    </select>
                    <button onClick={handleDrawWinners} style={{ ...buttonStyle, background: 'linear-gradient(to right, #f59e0b, #ef4444)' }}>
                        🎲 Tirage au Sort
                    </button>
                    <button onClick={fetchData} style={secondaryButtonStyle}>Rafraîchir</button>
                    <button onClick={exportToCSV} style={buttonStyle}>Exporter</button>
                    <button onClick={handleResetData} style={{ ...secondaryButtonStyle, borderColor: '#ef4444', color: '#ef4444' }}>
                        🗑️ Réinitialiser
                    </button>
                </div>
            </header>

            {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Participants</div>
                    <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{filteredParticipants.length}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chances Tombola</div>
                    <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {filteredParticipants.reduce((acc, p) => acc + (Number(p.chances) || 0), 0)}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Produits Vendus</div>
                    <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {filteredParticipants.reduce((acc, p) => acc + (Number(p.products_purchased) || 0), 0)}
                    </div>
                </div>
            </div>

            <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Stock Restant (Par PDV)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {Object.keys(filteredStockByPdv).length === 0 ? (
                    <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.5 }}>
                        Aucune donnée de stock générée
                    </div>
                ) : (
                    Object.entries(filteredStockByPdv).map(([pdv, pdvStock]) => (
                        <div key={pdv} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                📍 {pdv}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Stylos:</span> <span style={{ color: pdvStock.Pen < 10 ? '#ef4444' : 'var(--primary-glow)', fontWeight: 'bold' }}>{pdvStock.Pen}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Domings:</span> <span style={{ color: pdvStock.Doming < 10 ? '#ef4444' : 'var(--primary-glow)', fontWeight: 'bold' }}>{pdvStock.Doming}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Carnets:</span> <span style={{ color: pdvStock.Notebook < 10 ? '#ef4444' : 'var(--primary-glow)', fontWeight: 'bold' }}>{pdvStock.Notebook}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Sacs TNT:</span> <span style={{ color: pdvStock['TNT Bag'] < 10 ? '#ef4444' : 'var(--primary-glow)', fontWeight: 'bold' }}>{pdvStock['TNT Bag']}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="glass-card" style={{ overflowX: 'auto', width: '100%' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
                ) : (
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Prénom</th>
                                <th style={thStyle}>Nom</th>
                                <th style={thStyle}>Téléphone</th>
                                <th style={thStyle}>Point de Vente</th>
                                <th style={thStyle}>Produits</th>
                                <th style={thStyle}>Détails Produits</th>
                                <th style={thStyle}>Chances</th>
                                <th style={thStyle}>Cadeau</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.map((p) => (
                                <tr key={p.id} style={trStyle}>
                                    <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td style={tdStyle}>{p.first_name}</td>
                                    <td style={tdStyle}>{p.last_name}</td>
                                    <td style={tdStyle}>{p.phone}</td>
                                    <td style={tdStyle}>{p.nom_pdv}</td>
                                    <td style={tdStyle}><strong>{p.products_purchased}</strong></td>
                                    <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '250px', lineHeight: '1.4' }}>
                                        {p.product_details && Object.keys(p.product_details).length > 0
                                            ? Object.entries(p.product_details)
                                                .filter(([_, qty]) => qty > 0)
                                                .map(([variant, qty]) => `${qty}x ${variant.replace('CHAMIA ', '')}`)
                                                .join(', ')
                                            : '-'}
                                    </td>
                                    <td style={tdStyle}><strong>{p.chances}</strong></td>
                                    <td style={tdStyle}>
                                        <span style={prizeBadgeStyle}>{p.prize}</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredParticipants.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                        Aucune donnée collectée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Winner Draw Overlay */}
            {(isDrawing || Object.keys(winnersByPdv).length > 0) && (
                <div style={overlayStyle}>
                    <div className="glass-card animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        {isDrawing ? (
                            <div style={{ padding: '2rem 0' }}>
                                <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tirage en cours...</h2>
                                <div style={{ fontSize: '4rem', animation: 'spin 1s linear infinite' }}>🎲</div>
                                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Sélection de 3 gagnants par Point de Vente...</p>
                            </div>
                        ) : Object.keys(winnersByPdv).length > 0 ? (
                            <>
                                <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1.5rem', flexShrink: 0 }}>🎉 GRANDS GAGNANTS 🎉</h2>
                                <div style={{ overflowY: 'auto', textAlign: 'left', paddingRight: '0.5rem', flex: 1 }}>
                                    {Object.entries(winnersByPdv).map(([pdv, pdvWinners]) => (
                                        <div key={pdv} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                                            <h3 style={{ color: 'var(--primary-glow)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>📍</span> {pdv}
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {pdvWinners.map((winner, idx) => (
                                                    <div key={winner.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                                        <div style={{ width: '32px', height: '32px', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{winner.first_name} {winner.last_name}</div>
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <span>📞</span> {winner.phone}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--secondary)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                            {winner.chances} chances
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ flexShrink: 0, marginTop: '1.5rem' }}>
                                    <button onClick={() => setWinnersByPdv({})} style={{ ...buttonStyle, width: '100%', padding: '1rem' }}>Fermer le palmarès</button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles
const loginContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '1rem',
};

const dashboardContainerStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    color: 'white',
    fontSize: '1.25rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    letterSpacing: '0.5rem',
};

const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
    color: 'white',
    fontWeight: '600',
};

const secondaryButtonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--glass-bg)',
    color: 'white',
    border: '1px solid var(--glass-border)',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
};

const thStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

const trStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const tdStyle: React.CSSProperties = {
    padding: '1rem',
    fontSize: '0.875rem',
};

const prizeBadgeStyle: React.CSSProperties = {
    padding: '0.25rem 0.75rem',
    background: 'rgba(99, 102, 241, 0.2)',
    color: 'var(--primary-glow)',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: '600',
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
};
