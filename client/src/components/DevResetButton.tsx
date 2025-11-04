import { useDisconnect } from '@starknet-react/core';

export function DevResetButton() {
  const { disconnect } = useDisconnect();

  const handleReset = async () => {
    if (!window.confirm('🔥 NUCLEAR RESET 🔥\n\nThis will:\n- Clear ALL storage (localStorage, sessionStorage, IndexedDB)\n- Delete all caches\n- Unregister service workers\n- Disconnect wallet\n- Clear all cookies\n- Force reload\n\nContinue?')) {
      return;
    }

    try {
      console.log('🧹 Starting nuclear reset...');

      // 1. Disconnect wallet first
      console.log('📤 Disconnecting wallet...');
      await disconnect();

      // 2. Clear localStorage and sessionStorage
      console.log('🗑️ Clearing storage...');
      localStorage.clear();
      sessionStorage.clear();

      // 3. Delete ALL IndexedDB databases (this is where Controller stores data)
      console.log('💾 Deleting IndexedDB databases...');
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              console.log(`  Deleting database: ${db.name}`);
              return window.indexedDB.deleteDatabase(db.name);
            }
          })
        );
      }

      // 4. Unregister all service workers
      console.log('⚙️ Unregistering service workers...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            console.log(`  Unregistering: ${registration.scope}`);
            return registration.unregister();
          })
        );
      }

      // 5. Clear all Cache API caches
      console.log('🗂️ Clearing cache storage...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            console.log(`  Deleting cache: ${name}`);
            return caches.delete(name);
          })
        );
      }

      // 6. Clear cookies for this domain
      console.log('🍪 Clearing cookies...');
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });

      console.log('✅ Nuclear reset complete! Reloading...');

      // 7. Hard reload (bypasses cache)
      window.location.reload();

    } catch (error) {
      console.error('❌ Error during reset:', error);
      alert('Reset encountered an error. Check console. Will reload anyway.');
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleReset}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
      title="Development: Nuclear reset - clear ALL state"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>Reset</span>
    </button>
  );
}
