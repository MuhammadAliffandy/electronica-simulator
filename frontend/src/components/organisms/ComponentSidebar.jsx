import React from 'react';

export function ComponentSidebar({
  t,
  sidebarOpen,
  setSidebarOpen,
  catLabels,
  collapsedCats,
  toggleCategory,
  onDragStart
}) {
  const categories = [
    { key: "active", title: "SOURCES" },
    { key: "passive", title: "PASSIVES" },
    { key: "semiconductors", title: "SEMICONDUCTORS" },
    { key: "control", title: "TOOLS" },
  ];

  const vectorIcons = {
    battery: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6m-3-3h6M9 16h6"/></svg>,
    resistor: <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '18px' }}>Ω</span>,
    capacitor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h5m4 0h5M10 6v12M14 6v12"/></svg>,
    inductor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c0-2.2 1.8-4 4-4s4 1.8 4 4 1.8 4 4 4 4-1.8 4-4"/></svg>,
    potentiometer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l2-3 4 6 4-6 2 3h3M12 2v6l-2-2m4 0l-2 2"/></svg>,
    diode: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h4m8 0h4M8 7v10l8-5-8-5zM16 7v10"/></svg>,
    transistor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 4v16M8 8l4 4-4 4"/></svg>,
    led: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 14h2m6 0h2M8 9v10l6-5-6-5zM14 9v10M17 5l2-2M20 8l2-1"/></svg>,
    multimeter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v4H8zM8 16h1m3 0h1"/></svg>,
    oscilloscope: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M6 12c2 0 3-4 6-4s4 8 6 8"/></svg>,
    switch: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h4m10 0h2M8 12l6-4"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></svg>,
    buzzer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4L6 9H3v6h3l6 5V4z"/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M19 6c3 3 3 9 0 12"/></svg>,
    motor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9 15V9l3 3 3-3v6"/></svg>,
    junction: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>
  };

  const paletteItems = {
    active: [{ type: "battery", label: "DC Voltage Source" }],
    passive: [
      { type: "resistor", label: "Resistor" },
      { type: "capacitor", label: "Capacitor" },
      { type: "inductor", label: "Inductor" },
      { type: "potentiometer", label: "Potentiometer" }
    ],
    semiconductors: [
      { type: "diode", label: "Diode" },
      { type: "transistor", label: "BJT Transistor" },
      { type: "led", label: "LED" }
    ],
    control: [
      { type: "multimeter", label: "Multimeter" },
      { type: "oscilloscope", label: "Oscilloscope" },
      { type: "switch", label: "Switch" },
      { type: "buzzer", label: "Buzzer" },
      { type: "motor", label: "DC Motor" },
      { type: "junction", label: "Wire Junction" }
    ]
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Components</div>
      </div>

      <div className="sidebar-categories">
        {categories.map((cat) => (
          <div key={cat.key}>
            <div className="category-header" onClick={() => toggleCategory(cat.key)}>
              <span>{collapsedCats[cat.key] ? '▶' : '▼'}</span>
              {cat.title}
            </div>
            {!collapsedCats[cat.key] && (
              <div className="category-items">
                {paletteItems[cat.key].map(item => (
                  <div 
                    key={item.type}
                    className="palette-item"
                    onDragStart={(event) => onDragStart(event, item.type, item)}
                    draggable
                  >
                    <span className="palette-icon">{vectorIcons[item.type]}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
