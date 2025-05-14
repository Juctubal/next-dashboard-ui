"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const initializeScanner = async () => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
          },
          false
        );

        await scanner.render(
          (decodedText) => {
            // Stop scanning after successful scan
            if (scanner) {
              scanner.clear();
            }
            setIsScanning(false);

            // Check if the scanned text is a valid gamefowl ID
            const gamefowlId = parseInt(decodedText);
            if (!isNaN(gamefowlId)) {
              // Navigate to the gamefowl list with the ID as search parameter
              router.push(`/list/gamefowls?search=${gamefowlId}`);
              onClose();
            } else {
              setError("Invalid QR code. Please scan a valid gamefowl ID.");
            }
          },
          (error) => {
            // Handle scan error
            console.warn(`QR Code scan error: ${error}`);
            setError("Failed to scan QR code. Please try again.");
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Error initializing QR scanner:", err);
        setError(
          "Failed to initialize camera. Please check your camera permissions."
        );
      }
    };

    initializeScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [router, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">
            Scan QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div id="qr-reader" className="w-full"></div>
        {error ? (
          <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Position the QR code within the frame to scan
          </p>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
