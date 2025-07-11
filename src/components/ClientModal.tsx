// components/ClientModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Client, ClientLocation } from '../lib/types'; // Turlarni import qiling

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: {
    client: Client;
    location: ClientLocation;
  };
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, clientData }) => {
  if (!isOpen || !clientData) return null;

  // Random placeholder image for demonstration
  const randomImageUrl = `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`;

  return (
    <div className="agent-modal" style={{ display: isOpen ? 'block' : 'none' }}> {/* agent-modal classini qayta ishlatdik */}
      <div className="agent-modal-content">
        <span className="close-modal" onClick={onClose}>&times;</span>
        <div className="custom-popup">
          <div className="popup-header">
            <h6>{clientData.client.full_name || "Client Details"}</h6>
            <span className="close-btn" onClick={onClose}>
              <i className="material-symbols-rounded">close</i>
            </span>
          </div>

          <div className="info">
            <div className="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#2563EB" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.06-.21c1.12.45 2.33.69 3.53.69a1 1 0 011 1V20a1 1 0 01-1 1C10.29 21 3 13.71 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.24 2.41.69 3.53a1 1 0 01-.21 1.06l-2.36 2.2z"/>
              </svg>
            </div>
            <div>
              <p className="label">Phone</p>
              <p className="text">{clientData.client.phone_number || "Unknown"}</p>
            </div>
          </div>

          <div className="info">
            <div className="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#10B981" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <p className="label">Location</p>
              <p className="text">{clientData.location?.address_type || "N/A"}</p>
            </div>
          </div>

          <div className="location-photo-container">
            <img src={randomImageUrl} alt="Location photo" className="location-photo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;