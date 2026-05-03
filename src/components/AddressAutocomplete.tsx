import { useState, useRef, useEffect } from 'react';

interface AddressSuggestion {
  label: string;       // display string for the dropdown
  street: string;      // street + number
  city: string;
  province: string;
  zip: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (s: AddressSuggestion) => void;
  hasError: boolean;
  placeholder?: string;
}

const API_KEY = import.meta.env.PUBLIC_GEOAPIFY_KEY as string | undefined;

function parseFeature(feature: any): AddressSuggestion {
  const p = feature.properties ?? {};
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  // In Spain: county = provincia, city = municipality
  const province = p.county ?? p.state ?? '';
  return {
    label:    feature.properties.formatted ?? street,
    street:   street || p.address_line1 || '',
    city:     p.city ?? p.town ?? p.village ?? p.municipality ?? '',
    province,
    zip:      p.postcode ?? '',
  };
}

export default function AddressAutocomplete({
  value, onChange, onSelect, hasError, placeholder = 'Calle Ejemplo 123',
}: Props) {
  const [suggestions, setSuggestions]   = useState<AddressSuggestion[]>([]);
  const [open, setOpen]                 = useState(false);
  const [loading, setLoading]           = useState(false);
  const [activeIdx, setActiveIdx]       = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchSuggestions(text: string) {
    if (!API_KEY || text.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', text);
      url.searchParams.set('filter', 'countrycode:es');
      url.searchParams.set('limit', '6');
      url.searchParams.set('lang', 'es');
      url.searchParams.set('type', 'street,amenity');
      url.searchParams.set('apiKey', API_KEY);

      const res  = await fetch(url.toString());
      const data = await res.json();

      const results: AddressSuggestion[] = (data.features ?? [])
        .map(parseFeature)
        .filter((s: AddressSuggestion) => s.street);

      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 320);
  }

  function handleSelect(s: AddressSuggestion) {
    onChange(s.street || s.label);
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const inputCls = `w-full px-5 py-4 font-hand text-xl border-2 ${
    hasError ? 'border-pink bg-pink/5' : 'border-dark bg-bg'
  } text-dark outline-none focus:bg-white focus:shadow-hard transition-all rounded-lg`;

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={inputCls}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {/* Loading indicator */}
      {loading && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mid font-hand text-lg animate-pulse">
          buscando…
        </span>
      )}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border-2 border-dark shadow-hard rounded-xl overflow-hidden max-h-72 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-5 py-3 cursor-pointer border-b border-dark/10 last:border-0 transition-colors ${
                i === activeIdx ? 'bg-pink/10' : 'hover:bg-bg'
              }`}
            >
              <p className="font-hand text-xl text-dark font-bold leading-tight">
                {s.street || s.label}
              </p>
              <p className="font-hand text-lg text-mid leading-tight">
                {[s.zip, s.city, s.province].filter(Boolean).join(' · ')}
              </p>
            </li>
          ))}
          {!API_KEY && (
            <li className="px-5 py-3 font-hand text-lg text-mid">
              Configura PUBLIC_GEOAPIFY_KEY para activar sugerencias
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
