import {
  Home, Users, BarChart3, Shuffle, History, Trophy,
  CreditCard, Shield, UserCheck, Star, Download, UsersRound,
  BellRing, Bell, Send, ClipboardList, ClipboardCheck, LogIn, Briefcase, Coins,
  MessageSquare, Crown, Settings,
} from 'lucide-react';

// Single source of truth for navigation + access control.
// `admin`/`player` flags drive BOTH the Sidebar menu and the RouteGuard in
// App.jsx — so a page is access-controlled the moment it's listed here, with
// no second list to keep in sync.
// `group` collapses the item under a section header in the ADMIN sidebar only
// (see adminGroups below); the player menu ignores it and stays flat.
export const menuItems = [
  { name: 'עמוד הבית', page: 'Home',         icon: Home,      admin: true },
  { name: 'עמוד הבית', page: 'PlayerHome',   icon: Home,      player: true },
  { name: 'הפודיום',    page: 'Podium',       icon: Trophy,    admin: true, player: true, group: 'club' },
  { name: 'היכל התהילה', page: 'HallOfFame',  icon: Crown,     admin: true, player: true, group: 'club' },
  { name: 'סגל שחקנים', page: 'Players',      icon: Users,     admin: true },
  { name: 'סטטיסטיקות', page: 'Statistics',   icon: BarChart3, admin: true, player: true, group: 'club' },
  { name: 'יצירת מחזור', page: 'CreateRound', icon: Shuffle,   admin: true },
  { name: 'היסטוריית משחקים', page: 'GameHistory', icon: History, admin: true, player: true, group: 'club' },
  { name: 'בעלי המקצוע שלנו', page: 'Professionals', icon: Briefcase, admin: true, player: true, group: 'club' },
  { name: 'דרג שחקנים', page: 'RatePlayers',  icon: Star,      admin: true, player: true, group: 'club' },
  { name: 'רשימות',      page: 'Lists',        icon: ClipboardList, admin: true },
  { name: 'תשלומים',    page: 'Payments',     icon: CreditCard, admin: true, group: 'money' },
  { name: 'חובות',       page: 'Debts',        icon: Coins,      admin: true, group: 'money' },
  { name: 'אישור משתמשים', page: 'UserApprovals', icon: UserCheck, admin: true, group: 'system' },
  { name: 'משתמשים רשומים', page: 'RegisteredUsers', icon: UsersRound, admin: true, group: 'system' },
  { name: 'כניסות למערכת', page: 'LoginActivity', icon: LogIn, admin: true, group: 'system' },
  { name: 'גיבוי ושחזור', page: 'Backup',     icon: Shield,    admin: true, group: 'system' },
  { name: 'שלח התראות',   page: 'SendNotification', icon: Send,     admin: true, group: 'system' },
  { name: 'אבחון התראות',  page: 'PushDiagnostics', icon: BellRing, admin: true, group: 'system' },
  { name: 'רישום',             page: 'SignupPage',    icon: ClipboardCheck, player: true, admin: true, group: 'system' },
  { name: 'רשימה יום ראשון',  page: 'DayListSunday',    icon: ClipboardList, player: true },
  { name: 'רשימה יום רביעי',  page: 'DayListWednesday', icon: ClipboardList, player: true },
  { name: 'רשימה יום חמישי',  page: 'DayListThursday',  icon: ClipboardList, player: true },
  { name: 'התראות',            page: 'Notifications', icon: Bell,     player: true },
  { name: 'תיבת התלונות',      page: 'ComplaintsBox', icon: MessageSquare, admin: true, player: true },
  { name: 'הורד את האפליקציה', page: 'InstallApp', icon: Download, admin: true, player: true, group: 'system' },
];

// Admin sidebar sections, in render order. Ungrouped admin items (the daily
// essentials) stay pinned above the sections.
export const adminGroups = [
  { key: 'club',   name: 'המועדון',       icon: Trophy },
  { key: 'money',  name: 'כספים',         icon: Coins },
  { key: 'system', name: 'ניהול המערכת', icon: Settings },
];

// Pages a RESTRICTED player may still open: personal area (player card) +
// signup + Professionals + the day lists (the day-list page itself only shows
// a roster the player appears in) + harmless utility pages. Everything else —
// Podium, MatchDay, history, stats, ratings, complaints — is blocked by the
// RouteGuard and hidden from the sidebar.
export const RESTRICTED_ALLOWED_PAGES = new Set([
  'PlayerHome', 'SignupPage', 'Professionals', 'Notifications', 'InstallApp',
  'DayListSunday', 'DayListWednesday', 'DayListThursday',
]);

// Pages reachable by a player (player flag set). Pages that exist in the router
// but aren't listed here at all (e.g. MatchDay) are treated as allowed-for-all,
// so internal navigation targets never get falsely blocked.
const listedPages = new Set(menuItems.map((i) => i.page));

// Returns true if the given role may open the given page key.
// role: 'admin' | 'player' | null
export function canAccessPage(pageKey, role) {
  const items = menuItems.filter((i) => i.page === pageKey);
  if (items.length === 0) return true; // not access-controlled (internal page)
  if (role === 'admin') return items.some((i) => i.admin);
  if (role === 'player') return items.some((i) => i.player);
  return false;
}

export { listedPages };
