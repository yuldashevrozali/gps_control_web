// components/AgentModal.tsx
'use client';

import { Agent } from '../lib/types'; // Turlarni import qiling

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentData?: Agent;
}

const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return "No data";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, agentData }) => {
  if (!isOpen || !agentData) return null;

  return (
    <div className="agent-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <div className="agent-modal-content">
        <span className="close-modal" onClick={onClose}>&times;</span>
        <div id="agentModalContent">
          <div className="modal-header">
            <h2>{agentData.full_name || "Agent"}</h2>
          </div>
          <div className="modal-body">
            <div className="agent-info">
              <p><strong>ID:</strong> {agentData.id || "Unknown"}</p>
              <p><strong>Phone:</strong> {agentData.phone_number || "Unknown"}</p>
              <p><strong>Status:</strong> <span className={`status ${agentData.is_working_status ? "active" : "inactive"}`}>
                {agentData.is_working_status ? "Active" : "Inactive"}
              </span></p>
              <p><strong>Last update:</strong> {formatTimestamp(agentData.current_location?.timestamp)}</p>
              <p><strong>Current Location:</strong>
                {agentData.current_location
                  ? `${agentData.current_location.lat?.toFixed(6) || "N/A"}, ${agentData.current_location.lon?.toFixed(6) || "N/A"}`
                  : "No location data"}
              </p>
            </div>

            <div className="contracts-section">
              <h3>Contracts ({agentData.contracts?.length || 0})</h3>
              {agentData.contracts?.length ? (
                <div className="contracts-list">
                  {agentData.contracts.map((contract, index) => (
                    <div className="contract-item" key={index}>
                      <div className="contract-header">
                        <h4>Contract #{contract.contract_number || "N/A"}</h4>
                        <span className={`contract-status ${contract.status ? "active" : "inactive"}`}>
                          {contract.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="contract-details">
                        <p><strong>Client:</strong> {contract.client?.full_name || "Unknown"}</p>
                        <p><strong>Phone:</strong> {contract.client?.phone_number || "Unknown"}</p>
                        <p><strong>Company:</strong> {contract.company?.name || "Unknown"}</p>
                        <p><strong>Due Date:</strong> {contract.due_date || "N/A"}</p>
                        <p><strong>End Date:</strong> {contract.end_date || "N/A"}</p>

                        <div className="financial-info">
                          <p><strong>Debt:</strong> {contract.debt_1c?.toLocaleString() || "0"} UZS</p>
                          <p><strong>Total Debt:</strong> {contract.total_debt_1c?.toLocaleString() || "0"} UZS</p>
                          <p><strong>Monthly Payment:</strong> {contract.mounthly_payment_1c?.toLocaleString() || "0"} UZS</p>
                          <p><strong>Total Due:</strong> {contract.total_due?.toLocaleString() || "0"} UZS</p>
                          <p><strong>Remaining:</strong> {contract.remaining?.toLocaleString() || "0"} UZS</p>
                        </div>

                        {contract.client?.static_locations?.length ? (
                          <div className="client-locations">
                            <h5>Client Locations ({contract.client.static_locations.length})</h5>
                            {contract.client.static_locations.map((location, locIndex) => (
                              <div className="location-item" key={locIndex}>
                                <p><strong>Type:</strong> {location.address_type || "N/A"}</p>
                                <p><strong>Name:</strong> {location.name || "N/A"}</p>
                                <p><strong>Coordinates:</strong> {location.lat?.toFixed(6) || "N/A"}, {location.lon?.toFixed(6) || "N/A"}</p>
                                
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No location data for this client</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No contracts found for this agent</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentModal;