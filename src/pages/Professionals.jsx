import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Professional, uploadFile } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Pencil, Trash2, Phone, X, Loader2, User, Instagram, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

// Original WhatsApp glyph (no icon-font), per the premium spec.
function WhatsAppIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

// digits-only phone -> wa.me (Israeli: drop leading 0, prefix 972)
function waLink(phone, name) {
  const digits = (phone || '').replace(/\D/g, '');
  const intl = digits.startsWith('0') ? '972' + digits.slice(1) : digits;
  const msg = encodeURIComponent(`היי ${name || ''}, הגעתי דרך אפליקציית סינתטיקו 👋`);
  return `https://wa.me/${intl}?text=${msg}`;
}
function igLink(handle) {
  if (!handle) return null;
  const h = handle.trim();
  if (h.startsWith('http')) return h;
  return `https://instagram.com/${h.replace(/^@/, '')}`;
}

export default function Professionals() {
  const { role, loginMode } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: pros = [], isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => Professional.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => (data.id ? Professional.update(data.id, data) : Professional.create(data)),
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

  return (
    <div className="pb-10">
      <PageHeader icon={Briefcase} title="בעלי המקצוע שלנו" subtitle="אנשי המקצוע של חברי הקבוצה" accent="amber" />

      <div className="p-4 space-y-5">
        {isAdmin && (
          <button
            onClick={() => setEditing({ name: '', profession: '', phone: '', description: '', instagram: '', image: '', gallery: [] })}
            className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-2xl st-foil font-black text-sm active:scale-[0.99] transition-transform touch-manipulation shadow-[0_10px_30px_-12px_rgba(250,204,21,0.6)]"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            הוסף איש מקצוע
          </button>
        )}

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}</div>
        ) : pros.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="אין עדיין בעלי מקצוע"
            hint={isAdmin ? 'לחץ "הוסף איש מקצוע" כדי לפרסם את הראשון.' : 'הרשימה תתעדכן בקרוב.'}
          />
        ) : (
          <div className="space-y-5">
            {pros.map((p, i) => (
              <ProCard
                key={p.id}
                pro={p}
                index={i}
                isAdmin={isAdmin}
                onEdit={() => setEditing(p)}
                onDelete={() => deleteMutation.mutate(p.id)}
              />
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

function ProCard({ pro, index, isAdmin, onEdit, onDelete }) {
  const gallery = Array.isArray(pro.gallery) ? pro.gallery.filter(Boolean) : [];
  const ig = igLink(pro.instagram);
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightbox, setLightbox] = useState(-1); // index of opened image, -1 = closed

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), type: 'spring', damping: 20, stiffness: 200 }}
      className="st-card overflow-hidden"
    >
      <div className="p-4">
        {/* Header row: avatar + name + profession chip */}
        <div className="flex items-start gap-3">
          {pro.image ? (
            <img src={pro.image} alt={pro.name} width="56" height="56" loading="lazy" decoding="async"
                 className="w-14 h-14 rounded-2xl object-cover ring-1 ring-[hsl(var(--st-gold)/0.4)] shrink-0" />
          ) : (
            <div className="grid place-items-center w-14 h-14 rounded-2xl st-foil text-xl font-black shrink-0 shadow-[0_6px_18px_-8px_rgba(250,204,21,0.7)]">
              {(pro.name?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-white text-lg leading-tight truncate">{pro.name}</h3>
            <span className="inline-flex items-center mt-1 text-[0.7rem] font-black px-2.5 py-1 rounded-full st-foil shadow-[0_4px_12px_-6px_rgba(250,204,21,0.8)]">
              {pro.profession}
            </span>
          </div>

          {isAdmin && (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={onEdit} aria-label="ערוך"
                className="grid place-items-center w-9 h-9 rounded-xl bg-slate-800/80 ring-1 ring-white/10 text-sky-300 active:scale-95 transition-transform touch-manipulation">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => (confirmDel ? onDelete() : setConfirmDel(true))} onBlur={() => setConfirmDel(false)}
                aria-label="מחק"
                className={`grid place-items-center min-w-9 h-9 px-2 rounded-xl ring-1 active:scale-95 transition-all touch-manipulation text-[0.7rem] font-black ${confirmDel ? 'bg-rose-500/30 ring-rose-400/60 text-rose-200' : 'bg-rose-500/15 ring-rose-500/30 text-rose-300'}`}>
                {confirmDel ? 'בטוח?' : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {pro.description && (
          <p className="text-ink-2 text-sm font-medium mt-3 leading-relaxed">{pro.description}</p>
        )}

        {/* Contact actions — compact, content-sized chips */}
        <div className="flex items-center flex-wrap gap-2 mt-4">
          {pro.phone && (
            <a href={waLink(pro.phone, pro.name)} target="_blank" rel="noopener noreferrer"
               aria-label={`וואטסאפ ל${pro.name}`}
               className="min-h-[46px] px-3.5 flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/15 ring-1 ring-[#25D366]/40 text-[#25D366] font-black text-sm active:scale-[0.98] transition-transform touch-manipulation">
              <WhatsAppIcon className="w-5 h-5" />
              וואטסאפ
            </a>
          )}
          {pro.phone && (
            <a href={`tel:${pro.phone}`} aria-label={`התקשר ל${pro.name}`}
               className="min-h-[46px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 ring-1 ring-white/10 text-slate-200 font-black text-sm active:scale-95 transition-transform touch-manipulation">
              <Phone className="w-4 h-4 text-emerald-300" strokeWidth={2.4} />
              <bdi dir="ltr" className="tnum">{pro.phone}</bdi>
            </a>
          )}
          {ig && (
            <a href={ig} target="_blank" rel="noopener noreferrer" aria-label={`אינסטגרם של ${pro.name}`}
               className="grid place-items-center w-[46px] h-[46px] shrink-0 rounded-xl text-white active:scale-95 transition-transform touch-manipulation"
               style={{ background: 'linear-gradient(135deg,#feda75,#d62976 45%,#962fbf 80%,#4f5bd5)' }}>
              <Instagram className="w-5 h-5" strokeWidth={2.2} />
            </a>
          )}
        </div>

        {/* Gallery — small fixed-size square thumbnails; tap to enlarge.
            Fixed width (not a stretching grid) so few photos stay small. */}
        {gallery.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {gallery.map((src, i) => (
              <button key={i} onClick={() => setLightbox(i)} aria-label={`הגדל תמונה ${i + 1}`}
                className="relative w-32 h-32 rounded-xl overflow-hidden ring-1 ring-white/10 bg-slate-950 active:scale-95 transition-transform touch-manipulation">
                <img src={src} alt={`${pro.name} — תמונה ${i + 1}`} loading="lazy" decoding="async"
                     className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox >= 0 && (
          <Lightbox images={gallery} start={lightbox} name={pro.name} onClose={() => setLightbox(-1)} />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// Fullscreen image viewer opened from a thumbnail. Tap backdrop or ✕ to close;
// arrows step through (RTL-aware). The image is contained, never cropped.
function Lightbox({ images, start, name, onClose }) {
  const [idx, setIdx] = useState(start);
  const go = (d) => setIdx((i) => Math.max(0, Math.min(images.length - 1, i + d)));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} aria-label="סגור"
        className="absolute top-4 left-4 grid place-items-center w-10 h-10 rounded-full bg-white/10 ring-1 ring-white/20 text-white active:scale-90 transition-transform">
        <X className="w-5 h-5" />
      </button>

      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        src={images[idx]} alt={`${name} — תמונה ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full object-contain rounded-xl"
      />

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} disabled={idx === 0} aria-label="הקודם"
            className="absolute top-1/2 -translate-y-1/2 right-3 grid place-items-center w-11 h-11 rounded-full bg-white/10 ring-1 ring-white/20 text-white active:scale-90 transition-transform disabled:opacity-30">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} disabled={idx === images.length - 1} aria-label="הבא"
            className="absolute top-1/2 -translate-y-1/2 left-3 grid place-items-center w-11 h-11 rounded-full bg-white/10 ring-1 ring-white/20 text-white active:scale-90 transition-transform disabled:opacity-30">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-1 rounded-full bg-white/10 text-white tnum">
            {idx + 1} / {images.length}
          </span>
        </>
      )}
    </motion.div>
  );
}

function ProfessionalForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...initial, gallery: Array.isArray(initial.gallery) ? initial.gallery : [] });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await uploadFile(file); set('image', file_url); }
    catch (err) { toast.error('העלאת תמונה נכשלה', { description: err.message }); }
    finally { setUploading(false); }
  };

  const handleGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) { const { file_url } = await uploadFile(f); urls.push(file_url); }
      set('gallery', [...(form.gallery || []), ...urls]);
    } catch (err) { toast.error('העלאת גלריה נכשלה', { description: err.message }); }
    finally { setUploading(false); }
  };

  const removeGalleryAt = (i) => set('gallery', form.gallery.filter((_, j) => j !== i));

  const submit = () => {
    if (!form.name?.trim() || !form.profession?.trim()) { toast.error('שם ומקצוע הם שדות חובה'); return; }
    onSave({
      ...form,
      name: form.name.trim(),
      profession: form.profession.trim(),
      phone: form.phone?.trim() || null,
      description: form.description?.trim() || null,
      instagram: form.instagram?.trim() || null,
      gallery: form.gallery || [],
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-slate-900 ring-1 ring-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-lg">{form.id ? 'עריכת איש מקצוע' : 'איש מקצוע חדש'}</h2>
          <button onClick={onCancel} aria-label="סגור" className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          {form.image ? (
            <img src={form.image} alt="" className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/10" />
          ) : (
            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-slate-800 ring-1 ring-white/10 text-slate-500"><User className="w-7 h-7" /></div>
          )}
          <label className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 text-sm font-bold cursor-pointer active:scale-[0.99] transition-transform">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'תמונת פרופיל'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
        </div>

        <Field label="שם *" value={form.name} onChange={(v) => set('name', v)} placeholder="לדוגמה: דוד כהן" />
        <Field label="מקצוע / תחום *" value={form.profession} onChange={(v) => set('profession', v)} placeholder="לדוגמה: חשמלאי" />
        <Field label="טלפון (לוואטסאפ והתקשרות)" value={form.phone} onChange={(v) => set('phone', v)} placeholder="050-0000000" dir="ltr" type="tel" />
        <Field label="אינסטגרם (שם משתמש או קישור)" value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="@username" dir="ltr" />
        <Field label="תיאור" value={form.description} onChange={(v) => set('description', v)} placeholder="כמה מילים על השירות" multiline />

        {/* Gallery */}
        <div>
          <label className="block text-xs font-black tracking-wide text-amber-300/85 mb-1.5">גלריית תמונות של העסק</label>
          <div className="flex flex-wrap gap-2">
            {(form.gallery || []).map((src, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover ring-1 ring-white/10" />
                <button onClick={() => removeGalleryAt(i)} aria-label="הסר תמונה"
                  className="absolute -top-1.5 -right-1.5 grid place-items-center w-6 h-6 rounded-full bg-rose-500 text-white ring-2 ring-slate-900 active:scale-90"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <label className="grid place-items-center w-20 h-20 rounded-xl bg-slate-800 ring-1 ring-dashed ring-white/20 text-slate-400 cursor-pointer active:scale-95 transition-transform">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGallery} disabled={uploading} />
            </label>
          </div>
        </div>

        <button onClick={submit} disabled={saving || uploading}
          className="w-full min-h-[52px] rounded-2xl st-foil font-black active:scale-[0.99] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2">
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
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all resize-none" />
      ) : (
        <input type={type || 'text'} dir={dir} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full min-h-[46px] px-3 rounded-xl bg-slate-800/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all" />
      )}
    </div>
  );
}
