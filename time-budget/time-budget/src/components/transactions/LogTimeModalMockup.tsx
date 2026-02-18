import React from "react";

// Mockup styles (inline for speed/prototype)
const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
};

const modalStyle = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "0.75rem",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const headerStyle = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: "#1f2937",
};

const tabsContainerStyle = {
    display: "flex",
    marginBottom: "1.5rem",
    borderBottom: "1px solid #e5e7eb",
};

const activeTabStyle = {
    padding: "0.75rem 1.5rem",
    borderBottom: "2px solid #3b82f6",
    color: "#3b82f6",
    fontWeight: 600,
    cursor: "pointer",
};

const inactiveTabStyle = {
    padding: "0.75rem 1.5rem",
    color: "#6b7280",
    cursor: "pointer",
};

const formGroupStyle = {
    marginBottom: "1rem",
};

const labelStyle = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "0.5rem",
};

const inputStyle = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    fontSize: "1rem",
};

const buttonGroupStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "2rem",
};

const cancelBtnStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    color: "#374151",
    fontWeight: 500,
    cursor: "pointer",
};

const saveBtnStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "0.375rem",
    color: "white",
    fontWeight: 500,
    cursor: "pointer",
};

export function LogTimeModalMockup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={headerStyle}>Log Time</h2>

                {/* Mock Tabs */}
                <div style={tabsContainerStyle}>
                    <div style={activeTabStyle}>Duration</div>
                    <div style={inactiveTabStyle}>Time Range</div>
                </div>

                {/* Mock Form */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Envelope</label>
                    <select style={inputStyle}>
                        <option>Work</option>
                        <option>Sleep</option>
                        <option>Leisure</option>
                    </select>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Date</label>
                    <input type="date" value={new Date().toISOString().split('T')[0]} style={inputStyle} readOnly />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ ...formGroupStyle, flex: 1 }}>
                        <label style={labelStyle}>Hours</label>
                        <input type="number" placeholder="0.00" style={inputStyle} />
                    </div>
                    {/* This would show if Time Range tab was active */}
                    {/* 
          <div style={{...formGroupStyle, flex: 1}}>
             <label style={labelStyle}>Start</label>
             <input type="time" style={inputStyle} />
          </div>
          <div style={{...formGroupStyle, flex: 1}}>
             <label style={labelStyle}>End</label>
             <input type="time" style={inputStyle} />
          </div>
          */}
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Description (Optional)</label>
                    <textarea rows={3} style={inputStyle} placeholder="What did you do?"></textarea>
                </div>

                <div style={buttonGroupStyle}>
                    <button style={cancelBtnStyle} onClick={onClose}>Cancel</button>
                    <button style={saveBtnStyle}>Save Log</button>
                </div>
            </div>
        </div>
    );
}
