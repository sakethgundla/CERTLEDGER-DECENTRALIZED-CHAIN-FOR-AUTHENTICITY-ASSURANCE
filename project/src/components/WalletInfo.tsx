import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

const WalletInfo = () => {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet:', error);
        }
      }
    };

    checkWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          setAddress(null);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  if (!address) {
    return null;
  }

  return (
    <div className="flex items-center px-3 py-2 rounded-md text-gray-700 bg-gray-100">
      <Wallet className="h-5 w-5 mr-2 text-blue-600" />
      <span className="font-mono text-sm">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
};

export default WalletInfo; 