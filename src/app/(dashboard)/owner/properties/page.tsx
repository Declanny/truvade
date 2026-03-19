"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, X, Clock } from "lucide-react";
import { Card, CardBody, Button, Badge, Input, Modal, ModalFooter } from "@/components/ui";
import { formatCurrency } from "@/lib/types";
import { AMENITIES } from "@/lib/mock-data";
import type { PropertyStatus } from "@/lib/types";

interface PropertyItem {
  id: string;
  title: string;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  basePrice: number;
  status: PropertyStatus;
  image: string;
}

const mockProperties: PropertyItem[] = [
  { id: "p1", title: "Luxury 3-Bedroom Apartment with Ocean View", city: "Victoria Island", address: "12 Ahmadu Bello Way", bedrooms: 3, bathrooms: 2, basePrice: 85000, status: "ACTIVE", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400" },
  { id: "p2", title: "Cozy Studio in the Heart of Lekki Phase 1", city: "Lekki", address: "5 Admiralty Way", bedrooms: 1, bathrooms: 1, basePrice: 35000, status: "ACTIVE", image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400" },
  { id: "p3", title: "Modern 2-Bedroom Penthouse with Rooftop Pool", city: "Ikoyi", address: "27 Bourdillon Road", bedrooms: 2, bathrooms: 2, basePrice: 150000, status: "ACTIVE", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400" },
  { id: "p4", title: "Spacious Family Home in Maitama", city: "Abuja", address: "15 Lobito Crescent", bedrooms: 4, bathrooms: 3, basePrice: 120000, status: "DRAFT", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400" },
  { id: "p5", title: "Waterfront Apartment in Port Harcourt", city: "Port Harcourt", address: "3 Aba Road", bedrooms: 2, bathrooms: 2, basePrice: 55000, status: "PENDING", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400" },
  { id: "p6", title: "Elegant Serviced Apartment in Ikeja GRA", city: "Ikeja", address: "8 Joel Ogunnaike Street", bedrooms: 1, bathrooms: 1, basePrice: 45000, status: "ACTIVE", image: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400" },
];

const statusVariant: Record<PropertyStatus, "success" | "warning" | "gray" | "error" | "info"> = {
  ACTIVE: "success",
  PENDING: "warning",
  DRAFT: "gray",
  INACTIVE: "error",
  ARCHIVED: "gray",
};

const defaultForm = {
  title: "",
  description: "",
  city: "",
  address: "",
  bedrooms: 1,
  bathrooms: 1,
  basePrice: 0,
  amenities: [] as string[],
  imageUrls: [""],
};

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState(mockProperties);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const handleToggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAddImageUrl = () => {
    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ""] }));
  };

  const handleRemoveImageUrl = (index: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    setForm((prev) => {
      const urls = [...prev.imageUrls];
      urls[index] = value;
      return { ...prev, imageUrls: urls };
    });
  };

  const handleSubmit = () => {
    const newProp: PropertyItem = {
      id: `p${Date.now()}`,
      title: form.title,
      city: form.city,
      address: form.address,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      basePrice: form.basePrice,
      status: "PENDING",
      image: form.imageUrls[0] || "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400",
    };
    setProperties((prev) => [newProp, ...prev]);
    setForm(defaultForm);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4">My Properties</h1>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setForm(defaultForm);
            setShowModal(true);
          }}
        >
          Add Property
        </Button>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {properties.map((property, i) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="bordered" padding="none" hover>
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-44 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={statusVariant[property.status]} size="sm">
                      {property.status}
                    </Badge>
                  </div>
                  {property.status === "PENDING" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs font-medium py-1.5 px-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Under Review
                    </div>
                  )}
                </div>
                <CardBody className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{property.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{property.city} &middot; {property.address}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span>{property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""}</span>
                    <span className="text-gray-300">&middot;</span>
                    <span>{property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-[#0B3D2C]">
                      {formatCurrency(property.basePrice)}
                      <span className="text-sm font-normal text-gray-400">/night</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#0B3D2C] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Property Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Property" size="lg">
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          <Input
            label="Property Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Luxury 2-Bedroom Apartment"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="block w-full bg-white border border-gray-300 rounded-[var(--radius-button)] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-[#0B3D2C] focus:ring-[#0B3D2C] resize-none"
              placeholder="Describe the property..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="e.g. Victoria Island"
              fullWidth
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Street address"
              fullWidth
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Bedrooms"
              type="number"
              value={String(form.bedrooms)}
              onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))}
              fullWidth
            />
            <Input
              label="Bathrooms"
              type="number"
              value={String(form.bathrooms)}
              onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))}
              fullWidth
            />
            <Input
              label="Base Price (NGN)"
              type="number"
              value={String(form.basePrice)}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
              fullWidth
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleToggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    form.amenities.includes(amenity)
                      ? "bg-[#0B3D2C] text-white border-[#0B3D2C]"
                      : "bg-white text-gray-600 border-gray-300 hover:border-[#0B3D2C]"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
            <div className="space-y-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(e) => handleImageUrlChange(i, e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    fullWidth
                  />
                  {form.imageUrls.length > 1 && (
                    <button
                      onClick={() => handleRemoveImageUrl(i)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddImageUrl}
                className="text-sm text-[#0B3D2C] hover:underline font-medium"
              >
                + Add another image
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">Properties are reviewed before going live.</p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit for Review
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
