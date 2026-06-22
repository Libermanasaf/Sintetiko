import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Professional, uploadFile } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Pencil, Trash2, Phone, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function Professionals() {
  const { role, loginMode } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // {id?, name, profession, phone, description, image} | null

  const { data: pros = [], isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => Professional.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id ? Professional.update(data.id, data) : Professional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setEditing(null);
      toast.success('נשמר בהצלחה');
    },
    onError: (e) => toast.error('שמירה נכשלה', { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Professional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('נמחק');
    },
    onError: (e) => toast.error('מחיקה נכשלה', { description: e.message }),
  });

  const handleDelete = (p) => {
    if (window.confirm(`למחוק את "${p.name}"?`)) deleteMutation.mutate(p.id);
  };

  return (
    <div className="pb-10">
      <PageHeader
        icon={Briefcase}
        title="בעלי המקצוע שלנו"
        subtitle="אנשי המקצוע של חברי הקבוצה"
        accent="amber"
      />

      <div className="p-4 space-y-4">
        {isAdmin && (
          <button
            onClick={() => setEditing({ name: '', profession: '', phone: '', description: '', image: '' })}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-2xl st-foil font-black text-sm active:scale-[0.99] transition-transform touch-manipulation"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            הוסף איש מקצוע
          </button>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : pros.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="אין עדיין בעלי מקצוע"
            hint={isAdmin ? 'לחץ "הוסף איש מקצוע" כדי לפרסם את הראשון.' : 'הרשימה תתעדכן בקרוב.'}
          />
        ) : (
          <div className="space-y-3">
            {pros.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar / photo */}
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0" />
                  ) : (
                    <div className="grid place-items-center w-14 h-14 rounded-xl st-foil text-lg font-black shrink-0">
                      {(p.name?.[0] || '?').toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-base truncate">{p.name}</span>
                      <span className="text-[0.65rem] font-black px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300">
                        {p.profession}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-ink-2 text-sm font-medium mt-1.5 leading-snug">{p.description}</p>
                    )}
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-sm font-black text-emerald-300 active:scale-95 transition-transform"
                      >
                        <Phone className="w-4 h-4" strokeWidth={2.4} />
                        <bdi dir="ltr">{p.phone}</bdi>
                      </a>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditing(p)}
                        aria-label="ערוך"
                        className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 ring-1 ring-white/10 text-sky-300 active:scale-95 transition-transform touch-manipulation"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        aria-label="מחק"
                        className="grid place-items-center w-9 h-9 rounded-lg bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 active:scale-95 transition-transform touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ProfessionalForm
            initial={editing}
            saving={saveMutation.isPending}
            onCancel={() => setEditing(null)}
            onSave={(data) => saveMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfessionalForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      set('image', file_url);
    } catch (err) {
      toast.error('העלאת תמונה נכשלה', { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!form.name?.trim() || !form.profession?.trim()) {
      toast.error('שם ומקצוע הם שדות חובה');
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      profession: form.profession.trim(),
      phone: form.phone?.trim() || null,
      description: form.description?.trim() || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-slate-900 ring-1 ring-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-lg">{form.id ? 'עריכת איש מקצוע' : 'איש מקצוע חדש'}</h2>
          <button onClick={onCancel} aria-label="סגור" className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="flex items-center gap-3">
          {form.image ? (
            <img src={form.image} alt="" className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/10" />
          ) : (
            <div className="grid place-items-center w-16 h-16 rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-500">
              <User className="w-7 h-7" />
            </div>
          )}
          <label className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 text-sm font-bold cursor-pointer active:scale-[0.99] transition-transform">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'תמונה (אופציונלי)'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
          </label>
        </div>

        <Field label="שם *" value={form.name} onChange={(v) => set('name', v)} placeholder="לדוגמה: דוד כהן" />
        <Field label="מקצוע / תחום *" value={form.profession} onChange={(v) => set('profession', v)} placeholder="לדוגמה: חשמלאי" />
        <Field label="טלפון" value={form.phone} onChange={(v) => set('phone', v)} placeholder="050-0000000" dir="ltr" type="tel" />
        <Field label="תיאור" value={form.description} onChange={(v) => set('description', v)} placeholder="כמה מילים על השירות" multiline />

        <button
          onClick={submit}
          disabled={saving || uploading}
          className="w-full min-h-[50px] rounded-2xl st-foil font-black active:scale-[0.99] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {form.id ? 'שמור שינויים' : 'פרסם'}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, multiline, dir, type }) {
  return (
    <div>
      <label className="block text-xs font-black tracking-wide text-amber-300/85 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all resize-none"
        />
      ) : (
        <input
          type={type || 'text'}
          dir={dir}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[46px] px-3 rounded-xl bg-slate-800/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all"
        />
      )}
    </div>
  );
}
