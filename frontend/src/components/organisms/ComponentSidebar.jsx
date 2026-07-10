import { useState } from "react";

export const paletteItems = [
  // Active
  { type: "battery",     label: "Battery (Voltage Source)",  emoji: "⎓",  voltage: 9, sourceType: "dc", category: "active",  badge: "Aktif" },
  { type: "diode",       label: "Diode",            emoji: "▶️", category: "active",  badge: "Aktif" },
  { type: "transistor",  label: "Transistor",       emoji: "⬛", transistorType: "npn", category: "active",  badge: "Aktif" },
  { type: "led",         label: "LED",              emoji: "💡", color: "Red", category: "active",  badge: "Aktif" },
  // Passive
  { type: "resistor",     label: "Resistor",        emoji: "⚡", resistance: 220, category: "passive", badge: "Pasif" },
  { type: "potentiometer",label: "Potentiometer",   emoji: "🎛️", wiperPercent: 50, maxResistance: 10000, category: "passive", badge: "Pasif" },
  { type: "capacitor",    label: "Capacitor",       emoji: "🔵", capacitance: 100, capType: "elco", category: "passive", badge: "Pasif" },
  { type: "inductor",     label: "Inductor",        emoji: "➰", inductance: 100, category: "passive", badge: "Pasif" },
  // Output
  { type: "motor",   label: "DC Motor",  emoji: "⚙️", ratedVoltage: 5, category: "output" },
  { type: "buzzer",  label: "Buzzer",    emoji: "🔔", minVoltage: 3,   category: "output" },
  // Control & Instruments
  { type: "switch",       label: "Switch",      emoji: "🔘", state: "open", category: "control" },
  { type: "multimeter",   label: "Multimeter",  emoji: "📟", mode: "V",    category: "control" },
  { type: "oscilloscope", label: "Oscilloscope",emoji: "📉",               category: "control" },
  // Wiring
  { type: "junction", label: "Junction", emoji: "⭕", category: "wiring" },
];

export const paletteCategoryKeys = ["active", "passive", "output", "control", "wiring"];

export function getSidebarIcon(type) {
  const style = { width: '22px', height: '22px', display: 'block', color: 'currentColor' };
  switch(type) {
    case 'battery':
      return (
        <svg viewBox="0 0 48 48" style={style}>
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="none"/>
          <line x1="24" y1="12" x2="24" y2="22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="19" y1="17" x2="29" y2="17" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="19" y1="31" x2="29" y2="31" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      );
    case 'resistor':
      return <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6', lineHeight: '22px' }}>Ω</div>;
    case 'capacitor':
      return (
        <svg viewBox="0 0 40 24" style={{...style, color: '#3b82f6'}}>
          <line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="3"/>
          <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="3"/>
          <line x1="24" y1="4" x2="24" y2="20" stroke="currentColor" strokeWidth="3"/>
          <line x1="24" y1="12" x2="40" y2="12" stroke="currentColor" strokeWidth="3"/>
        </svg>
      );
    case 'transistor':
      return (
        <svg viewBox="0 0 40 40" style={style}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3"/>
          <line x1="0" y1="20" x2="12" y2="20" stroke="currentColor" strokeWidth="3"/>
          <line x1="12" y1="10" x2="12" y2="30" stroke="currentColor" strokeWidth="4"/>
          <line x1="12" y1="13" x2="26" y2="3" stroke="currentColor" strokeWidth="3"/>
          <line x1="12" y1="27" x2="26" y2="37" stroke="currentColor" strokeWidth="3"/>
        </svg>
      );
    case 'inductor':
      return (
        <svg viewBox="0 0 50 20" style={{...style, width: '30px', color: '#f59e0b'}}>
          <path d="M 0 10 L 10 10 C 10 0, 20 0, 20 10 C 20 0, 30 0, 30 10 C 30 0, 40 0, 40 10 L 50 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      );
    case 'switch':
      return (
        <svg viewBox="0 0 72 36" style={{...style, width: '28px', color: '#10b981'}}>
          <line x1="0" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="3"/>
          <circle cx="16" cy="18" r="4" fill="currentColor"/>
          <line x1="56" y1="18" x2="72" y2="18" stroke="currentColor" strokeWidth="3"/>
          <circle cx="56" cy="18" r="4" fill="currentColor"/>
          <line x1="16" y1="18" x2="56" y2="18" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      );
    case 'led':
      return <span style={{ fontSize: '18px' }}>💡</span>;
    case 'diode':
      return <span style={{ fontSize: '18px' }}>▶️</span>;
    case 'potentiometer':
      return <span style={{ fontSize: '18px' }}>🎛️</span>;
    case 'motor':
      return <span style={{ fontSize: '18px' }}>⚙️</span>;
    case 'buzzer':
      return <span style={{ fontSize: '18px' }}>🔔</span>;
    case 'junction':
      return <span style={{ fontSize: '18px' }}>⭕</span>;
    case 'multimeter':
      return <span style={{ fontSize: '18px' }}>📟</span>;
    case 'oscilloscope':
      return <span style={{ fontSize: '18px' }}>📉</span>;
    default:
      return <span style={{ fontSize: '18px' }}>🧩</span>;
  }
}

export function ComponentSidebar({
  t,
  sidebarOpen,
  setSidebarOpen,
  highlightSidebar,
  catLabels,
  collapsedCats,
  toggleCategory,
  onDragStart
}) {
  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"} ${highlightSidebar ? "highlight-pulse" : ""}`}>
      <div className="sidebar-header">
        {sidebarOpen && <span className="sidebar-title">{t.components}</span>}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </div>
      {sidebarOpen && (
        <div className="sidebar-body">
          {paletteCategoryKeys.map((catKey) => {
            const catLabel = catLabels[catKey];
            const items = paletteItems.filter((p) => p.category === catKey);
            if (items.length === 0) return null;
            const isCollapsed = collapsedCats[catKey];
            return (
              <div key={catKey} className="sidebar-category">
                <button
                  className="category-header"
                  onClick={() => toggleCategory(catKey)}
                >
                  <span className="category-label">{catLabel}</span>
                  <span className={`category-chevron ${isCollapsed ? "collapsed" : ""}`}>
                    ▾
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="category-items">
                    {items.map((item, i) => (
                      <div
                        key={`${catKey}-${i}`}
                        className="sidebar-item"
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                      >
                        <span className="sidebar-item-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getSidebarIcon(item.type)}
                        </span>
                        <span className="sidebar-item-label">{item.label}</span>
                        {item.badge && (
                          <span className={`component-badge badge-${item.badge === 'Aktif' ? 'active' : 'passive'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
