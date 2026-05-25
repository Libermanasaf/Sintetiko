import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BellRing, Check, X, AlertTriangle, Send, RefreshCw, Smartphone, Globe2, Shield, Bug,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { pushSupported } from '@/lib/push';
import { VAPID_PUBLIC_KEY } from '@/lib/vapidPublic';
import { PageHeader } from '@/components/ui/lux';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

const TONES = {
  emerald: {
    bg: 'bg-emerald-500/15', ring: 'ring-emerald-400/40',
    icon: 'text-emerald-300', mark: 'text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-500/15', ring: 'ring-amber-400/40',
    icon: 'text-amber-300', mark: 'text-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/15', ring: 'ring-rose-400/40',
    icon: 'text-rose-300', mark: 'text-rose-400',
  },
};

function StatusRow({ icon: Icon, label, ok, hint, warn }) {
  const t = ok ? TONES.emerald : warn ? TONES.amber : TONES.rose;
  const Mark = ok ? Check : warn ? AlertTriangle : X;
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/70 ring-1 ring-white/8">
      <div className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ring-1 ${t.bg} ${t.ring}`}>
        <Icon className={`w-5 h-5 ${t.icon}`} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-sm">{label}</span>
          <Mark className={`w-4 h-4 shrink-0 ${t.mark}`} strokeWidth={3} />
        </div>
        {hint && <p className="text-ink-3 text-xs font-medium mt-1 break-all">{hint}</p>}
      </div>
    </div>
  );
}

export default function PushDiagnostics() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState('default');
  const [browserSub, setBrowserSub] = useState(null);
  const [dbSub, setDbSub] = useState(null);
  const [tableExists, setTableExists] = useState(null);  // null | true | false
  const [vapidConfigured, setVapidConfigured] = useState(true);
  const [busy, setBusy] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [debugLog, setDebugLog] = useState([]);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  const log = (msg) => setDebugLog((l) => [...l, `${new Date().toLocaleTimeString('he-IL')} · ${msg}`]);

  const refresh = useCallback(async () => {
    setSupported(pushSupported());
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      !!window.navigator.standalone
    );
    setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

    // VAPID public key check (always true now — it's hardcoded in the source)
    setVapidConfigured(!!VAPID_PUBLIC_KEY);

    // Browser-level subscription
    if (pushSupported()) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setBrowserSub(sub);

        // Look up the same subscription in the DB
        if (sub && supabase) {
          const { data, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('endpoint', sub.endpoint)
            .maybeSingle();
          if (error && /does not exist|schema cache/i.test(error.message)) {
            setTableExists(false);
          } else {
            setTableExists(true);
            setDbSub(data || null);
          }
        } else if (supabase) {
          // Probe table existence even without a browser sub
          const { error } = await supabase.from('push_subscriptions').select('endpoint').limit(1);
          setTableExists(!(error && /does not exist|schema cache/i.test(error.message)));
        }
      } catch (e) {
        console.warn('refresh failed', e);
      }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEnable = async () => {
    setBusy('subscribe');
    setLastError(null);
    setDebugLog([]);
    try {
      log('checking push support...');
      if (!pushSupported() || !VAPID_PUBLIC_KEY) {
        throw new Error(!VAPID_PUBLIC_KEY ? 'VITE_VAPID_PUBLIC_KEY is empty in this build' : 'Push not supported by this browser');
      }
      log('requesting permission...');
      const perm = await Notification.requestPermission();
      log(`permission = ${perm}`);
      if (perm !== 'granted') throw new Error(`permission denied (${perm})`);

      log('waiting for service worker...');
      const reg = await navigator.serviceWorker.ready;
      log(`SW scope: ${reg.scope}`);

      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        log('found existing subscription, unsubscribing first (key may be stale)');
        await sub.unsubscribe();
      }

      log('calling pushManager.subscribe()...');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      log(`subscribed, endpoint = ...${sub.endpoint.slice(-30)}`);

      log('upserting to Supabase...');
      const payload = sub.toJSON();
      const { error: upErr } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            endpoint: payload.endpoint,
            subscription: payload,
            user_email: user?.email || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
      if (upErr) throw new Error(`DB upsert: ${upErr.message}`);
      log('✓ saved in DB');
      toast.success('הרשמה הצליחה!');
    } catch (e) {
      log(`✗ ${e.message}`);
      setLastError(e.message);
      toast.error('נכשל: ' + e.message);
    }
    setBusy(null);
    await refresh();
  };

  const handleTest = async () => {
    setBusy('test');
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: user?.email,
          title: '🔔 התראת בדיקה',
          body: 'אם אתה רואה את ההתראה הזו — המערכת עובדת מצוין!',
          url: '/',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(`שגיאת שרת ${res.status}: ${data?.error || res.statusText}`);
      } else if (data?.sent > 0) {
        toast.success(`✓ נשלח ל-${data.sent} מכשיר`);
      } else if (data?.failed > 0) {
        toast.error(`כשל בשליחה ל-${data.failed} מנוי — ייתכן שהמנוי פג תוקף`);
      } else {
        toast.error('אין מנויים פעילים — לחץ "אפשר התראות" קודם');
      }
    } catch (e) {
      toast.error('שגיאה: ' + e.message);
    }
    setBusy(null);
  };

  const allGood = supported && permission === 'granted' && browserSub && dbSub && tableExists && vapidConfigured && (!isIos || isStandalone);

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader
        icon={BellRing}
        title="אבחון התראות"
        subtitle={allGood ? 'הכל מחובר — push יעבוד' : 'בדוק מה תקין ומה לא'}
        accent={allGood ? 'emerald' : 'amber'}
      />

      <div className="p-4 space-y-5">
        {/* Status grid */}
        <div className="space-y-2.5">
          <StatusRow
            icon={Globe2}
            label="הדפדפן תומך ב-Push API"
            ok={supported}
            hint={supported ? 'Service Worker + PushManager + Notification API זמינים' : 'הדפדפן הזה לא תומך — נסה Chrome/Safari/Edge'}
          />
          <StatusRow
            icon={Smartphone}
            label={isIos ? 'אפליקציה מותקנת ממסך הבית' : 'מותקנת כ-PWA (אופציונלי באנדרואיד)'}
            ok={isStandalone}
            warn={!isStandalone && !isIos}
            hint={
              isStandalone
                ? 'נפתח כ-PWA — מצוין'
                : isIos
                  ? '⚠️ ב-iOS חובה: שתף → "הוסף למסך הבית", ואז פתח מהאייקון. בלי זה אין push.'
                  : 'באנדרואיד עובד גם בכרום רגיל אבל יותר אמין כ-PWA'
            }
          />
          <StatusRow
            icon={Shield}
            label="הרשאת התראות"
            ok={permission === 'granted'}
            warn={permission === 'default'}
            hint={
              permission === 'granted' ? 'אישרת לקבל התראות' :
              permission === 'denied' ? 'דחית קודם — צריך להפעיל מהגדרות הדפדפן/iOS' :
              'עדיין לא נשאלת — לחץ "אפשר התראות" למטה'
            }
          />
          <StatusRow
            icon={BellRing}
            label="מנוי קיים בדפדפן"
            ok={!!browserSub}
            hint={browserSub ? `endpoint: ...${browserSub.endpoint.slice(-40)}` : 'אין subscription בדפדפן עדיין'}
          />
          <StatusRow
            icon={Check}
            label="המנוי נשמר ב-DB"
            ok={tableExists !== false && !!dbSub}
            warn={tableExists === false}
            hint={
              tableExists === false ? '⛔ טבלת push_subscriptions לא קיימת — הרץ את המיגרציה ב-Supabase' :
              dbSub ? `נשמר עם user_email = ${dbSub.user_email || '(ריק)'}` :
              'יש מנוי בדפדפן אבל לא ב-Supabase — לחץ "אפשר התראות" שוב'
            }
          />
          <StatusRow
            icon={Shield}
            label="VAPID public key מוגדר ב-build"
            ok={vapidConfigured}
            hint={
              vapidConfigured
                ? `${VAPID_PUBLIC_KEY.slice(0, 18)}…${VAPID_PUBLIC_KEY.slice(-10)} (${VAPID_PUBLIC_KEY.length} chars)`
                : 'חסר VITE_VAPID_PUBLIC_KEY — בדוק Vercel env'
            }
          />
        </div>

        {/* Last error banner */}
        {lastError && (
          <div className="rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/40 p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="min-w-0 flex-1">
                <p className="text-rose-200 font-black text-sm">השגיאה האחרונה</p>
                <p className="text-rose-100 text-xs font-medium mt-1 break-words" dir="ltr">{lastError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug log */}
        {debugLog.length > 0 && (
          <div className="rounded-2xl bg-slate-950 ring-1 ring-white/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-4 h-4 text-amber-400" />
              <p className="text-amber-300 font-black text-xs">לוג ניפוי שגיאות</p>
            </div>
            <div className="space-y-1 font-mono text-[0.65rem] text-slate-300" dir="ltr">
              {debugLog.map((line, i) => (
                <div key={i} className="break-all">{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={handleEnable}
            disabled={busy !== null || !supported || !vapidConfigured}
            className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] disabled:opacity-50 transition-all touch-manipulation"
          >
            {busy === 'subscribe' ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <BellRing className="w-5 h-5" strokeWidth={2.4} />
            )}
            אפשר התראות
          </button>

          <button
            onClick={handleTest}
            disabled={busy !== null || !browserSub}
            className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-slate-800/80 ring-1 ring-white/10 text-white font-black text-sm active:scale-[0.98] disabled:opacity-40 transition-all touch-manipulation"
          >
            {busy === 'test' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            שלח התראת בדיקה אליי
          </button>

          <button
            onClick={refresh}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-slate-400 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-bold">רענן סטטוס</span>
          </button>
        </div>

        {/* Quick reference */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-slate-900/50 ring-1 ring-white/5 p-4 text-xs"
        >
          <p className="text-amber-300 font-black mb-2">📋 צ׳קליסט מהיר</p>
          <ol className="space-y-1.5 text-slate-300 font-medium" style={{ listStyleType: 'decimal', listStylePosition: 'inside' }}>
            <li>הרץ את <bdi dir="ltr" className="text-amber-200 font-bold">create-push-subscriptions-table.sql</bdi> ב-Supabase</li>
            <li>הגדר <bdi dir="ltr" className="text-amber-200 font-bold">VAPID_PRIVATE_KEY</bdi> ב-Vercel Environment Variables</li>
            <li>{isIos ? 'התקן את האפליקציה למסך הבית (שתף → הוסף למסך הבית) ופתח מהאייקון' : 'התקנת PWA מומלצת אבל לא חובה'}</li>
            <li>לחץ "אפשר התראות" כדי לקבל את כל הסטטוסים ירוקים</li>
            <li>לחץ "שלח התראת בדיקה" — אמור לקפוץ push תוך שניות</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
