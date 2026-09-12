import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';

export function ShopPanel({ open, onClose, profile, onProfileUpdate, onCosmeticsUpdate }) {
  const [cosmetics, setCosmetics] = useState([]);
  const [userCosmetics, setUserCosmetics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const coins = profile?.coins ?? 0;

  useEffect(() => {
    if (!open) return;
    fetchShopData();
  }, [open]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const [shopRes, userRes] = await Promise.all([
        supabase.from('cosmetics').select('*').order('price', { ascending: true }),
        supabase.from('user_cosmetics').select('*')
      ]);
      
      if (shopRes.error) throw shopRes.error;
      if (userRes.error) throw userRes.error;
      
      setCosmetics(shopRes.data);
      setUserCosmetics(userRes.data);
      if (onCosmeticsUpdate) onCosmeticsUpdate(userRes.data, shopRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (cosmeticId, price) => {
    if (loading || coins < price) return;
    try {
      setLoading(true);
      setError(null);
      const { error: rpcErr } = await supabase.rpc('purchase_cosmetic', { p_cosmetic_id: cosmeticId });
      if (rpcErr) throw rpcErr;
      
      if (onProfileUpdate) await onProfileUpdate();
      await fetchShopData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (cosmeticId, equipState) => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      const { error: rpcErr } = await supabase.rpc('equip_cosmetic', { p_cosmetic_id: cosmeticId, p_equip: equipState });
      if (rpcErr) throw rpcErr;
      
      await fetchShopData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="shop-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section 
            className="shop-panel" 
            role="dialog" 
            initial={{ y: 20, opacity: 0, scale: 0.98 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
          >
            <div className="shop-header">
              <h2>MERCHANT</h2>
              <div className="shop-coins">
                <span aria-hidden="true">◉</span> <b>{coins}</b>
              </div>
              <button className="shop-close" onClick={onClose} aria-label="Close Shop">×</button>
            </div>
            
            {error && <div className="shop-error">{error}</div>}
            
            <div className="shop-grid">
              {cosmetics.map(item => {
                const ownership = userCosmetics.find(uc => uc.cosmetic_id === item.id);
                const isOwned = !!ownership;
                const isEquipped = ownership?.equipped;
                const canAfford = coins >= item.price;
                
                return (
                  <div key={item.id} className={`shop-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`}>
                    <div className="card-header">
                      <h4>{item.name}</h4>
                      <span className="card-type">{item.cosmetic_type}</span>
                    </div>
                    <p className="card-desc">{item.description}</p>
                    
                    <div className="card-actions">
                      {!isOwned ? (
                        <button 
                          className={`btn-buy ${!canAfford ? 'disabled' : ''}`}
                          disabled={loading || !canAfford} 
                          onClick={() => handleBuy(item.id, item.price)}
                        >
                          {canAfford ? `BUY (${item.price} ◉)` : `INSUFFICIENT (${item.price} ◉)`}
                        </button>
                      ) : (
                        <button 
                          className={`btn-equip ${isEquipped ? 'is-equipped' : ''}`}
                          disabled={loading}
                          onClick={() => handleEquip(item.id, !isEquipped)}
                        >
                          {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
