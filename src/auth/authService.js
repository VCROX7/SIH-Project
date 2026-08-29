/**
 * SIH26024 — Authentication Service
 * FILE: src/auth/authService.js
 * 
 * PURPOSE: Clean auth abstraction providing signIn, signOut, getSession, 
 *          and getCurrentUser methods. Ready for future Supabase Auth integration.
 *          Currently provides deterministic demo accounts for SIH evaluation.
 */

'use strict';

var AuthService = (function() {
  
  // Pre-configured demo accounts for judges and evaluators
  var DEMO_USERS = {
    'officer@coalgov.in': {
      id: 'usr-001',
      name: 'Raj Kumar',
      email: 'officer@coalgov.in',
      role: 'officer',
      title: 'Mine Safety Officer · Shift A',
      avatar: 'RK',
      mineId: 'CCL-UNIT-04'
    },
    'manager@coalgov.in': {
      id: 'usr-002',
      name: 'Dr. A. K. Mishra',
      email: 'manager@coalgov.in',
      role: 'manager',
      title: 'Colliery General Manager · DGMS Authorized',
      avatar: 'AM',
      mineId: 'CCL-UNIT-04'
    },
    'auditor@coalgov.in': {
      id: 'usr-003',
      name: 'S. N. Sengupta',
      email: 'auditor@coalgov.in',
      role: 'auditor',
      title: 'DGMS Safety Inspector · Eastern Zone',
      avatar: 'SS',
      mineId: 'DGMS-EAST-ZONE'
    }
  };

  // State in-memory & persisted in localStorage for session preservation
  var STORAGE_KEY = 'coalgov_session';
  var currentUser = null;
  var listeners = [];

  function loadPersistedSession() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AuthService] Could not load persisted session', e);
    }
  }

  function notifyListeners(user) {
    listeners.forEach(function(fn) {
      try {
        fn(user);
      } catch (err) {
        console.error('[AuthService] Listener error', err);
      }
    });
  }

  loadPersistedSession();

  return {
    /**
     * Authenticate with email & password.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user: Object, error: string|null}>}
     */
    signIn: function(email, password) {
      return new Promise(function(resolve) {
        setTimeout(function() {
          var cleanEmail = (email || '').trim().toLowerCase();
          
          if (!cleanEmail) {
            resolve({ user: null, error: 'Email address is required.' });
            return;
          }
          
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleanEmail)) {
            resolve({ user: null, error: 'Please enter a valid email address.' });
            return;
          }
          
          if (!password || password.length < 4) {
            resolve({ user: null, error: 'Password is required (minimum 4 characters).' });
            return;
          }

          // Match against demo users or accept any valid email for demo testing
          var matchedUser = DEMO_USERS[cleanEmail];
          if (!matchedUser) {
            // Generate a demo user for write-in logins during review
            matchedUser = {
              id: 'usr-custom-' + Math.floor(Math.random() * 1000),
              name: cleanEmail.split('@')[0].toUpperCase(),
              email: cleanEmail,
              role: 'officer',
              title: 'Safety Field Inspector',
              avatar: cleanEmail.substring(0, 2).toUpperCase(),
              mineId: 'CCL-UNIT-04'
            };
          }

          currentUser = matchedUser;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
          } catch (e) {}

          notifyListeners(currentUser);
          resolve({ user: currentUser, error: null });
        }, 350); // Small realistic network latency
      });
    },

    /**
     * Terminate user session.
     * @returns {Promise<void>}
     */
    signOut: function() {
      return new Promise(function(resolve) {
        currentUser = null;
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        notifyListeners(null);
        resolve();
      });
    },

    /**
     * Get currently authenticated user object.
     * @returns {Object|null}
     */
    getCurrentUser: function() {
      return currentUser;
    },

    /**
     * Check if an active session exists.
     * @returns {boolean}
     */
    isAuthenticated: function() {
      return !!currentUser;
    },

    /**
     * Subscribe to authentication state changes.
     * @param {Function} callback 
     * @returns {Function} unsubscribe function
     */
    onAuthStateChanged: function(callback) {
      listeners.push(callback);
      callback(currentUser);
      return function unsubscribe() {
        listeners = listeners.filter(function(l) { return l !== callback; });
      };
    },

    /**
     * List of available demo accounts for judges
     */
    getDemoAccounts: function() {
      return Object.values(DEMO_USERS);
    }
  };

})();
