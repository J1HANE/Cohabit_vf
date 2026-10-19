import React, { useState, useEffect, useRef } from 'react';
import './SpinWheel.css';

const SpinWheel = ({ members, onClose, onSelect }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const wheelRef = useRef(null);

  const spinWheel = () => {
    if (isSpinning || members.length === 0) return;

    setIsSpinning(true);
    setSelectedMember(null);

    // Calculate random rotation (at least 3 full spins + random position)
    const spins = 3;
    const segmentAngle = 360 / members.length;
    const randomIndex = Math.floor(Math.random() * members.length);
    const randomOffset = Math.random() * (segmentAngle - 10) + 5; // Add some randomness within segment
    const targetRotation = rotation + (spins * 360) + (randomIndex * segmentAngle) + randomOffset;

    setRotation(targetRotation);

    // Determine winner after spin
    setTimeout(() => {
      const totalRotation = targetRotation % 360;
      const effectiveRotation = (360 - totalRotation) % 360;
      const winnerIndex = Math.floor(effectiveRotation / segmentAngle);
      setSelectedMember(members[winnerIndex]);
      setIsSpinning(false);
    }, 4000); // 4 seconds spin
  };

  const handleConfirm = () => {
    if (selectedMember) {
      onSelect(selectedMember);
    }
    onClose();
  };

  const handleSpinAgain = () => {
    setSelectedMember(null);
    spinWheel();
  };

  if (members.length === 0) {
    return (
      <div className="spinwheel-overlay">
        <div className="spinwheel-modal">
          <div className="spinwheel-header">
            <h2>Spin the Wheel</h2>
            <button className="spinwheel-close" onClick={onClose}>×</button>
          </div>
          <div className="spinwheel-empty">
            <p>No household members available</p>
            <button className="app-button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const segmentAngle = 360 / members.length;
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];

  // Create conic gradient for the wheel
  const gradientStops = members.map((member, index) => {
    const startAngle = (index * segmentAngle) / 360;
    const endAngle = ((index + 1) * segmentAngle) / 360;
    return `${colors[index % colors.length]} ${startAngle * 100}% ${endAngle * 100}%`;
  }).join(', ');

  // Calculate text position for each segment
  const getTextPosition = (index) => {
    const angle = (index * segmentAngle + segmentAngle / 2) * (Math.PI / 180);
    const radius = 95; // Distance from center (adjusted for better positioning)
    const x = 50 + radius * Math.cos(angle - Math.PI / 2);
    const y = 50 + radius * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Dynamic font size based on number of members
  const fontSize = members.length > 8 ? '11px' : members.length > 5 ? '13px' : '14px';

  return (
    <div className="spinwheel-overlay">
      <div className="spinwheel-modal">
        <div className="spinwheel-header">
          <h2>🎰 Spin the Wheel</h2>
          <button className="spinwheel-close" onClick={onClose}>×</button>
        </div>

        <div className="spinwheel-content">
          <div className="wheel-container">
            <div className="wheel-pointer">▼</div>
            <div
              ref={wheelRef}
              className="wheel"
              style={{
                background: `conic-gradient(${gradientStops})`,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
              }}
            >
              {/* Segment dividers */}
              {members.map((_, index) => (
                <div
                  key={`divider-${index}`}
                  className="wheel-divider"
                  style={{
                    transform: `rotate(${index * segmentAngle}deg)`
                  }}
                />
              ))}

              <div className="wheel-center"></div>
              {members.map((member, index) => {
                const pos = getTextPosition(index);
                const textRotation = index * segmentAngle + segmentAngle / 2 + 90;
                return (
                  <div
                    key={member.id}
                    className="wheel-segment"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${textRotation}deg)`
                    }}
                  >
                    <span className="wheel-segment-text" style={{ fontSize }}>
                      {member.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="spinwheel-controls">
            {!selectedMember && !isSpinning && (
              <button className="spinwheel-spin-btn" onClick={spinWheel}>
                🎲 SPIN THE WHEEL
              </button>
            )}

            {isSpinning && (
              <div className="spinwheel-spinning">
                <div className="spinner"></div>
                <p>Spinning...</p>
              </div>
            )}

            {selectedMember && !isSpinning && (
              <div className="spinwheel-result">
                <div className="result-avatar">
                  <div
                    className="avatar-circle"
                    style={{ backgroundColor: selectedMember.color }}
                  >
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3>{selectedMember.name}</h3>
                <p>is selected for this task!</p>
                <div className="result-actions">
                  <button className="app-button primary" onClick={handleConfirm}>
                    ✓ Confirm Selection
                  </button>
                  <button className="app-button ghost" onClick={handleSpinAgain}>
                    🔄 Spin Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
