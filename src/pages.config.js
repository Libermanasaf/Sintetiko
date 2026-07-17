/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
// Pages are lazy-loaded (React.lazy) so each screen ships as its own chunk and
// the initial bundle stays small — critical for mobile load time. The Layout
// stays static: it renders on every page anyway.
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const CreateRound = lazy(() => import('./pages/CreateRound'));
const GameHistory = lazy(() => import('./pages/GameHistory'));
const Home = lazy(() => import('./pages/Home'));
const Players = lazy(() => import('./pages/Players'));
const Podium = lazy(() => import('./pages/Podium'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Payments = lazy(() => import('./pages/Payments'));
const Backup = lazy(() => import('./pages/Backup'));
const PlayerHome = lazy(() => import('./pages/PlayerHome'));
const UserApprovals = lazy(() => import('./pages/UserApprovals'));
const RatePlayers = lazy(() => import('./pages/RatePlayers'));
const MatchDay = lazy(() => import('./pages/MatchDay'));
const InstallApp = lazy(() => import('./pages/InstallApp'));
const RegisteredUsers = lazy(() => import('./pages/RegisteredUsers'));
const PushDiagnostics = lazy(() => import('./pages/PushDiagnostics'));
const SendNotification = lazy(() => import('./pages/SendNotification'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Lists = lazy(() => import('./pages/Lists'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DayListSunday = lazy(() => import('./pages/DayListSunday'));
const DayListWednesday = lazy(() => import('./pages/DayListWednesday'));
const DayListThursday = lazy(() => import('./pages/DayListThursday'));
const LoginActivity = lazy(() => import('./pages/LoginActivity'));
const Professionals = lazy(() => import('./pages/Professionals'));
const Debts = lazy(() => import('./pages/Debts'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ComplaintsBox = lazy(() => import('./pages/ComplaintsBox'));
const HallOfFame = lazy(() => import('./pages/HallOfFame'));
const ShamingCorner = lazy(() => import('./pages/ShamingCorner'));

export const PAGES = {
    "CreateRound": CreateRound,
    "GameHistory": GameHistory,
    "Home": Home,
    "Players": Players,
    "Podium": Podium,
    "Statistics": Statistics,
    "Payments": Payments,
    "Backup": Backup,
    "PlayerHome": PlayerHome,
    "UserApprovals": UserApprovals,
    "RatePlayers": RatePlayers,
    "MatchDay": MatchDay,
    "InstallApp": InstallApp,
    "RegisteredUsers": RegisteredUsers,
    "PushDiagnostics": PushDiagnostics,
    "SendNotification": SendNotification,
    "Notifications": Notifications,
    "Lists": Lists,
    "SignupPage": SignupPage,
    "DayListSunday": DayListSunday,
    "DayListWednesday": DayListWednesday,
    "DayListThursday": DayListThursday,
    "LoginActivity": LoginActivity,
    "Professionals": Professionals,
    "Debts": Debts,
    "ResetPassword": ResetPassword,
    "ComplaintsBox": ComplaintsBox,
    "HallOfFame": HallOfFame,
    "ShamingCorner": ShamingCorner,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};