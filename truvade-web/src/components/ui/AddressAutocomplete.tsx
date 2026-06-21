"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { MapPin, Check, AlertCircle, Loader2 } from "lucide-react";

export interface SelectedPlace {
  placeId: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, place: SelectedPlace | null) => void;
  /**
   * Marks the current `value` as a previously-saved verified place so the
   * "Verified" indicator shows immediately and the consumer's Save button
   * stays enabled until the user actually edits it.
   */
  initiallySelected?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

// Photon, by Komoot — OpenStreetMap-powered geocoder. Free, no key, no quota.
// Docs: https://photon.komoot.io/
const PHOTON_URL = "https://photon.komoot.io/api/";

// Africa center, used to bias autocomplete results toward Africa.
const AFRICA_BIAS = { lat: 1.5, lon: 17 };

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 6;

interface PhotonProperties {
  osm_id?: number;
  osm_type?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  county?: string;
  district?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  type?: string;
  extent?: number[];
}

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

function formatPrimary(p: PhotonProperties): string {
  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
  return parts.join(", ");
}

function formatSecondary(p: PhotonProperties): string {
  const parts: string[] = [];
  if (p.city) parts.push(p.city);
  else if (p.district) parts.push(p.district);
  else if (p.county) parts.push(p.county);
  if (p.state && !parts.includes(p.state)) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.join(", ");
}

function formatFull(p: PhotonProperties): string {
  const primary = formatPrimary(p);
  const secondary = formatSecondary(p);
  if (primary && secondary) return `${primary}, ${secondary}`;
  return primary || secondary || p.name || "";
}

export function AddressAutocomplete({
  value,
  onChange,
  initiallySelected = false,
  label,
  placeholder = "Start typing an address…",
  disabled = false,
  error,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PhotonFeature[]>([]);
  const [selected, setSelected] = useState(initiallySelected);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  // Keep input synced when parent rewrites `value` (e.g. after save).
  useEffect(() => {
    setInputValue(value);
    if (value) setSelected(initiallySelected);
  }, [value, initiallySelected]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Cancel any in-flight request on unmount.
  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPredictions([]);
      setSearching(false);
      return;
    }
    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;
    setSearching(true);
    setFetchError("");
    try {
      const params = new URLSearchParams({
        q: query,
        limit: String(MAX_RESULTS),
        lang: "en",
        lat: String(AFRICA_BIAS.lat),
        lon: String(AFRICA_BIAS.lon),
      });
      const res = await fetch(`${PHOTON_URL}?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Photon ${res.status}`);
      const data = (await res.json()) as PhotonResponse;
      setPredictions(data.features ?? []);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setPredictions([]);
      setFetchError("Couldn't search addresses right now.");
    } finally {
      if (inFlightRef.current === controller) {
        setSearching(false);
        inFlightRef.current = null;
      }
    }
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInputValue(next);
    setSelected(false);
    onChange(next, null);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(next), DEBOUNCE_MS);
  };

  const handlePick = (feature: PhotonFeature) => {
    setOpen(false);
    const formatted = formatFull(feature.properties);
    const [lng, lat] = feature.geometry.coordinates;
    const picked: SelectedPlace = {
      placeId: `${feature.properties.osm_type ?? "?"}/${feature.properties.osm_id ?? ""}`,
      formattedAddress: formatted,
      city:
        feature.properties.city ||
        feature.properties.district ||
        feature.properties.county ||
        "",
      state: feature.properties.state || "",
      country: feature.properties.country || "",
      lat,
      lng,
    };
    setInputValue(formatted);
    setSelected(true);
    onChange(formatted, picked);
  };

  const displayError = useMemo(() => {
    if (error) return error;
    if (fetchError) return fetchError;
    return "";
  }, [error, fetchError]);

  const showHint =
    !selected && inputValue.trim().length > 0 && !displayError;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {searching ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : selected ? (
            <span title="Verified" className="flex items-center gap-1 text-emerald-700">
              <Check className="w-4 h-4" />
            </span>
          ) : null}
        </div>
      </div>

      {displayError && (
        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {!displayError && showHint && (
        <p className="mt-1.5 text-xs text-amber-700">
          Pick an address from the list to verify it.
        </p>
      )}

      {!displayError && selected && (
        <p className="mt-1.5 text-xs text-emerald-700">Verified address</p>
      )}

      {open && predictions.length > 0 && (
        <ul className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-72 overflow-auto">
          {predictions.map((feature, i) => {
            const primary = formatPrimary(feature.properties) || feature.properties.name || "";
            const secondary = formatSecondary(feature.properties);
            return (
              <li key={`${feature.properties.osm_type ?? "?"}-${feature.properties.osm_id ?? i}`}>
                <button
                  type="button"
                  onClick={() => handlePick(feature)}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-gray-500 truncate">{secondary}</p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
