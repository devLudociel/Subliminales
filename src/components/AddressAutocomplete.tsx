import { useState, useRef, useEffect } from 'react';

interface AddressSuggestion {
  label: string;
  street: string;
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
  // Build street: "Calle Mayantigo 4"
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  // Spain: county = provincia (Santa Cruz de Tenerife), city = municipio
  const province = p.county ?? p.state ?? '';
  const city     = p.city ?? p.town ?? p.village ?? p.municipality ?? p.county ?? '';
  const label    = p.formatted ?? p.address_line1 ?? street;

  return {
    label,
    street:   street || p.address_line1 || label,
    city,
    province,
    zip:      p.postcode ?? '',
  };
}

export default function AddressAutocomplete({
  value, onChange, onSelect, hasError, placeholder = 'Calle Ejemplo 123',
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

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
    if (!API_KEY) {
      console.warn('[Autocomplete] PUBLIC_GEOAPIFY_KEY no configurada');
      return;
    }
    if (text.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      // No "type" filter — returns streets, cities, amenities, all useful
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', text);
      url.searchParams.set('filter', 'countrycode:es');
      url.searchParams.set('limit', '6');
      url.searchParams.set('lang', 'es');
      url.searchParams.set('apiKey', API_KEY);

      const res  = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        console.error('[Autocomplete] Geoapify error:', data);
        setSuggestions([]);
        setOpen(false);
        return;
      }

      const results: AddressSuggestion[] = (data.features ?? []).map(parseFeature);

      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIdx(-1);
    } catch (err) {
      console.error('[Autocomplete] fetch error:', err);
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
        spellCheck={false}
      />

      {loading && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mid font-hand text-lg animate-pulse pointer-events-none">
          buscando…
        </span>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border-2 border-dark shadow-hard rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
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
        </ul>
      )}
    </div>
  );
}
