import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  enabled: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  activeValue: string;
  onChange: (value: string) => void;
  label: string;
}

export function Dropdown({
  options,
  activeValue,
  onChange,
  label,
}: DropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      const target = event.target as Node | null;
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLabel =
    options.find((opt) => opt.value === activeValue)?.label || label;

  function toggleOpen(_: ReactMouseEvent<HTMLButtonElement>): void {
    setIsOpen((current) => !current);
  }

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button className="dropdown-trigger" onClick={toggleOpen} type="button">
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
