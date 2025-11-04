import { useState, useEffect, useRef } from 'react';

import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';

import { ControllerConnector } from '@cartridge/connector';
import { WALLET_TEXT } from '@/lib/uiText';

export function ConnectWallet() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const controller = connectors[0] as ControllerConnector

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Handle connect
  const handleConnect = () => {
    connect({ connector: controller });
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Open Controller profile
  const handleOpenProfile = async () => {
    try {
      const ctrl = controller.controller;
      if (ctrl) {
        await ctrl.openProfile();
      }
    } catch (error) {
      console.error('Failed to open profile:', error);
    }
    setIsDropdownOpen(false);
  };

  // Open Controller settings
  const handleOpenSettings = async () => {
    try {
      const ctrl = controller.controller;
      if (ctrl) {
        ctrl.openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
    setIsDropdownOpen(false);
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // If not connected, show connect button
  if (!address) {
    return (
      <button
        onClick={handleConnect}
        className="
          w-full px-6 py-3 font-semibold
          transition-all duration-200
          bg-ronin-primary hover:bg-red-600 text-white border-2 border-ronin-secondary/30 hover:border-ronin-secondary
          md:px-8 md:py-3 text-sm md:text-base
          relative
        "
      >
        <span className="relative z-10">{WALLET_TEXT.connect}</span>
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/50"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/50"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/50"></div>
      </button>
    );
  }

  // If connected, show address and dropdown
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="
          w-full py-4 px-6
          bg-ronin-dark hover:bg-ronin-light
          border-2 border-ronin-accent
          font-semibold
          text-ronin-secondary
          transition-all duration-300
          flex items-center justify-center gap-2
          relative
        "
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>{formatAddress(address)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="
          absolute right-0 mt-2 w-48 md:w-56
          bg-ronin-dark border-2 border-ronin-accent
          z-50
        ">
          <div className="py-1">
            {/* Profile Option */}
            <button
              onClick={handleOpenProfile}
              className="
                w-full px-4 py-3 text-left
                text-ronin-secondary hover:bg-ronin-light
                transition-colors duration-150
                flex items-center gap-3
                text-sm md:text-base
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {WALLET_TEXT.dropdown.profile}
            </button>

            {/* Settings Option */}
            <button
              onClick={handleOpenSettings}
              className="
                w-full px-4 py-3 text-left
                text-ronin-secondary hover:bg-ronin-light
                transition-colors duration-150
                flex items-center gap-3
                text-sm md:text-base
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {WALLET_TEXT.dropdown.settings}
            </button>

            {/* Divider */}
            <div className="border-t border-ronin-accent my-1" />

            {/* Disconnect Option */}
            <button
              onClick={handleDisconnect}
              className="
                w-full px-4 py-3 text-left
                text-ronin-primary hover:bg-red-900/20
                transition-colors duration-150
                flex items-center gap-3
                text-sm md:text-base
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {WALLET_TEXT.dropdown.disconnect}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
