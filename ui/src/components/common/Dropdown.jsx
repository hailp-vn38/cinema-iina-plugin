import { useState, useRef, useEffect } from "react";

export function Dropdown({ options, activeValue, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLabel =
    options.find((opt) => opt.value === activeValue)?.label || label;

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{activeLabel}</span>
        <span className="dropdown-icon">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === activeValue
                  ? "dropdown-item is-active"
                  : "dropdown-item"
              }
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              disabled={!option.enabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
