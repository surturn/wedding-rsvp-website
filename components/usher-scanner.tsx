'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Status enum to manage the complex UI states
type ScannerState = 'IDLE' | 'SCANNING' | 'LOADING' | 'CONFIRM' | 'ERROR';

interface GuestData {
  Id: string;
  Name: string;
  GuestCount: number;
  Phone: string;
  CheckedIn: boolean;
}

export default function UsherScanner() {
  const [uiState, setUiState] = useState<ScannerState>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  
  // Reference to store the scanner instance for manual cleanup
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Read webhooks from environment variables
  const LOOKUP_WEBHOOK = process.env.NEXT_PUBLIC_N8N_LOOKUP_WEBHOOK || '';
  const CHECKIN_WEBHOOK = process.env.NEXT_PUBLIC_N8N_CHECKIN_WEBHOOK || '';

  // ------------------------------------------------------------------
  // Camera Initialization & Cleanup
  // ------------------------------------------------------------------
  const startScanner = () => {
    setUiState('SCANNING');
    
    // Slight delay to ensure the DOM div 'reader' is mounted
    setTimeout(() => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          'reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  // Cleanup on unmount to prevent the camera light from staying on
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // ------------------------------------------------------------------
  // Lookup Logic
  // ------------------------------------------------------------------
  const onScanSuccess = async (decodedText: string) => {
    // 1. Immediately stop the camera
    stopScanner();
    setUiState('LOADING');
    setGuestData(null);
    setErrorMsg('');

    // 2. Clean the scanned string
    const cleanToken = decodedText.trim();

    try {
      // 3. Fetch guest details
      const response = await fetch(`${LOOKUP_WEBHOOK}?token=${cleanToken}`);
      
      if (!response.ok) {
        throw new Error('Guest not found');
      }

      const data = await response.json();

      // 4. Handle Already Checked In
      if (data.CheckedIn) {
        setErrorMsg(`${data.Name} was already checked in.`);
        setUiState('ERROR');
        return;
      }

      // 5. Success -> Hold State
      setGuestData({
        Id: data.Id,
        Name: data.Name,
        GuestCount: data.GuestCount,
        Phone: data.Phone,
        CheckedIn: data.CheckedIn,
      });
      setUiState('CONFIRM');

    } catch (error) {
      setErrorMsg('Invalid QR Code or Guest not found.');
      setUiState('ERROR');
    }
  };

  const onScanFailure = (error: any) => {
    // html5-qrcode continuously throws errors when no QR is in frame.
    // We ignore these to prevent console/UI spam.
  };

  // ------------------------------------------------------------------
  // Check-In Logic
  // ------------------------------------------------------------------
  const handleConfirmCheckIn = async () => {
    if (!guestData) return;
    
    setUiState('LOADING');

    try {
      const response = await fetch(CHECKIN_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestData.Id }),
      });

      if (!response.ok) throw new Error('Failed to check in');

      alert(`✅ Successfully checked in ${guestData.Name}!`);
      resetToIdle();

    } catch (error) {
      setErrorMsg('Failed to process check-in. Please try again.');
      setUiState('ERROR');
    }
  };

  const resetToIdle = () => {
    stopScanner();
    setGuestData(null);
    setErrorMsg('');
    setUiState('IDLE');
  };

  // ------------------------------------------------------------------
  // Render Helpers
  // ------------------------------------------------------------------
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col justify-center">
      
      {/* --- IDLE STATE --- */}
      {uiState === 'IDLE' && (
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Usher Portal</h2>
          <button
            onClick={startScanner}
            className="w-full py-16 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-400 rounded-xl text-blue-600 font-semibold text-lg transition-colors flex flex-col items-center gap-3"
          >
            <span className="text-4xl">📷</span>
            Tap to Scan QR
          </button>
        </div>
      )}

      {/* --- SCANNING STATE --- */}
      {uiState === 'SCANNING' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border-2 border-gray-200">
             <div id="reader" className="w-full"></div>
          </div>
          <button 
            onClick={resetToIdle}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* --- LOADING STATE --- */}
      {uiState === 'LOADING' && (
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">Looking up guest details...</p>
        </div>
      )}

      {/* --- ERROR STATE --- */}
      {uiState === 'ERROR' && (
        <div className="text-center py-8 px-4 bg-red-50 rounded-xl space-y-6 border border-red-100">
          <div className="text-4xl">⚠️</div>
          <p className="text-lg font-semibold text-red-700">{errorMsg}</p>
          <button 
            onClick={resetToIdle}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* --- CONFIRMATION CARD (HOLD STATE) --- */}
      {uiState === 'CONFIRM' && guestData && (
        <div className="space-y-6 bg-green-50/50 p-6 rounded-xl border border-green-100">
          <div className="text-center space-y-2 border-b border-green-200/60 pb-6">
            <p className="text-sm text-green-700 uppercase tracking-wider font-semibold">Guest Found</p>
            <h2 className="text-3xl font-bold text-gray-900">{guestData.Name}</h2>
            <p className="text-gray-500 font-medium">📞 {guestData.Phone}</p>
          </div>

          <div className="text-center py-4 bg-white rounded-lg shadow-sm border border-green-50">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Guests Admitted</p>
            <p className="text-6xl font-black text-green-600">{guestData.GuestCount}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={resetToIdle}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmCheckIn}
              className="flex-[2] py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-600/20 text-lg flex items-center justify-center gap-2"
            >
              ✅ Confirm Check-In
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
