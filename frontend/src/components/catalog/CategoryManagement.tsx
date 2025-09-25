import React, { useEffect, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { serviceCategoryAPI } from '../../services/api';

const CategoryManagement: React.FC = () => {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await serviceCategoryAPI.getCategories();
      setCategories(res?.data || res || []);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAddOrUpdate = async () => {
    if (!name.trim()) return addNotification({ type: 'error', title: 'Validation', message: 'Name required' });
    try {
    // Normalize types: trim and dedupe
    const normalized = types.map(t => t.trim()).filter(Boolean);
    const deduped = Array.from(new Set(normalized));
    const payload = { name: name.trim(), types: deduped };
    if (editingId) {
      await serviceCategoryAPI.updateCategory(editingId, payload);
      addNotification({ type: 'success', title: 'Updated', message: 'Category updated' });
    } else {
      await serviceCategoryAPI.createCategory(payload);
      addNotification({ type: 'success', title: 'Added', message: 'Category added' });
    }
    setName(''); setTypeInput(''); setTypes([]); setEditingId(null);
    fetchCategories();
    try { window.dispatchEvent(new CustomEvent('serviceCategoriesUpdated')); } catch(e) { /* ignore */ }
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to add' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await serviceCategoryAPI.deleteCategory(id);
      addNotification({ type: 'success', title: 'Deleted', message: 'Category deleted' });
  fetchCategories();
  try { window.dispatchEvent(new CustomEvent('serviceCategoriesUpdated')); } catch(e) { /* ignore */ }
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to delete' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Category Management</h1>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-4 gap-3 max-w-xl">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Service name" className="p-2 border" />
          <input value={typeInput} onChange={e=>setTypeInput(e.target.value)} placeholder="Add type and press Enter (comma to add multiple)" className="p-2 border"
            onKeyDown={(e)=>{
              if(e.key === 'Enter'){
                e.preventDefault();
                const raw = typeInput;
                if(!raw) return;
                const parts = raw.split(',').map(s=>s.trim()).filter(Boolean);
                if(parts.length){ setTypes(prev=>[...prev, ...parts]); setTypeInput(''); }
              }
            }}
            onPaste={(e)=>{
              const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
              if(paste && paste.includes(',')){
                e.preventDefault();
                const parts = paste.split(',').map(s=>s.trim()).filter(Boolean);
                if(parts.length) setTypes(prev=>[...prev, ...parts]);
              }
            }}
          />
            <div className="col-span-2 flex items-center space-x-2">
            <div className="flex flex-wrap gap-2">
              {types.map((t,i)=>(
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-2">
                  {t}
                  <button onClick={()=>setTypes(prev=>prev.filter(x=>x!==t))} className="text-red-500">x</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleAddOrUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">{editingId ? 'Update' : 'Add'}</button>
              {editingId && <button onClick={()=>{ setEditingId(null); setName(''); setTypes([]); setTypeInput(''); }} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>}
              <button onClick={()=> setShowBulk(prev=>!prev)} className="px-3 py-2 bg-gray-100 rounded">{showBulk ? 'Close Bulk' : 'Add Many'}</button>
            </div>
          </div>
          {showBulk && (
            <div className="col-span-4 mt-2">
              <textarea value={bulkInput} onChange={e=>setBulkInput(e.target.value)} placeholder="Paste types here (one per line or comma separated)" className="w-full p-2 border rounded h-28" />
              <div className="mt-2 flex space-x-2">
                <button onClick={()=>{
                  if(!bulkInput) return;
                  const parts = bulkInput.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
                  if(parts.length) setTypes(prev=>[...prev, ...parts]);
                  setBulkInput(''); setShowBulk(false);
                }} className="px-3 py-2 bg-blue-600 text-white rounded">Add All</button>
                <button onClick={()=>{ setBulkInput(''); setShowBulk(false); }} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading ? <div>Loading...</div> : (
            <ul className="space-y-2">
              {categories.map(c => (
                <li key={c._id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-gray-500">{(c.types && c.types.join(', ')) || c.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      // populate form for editing
                      setEditingId(c._id);
                      setName(c.name || '');
                      setTypes(Array.isArray(c.types) ? c.types : (c.type ? [c.type] : []));
                      setTypeInput('');
                    }} className="text-blue-600">Edit</button>
                    <button onClick={() => handleDelete(c._id)} className="text-red-500">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
