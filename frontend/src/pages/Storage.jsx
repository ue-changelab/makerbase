import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];
const CONDITION_COLOR = { excellent: '#27ae60', good: '#4a7c59', fair: '#e67e22', poor: '#c0392b' };

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' };
const inputStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-primary)', background: 'white', outline: 'none', fontFamily: 'inherit', width: '100%' };
const btnPrimary = { padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };
const btnSecondary = { padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' };

const EMPTY_ITEM = { org_id: '', name: '', description: '', zone: '', shelf_position: '', quantity: 1, condition: 'good' };
const EMPTY_CO   = { borrower_name: '', event_name: '', expected_return: '', notes: '' };

export default function Storage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [orgs, setOrgs]   = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [selectedOrg, setSelectedOrg]       = useState('');
  const [search, setSearch]                 = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [itemForm, setItemForm]           = useState(EMPTY_ITEM);

  const [showCoModal, setShowCoModal]   = useState(false);
  const [coTarget, setCoTarget]         = useState(null);
  const [coForm, setCoForm]             = useState(EMPTY_CO);
  const [saving, setSaving]             = useState(false);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [o, i] = await Promise.all([api.get('/storage/orgs'), api.get('/storage/items')]);
      setOrgs(o.data); setItems(i.data);
    } catch { setError('Failed to load inventory.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  const orgMap = useMemo(() => Object.fromEntries(orgs.map(o => [o.id, o])), [orgs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      if (selectedOrg && item.org_id !== parseInt(selectedOrg)) return false;
      if (showFlaggedOnly && !item.flagged) return false;
      if (q) return item.name.toLowerCase().includes(q) || (item.description||'').toLowerCase().includes(q) || (item.zone||'').toLowerCase().includes(q) || (item.org_name||'').toLowerCase().includes(q);
      return true;
    });
  }, [items, selectedOrg, showFlaggedOnly, search]);

  function openAdd()  { setEditItem(null); setItemForm({ ...EMPTY_ITEM, org_id: selectedOrg }); setShowItemModal(true); }
  function openEdit(item) { setEditItem(item); setItemForm({ org_id: item.org_id != null ? String(item.org_id) : '', name: item.name, description: item.description||'', zone: item.zone||'', shelf_position: item.shelf_position||'', quantity: item.quantity, condition: item.condition }); setShowItemModal(true); }

  async function saveItem() {
    if (!itemForm.name.trim()) return;
    setSaving(true);
    try {
      const p = { org_id: itemForm.org_id ? parseInt(itemForm.org_id) : null, name: itemForm.name.trim(), description: itemForm.description.trim()||null, zone: itemForm.zone.trim()||null, shelf_position: itemForm.shelf_position.trim()||null, quantity: parseInt(itemForm.quantity)||1, condition: itemForm.condition };
      editItem ? await api.patch(`/storage/items/${editItem.id}`, p) : await api.post('/storage/items', p);
      setShowItemModal(false); loadAll();
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await api.delete(`/storage/items/${item.id}`); loadAll(); } catch { alert('Failed to delete.'); }
  }

  async function handleFlag(item) {
    try { await api.patch(`/storage/items/${item.id}/flag`, { flagged: !item.flagged }); loadAll(); } catch { alert('Failed to update flag.'); }
  }

  function openCheckout(item) { setCoTarget(item); setCoForm(EMPTY_CO); setShowCoModal(true); }

  async function submitCheckout() {
    if (!coForm.borrower_name.trim()) return;
    setSaving(true);
    try {
      await api.post('/storage/checkouts', { item_id: coTarget.id, borrower_name: coForm.borrower_name.trim(), event_name: coForm.event_name.trim()||null, expected_return: coForm.expected_return||null, notes: coForm.notes.trim()||null });
      setShowCoModal(false); loadAll();
    } catch { alert('Failed to check out.'); }
    finally { setSaving(false); }
  }

  async function handleReturn(coId) {
    try { await api.patch(`/storage/checkouts/${coId}/return`); loadAll(); } catch { alert('Failed to mark returned.'); }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading inventory…</div>;
  if (error)   return <div style={{ padding: '2rem' }}><div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div><button onClick={loadAll} style={btnSecondary}>Retry</button></div>;

  const checkedOutCount = items.filter(i => (i.active_checkouts||[]).length > 0).length;
  const flaggedCount    = items.filter(i => i.flagged).length;

  return (
    <div style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Storage Inventory</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4, display: 'flex', gap: 16 }}>
            <span>{items.length} items</span>
            {checkedOutCount > 0 && <span style={{ color: 'var(--warning)' }}>{checkedOutCount} checked out</span>}
            {isAdmin && flaggedCount > 0 && <span style={{ color: 'var(--danger)' }}>{flaggedCount} flagged</span>}
          </div>
        </div>
        <button onClick={openAdd} style={btnPrimary}>+ Add Item</button>
      </div>

      {/* Org pills */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <OrgPill label="All" color="var(--accent)" active={selectedOrg === ''} onClick={() => setSelectedOrg('')} />
        {orgs.map(org => <OrgPill key={org.id} label={org.name} color={org.color} active={selectedOrg === String(org.id)} onClick={() => setSelectedOrg(selectedOrg === String(org.id) ? '' : String(org.id))} />)}
      </div>

      {/* Search + flag toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', alignItems: 'center' }}>
        <input type="search" placeholder="Search by name, org, zone…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', background: 'white', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
        {isAdmin && <button onClick={() => setShowFlaggedOnly(v => !v)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: showFlaggedOnly ? '1px solid var(--warning)' : '1px solid var(--border)', background: showFlaggedOnly ? 'var(--warning-light)' : 'white', color: showFlaggedOnly ? 'var(--warning)' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>⚑ Flagged{flaggedCount > 0 ? ` (${flaggedCount})` : ''}</button>}
      </div>

      {(search || selectedOrg || showFlaggedOnly) && <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>Showing {filtered.length} of {items.length} items{selectedOrg ? ` in ${orgMap[parseInt(selectedOrg)]?.name}` : ''}</div>}

      {filtered.length === 0
        ? <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>{search || selectedOrg || showFlaggedOnly ? 'No items match.' : 'No items yet. Add one above.'}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{filtered.map(item => <ItemCard key={item.id} item={item} org={orgMap[item.org_id]} isAdmin={isAdmin} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} onFlag={() => handleFlag(item)} onCheckout={() => openCheckout(item)} onReturn={handleReturn} />)}</div>
      }

      {/* Item Modal */}
      {showItemModal && (
        <Modal onClose={() => setShowItemModal(false)}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>{editItem ? 'Edit Item' : 'Add Item'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={labelStyle}>Name *<input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Item name" autoFocus /></label>
            <label style={labelStyle}>Organization<select value={itemForm.org_id} onChange={e => setItemForm(f => ({ ...f, org_id: e.target.value }))} style={inputStyle}><option value="">— None —</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label style={labelStyle}>Description<textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 64, resize: 'vertical' }} placeholder="Optional" /></label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ ...labelStyle, flex: 1 }}>Zone<input value={itemForm.zone} onChange={e => setItemForm(f => ({ ...f, zone: e.target.value }))} style={inputStyle} placeholder="e.g. Wire Rack 1" /></label>
              <label style={{ ...labelStyle, flex: 1 }}>Shelf Position<input value={itemForm.shelf_position} onChange={e => setItemForm(f => ({ ...f, shelf_position: e.target.value }))} style={inputStyle} placeholder="e.g. Top shelf" /></label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ ...labelStyle, flex: 1 }}>Quantity<input type="number" min={1} value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} style={inputStyle} /></label>
              <label style={{ ...labelStyle, flex: 1 }}>Condition<select value={itemForm.condition} onChange={e => setItemForm(f => ({ ...f, condition: e.target.value }))} style={inputStyle}>{CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={() => setShowItemModal(false)} style={btnSecondary}>Cancel</button>
            <button onClick={saveItem} disabled={saving || !itemForm.name.trim()} style={{ ...btnPrimary, opacity: saving || !itemForm.name.trim() ? 0.6 : 1 }}>{saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </Modal>
      )}

      {/* Checkout Modal */}
      {showCoModal && coTarget && (
        <Modal onClose={() => setShowCoModal(false)}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Check Out</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{coTarget.name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={labelStyle}>Borrower Name *<input value={coForm.borrower_name} onChange={e => setCoForm(f => ({ ...f, borrower_name: e.target.value }))} style={inputStyle} placeholder="Who is taking this?" autoFocus /></label>
            <label style={labelStyle}>Event / Purpose<input value={coForm.event_name} onChange={e => setCoForm(f => ({ ...f, event_name: e.target.value }))} style={inputStyle} placeholder="Event or reason" /></label>
            <label style={labelStyle}>Expected Return<input type="date" value={coForm.expected_return} onChange={e => setCoForm(f => ({ ...f, expected_return: e.target.value }))} style={inputStyle} /></label>
            <label style={labelStyle}>Notes<textarea value={coForm.notes} onChange={e => setCoForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: 56, resize: 'vertical' }} /></label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={() => setShowCoModal(false)} style={btnSecondary}>Cancel</button>
            <button onClick={submitCheckout} disabled={saving || !coForm.borrower_name.trim()} style={{ ...btnPrimary, opacity: saving || !coForm.borrower_name.trim() ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Check Out'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OrgPill({ label, color, active, onClick }) {
  return <button onClick={onClick} style={{ padding: '4px 13px', borderRadius: 20, border: active ? `2px solid ${color}` : '2px solid var(--border)', background: active ? color + '22' : 'white', color: active ? color : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>;
}

function ItemCard({ item, org, isAdmin, onEdit, onDelete, onFlag, onCheckout, onReturn }) {
  const activeCheckouts = item.active_checkouts || [];
  const isCheckedOut = activeCheckouts.length > 0;
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: item.flagged ? '1.5px solid var(--warning)' : '1px solid var(--border)', padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>{item.name}</span>
            {org && <span style={{ padding: '2px 9px', borderRadius: 20, background: org.color + '20', color: org.color, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{org.name}</span>}
            {item.flagged && <span style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.68rem', fontWeight: 700 }}>⚑ Flagged</span>}
          </div>
          {item.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 6, lineHeight: 1.4 }}>{item.description}</p>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {(item.zone || item.shelf_position) && <span>{[item.zone, item.shelf_position].filter(Boolean).join(' · ')}</span>}
            <span>Qty: <strong style={{ color: 'var(--text-primary)' }}>{item.quantity}</strong></span>
            <span style={{ color: CONDITION_COLOR[item.condition], fontWeight: 500 }}>{item.condition.charAt(0).toUpperCase()+item.condition.slice(1)}</span>
          </div>
          {activeCheckouts.map(co => (
            <div key={co.id} style={{ marginTop: 10, padding: '7px 12px', background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>Out to <strong>{co.borrower_name}</strong>{co.event_name ? ` · ${co.event_name}` : ''}{co.expected_return ? ` · Due ${new Date(co.expected_return).toLocaleDateString()}` : ''}</span>
              <button onClick={() => onReturn(co.id)} style={{ padding: '3px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning)', background: 'white', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Mark Returned</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isCheckedOut && <button onClick={onCheckout} style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'white', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>Check Out</button>}
          <button onClick={onEdit} style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>Edit</button>
          {isAdmin && <>
            <button onClick={onFlag} style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: item.flagged ? '1px solid var(--warning)' : '1px solid var(--border)', background: item.flagged ? 'var(--warning-light)' : 'white', color: item.flagged ? 'var(--warning)' : 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer' }}>⚑</button>
            <button onClick={onDelete} style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-light)', background: 'white', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer' }}>✕</button>
          </>}
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(45,74,62,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>{children}</div>
    </div>
  );
}
