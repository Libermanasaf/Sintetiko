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
import CreateRound from './pages/CreateRound';
import GameHistory from './pages/GameHistory';
import Home from './pages/Home';
import Players from './pages/Players';
import Podium from './pages/Podium';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Backup from './pages/Backup';
import PlayerHome from './pages/PlayerHome';
import UserApprovals from './pages/UserApprovals';
import RatePlayers from './pages/RatePlayers';
import __Layout from './Layout.jsx';

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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};