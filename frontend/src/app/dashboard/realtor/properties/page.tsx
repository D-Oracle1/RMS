'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Plus,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Upload,
  X,
  LandPlot,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';

const initialProperties = [
  { id: 1, title: 'Prime Land in Lekki Phase 1', address: '123 Admiralty Way, Lekki, Lagos', price: 285000000, beds: 0, baths: 0, sqft: 2500, status: 'FOR_SALE', type: 'LAND', views: 1250, daysListed: 14, images: [] as string[] },
  { id: 2, title: 'Luxury 4 Bedroom Duplex', address: '456 Banana Island, Ikoyi, Lagos', price: 750000000, beds: 4, baths: 5, sqft: 4500, status: 'FOR_SALE', type: 'RESIDENTIAL', views: 890, daysListed: 21, images: [] as string[] },
  { id: 3, title: 'Commercial Plot in Victoria Island', address: '789 Adeola Odeku, VI, Lagos', price: 420000000, beds: 0, baths: 0, sqft: 5200, status: 'PENDING', type: 'LAND', views: 2100, daysListed: 7, images: [] as string[] },
  { id: 4, title: '3 Bedroom Flat in Ikeja GRA', address: '321 Joel Ogunnaike St, Ikeja, Lagos', price: 48500000, beds: 3, baths: 3, sqft: 1800, status: 'SOLD', type: 'APARTMENT', views: 450, daysListed: 45, images: [] as string[] },
];

const propertyTypes = [
  { value: 'LAND', label: 'Land', icon: LandPlot },
  { value: 'RESIDENTIAL', label: 'Residential', icon: Home },
  { value: 'COMMERCIAL', label: 'Commercial', icon: Building2 },
  { value: 'APARTMENT', label: 'Apartment', icon: Building2 },
  { value: 'VILLA', label: 'Villa', icon: Home },
  { value: 'CONDO', label: 'Condo', icon: Building2 },
];

const stats = [
  { title: 'Active Listings', value: '12', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { title: 'Pending Sales', value: '3', icon: DollarSign, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { title: 'Sold This Month', value: '5', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
  { title: 'Total Views', value: '4.6K', icon: Eye, color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'FOR_SALE': return <Badge variant="success">For Sale</Badge>;
    case 'PENDING': return <Badge variant="outline" className="border-orange-500 text-orange-500">Pending</Badge>;
    case 'SOLD': return <Badge variant="secondary">Sold</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

const getPropertyIcon = (type: string) => {
  switch (type) {
    case 'LAND': return <LandPlot className="w-12 h-12 text-gray-400" />;
    case 'COMMERCIAL': return <Building2 className="w-12 h-12 text-gray-400" />;
    default: return <Home className="w-12 h-12 text-gray-400" />;
  }
};

export default function RealtorPropertiesPage() {
  const [properties, setProperties] = useState(initialProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProperty, setNewProperty] = useState({
    title: '',
    address: '',
    city: '',
    state: 'Lagos',
    price: '',
    pricePerSqm: '',
    numberOfPlots: '',
    type: 'LAND',
    beds: '',
    baths: '',
    sqft: '',
    description: '',
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || property.status === filterStatus;
    const matchesType = filterType === 'ALL' || property.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        setError('Please select valid image files (JPEG, PNG, GIF, or WebP)');
        return;
      }

      setImageFiles(prev => [...prev, file]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newProperty.title || !newProperty.address || !newProperty.price) {
      setError('Please fill in required fields (Title, Address, Price)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          imageUrls = await api.uploadFiles('/upload/property-images', imageFiles, 'images');
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
        }
      }

      // Calculate total price for land based on price per sqm
      let totalPrice = parseFloat(newProperty.price) || 0;
      const pricePerSqm = parseFloat(newProperty.pricePerSqm) || 0;
      const area = parseInt(newProperty.sqft) || 0;

      if (newProperty.type === 'LAND' && pricePerSqm > 0 && area > 0) {
        totalPrice = pricePerSqm * area;
      }

      const propertyData = {
        title: newProperty.title,
        address: newProperty.address,
        city: newProperty.city || 'Lagos',
        state: newProperty.state,
        country: 'Nigeria',
        price: totalPrice,
        pricePerSqm: newProperty.type === 'LAND' ? pricePerSqm : undefined,
        numberOfPlots: newProperty.type === 'LAND' ? (parseInt(newProperty.numberOfPlots) || 1) : undefined,
        type: newProperty.type,
        status: 'AVAILABLE',
        bedrooms: newProperty.type === 'LAND' ? 0 : parseInt(newProperty.beds) || 0,
        bathrooms: newProperty.type === 'LAND' ? 0 : parseInt(newProperty.baths) || 0,
        area: area,
        description: newProperty.description || '',
        images: imageUrls,
        isListed: true,
      };

      const createdProperty = await api.post<any>('/properties', propertyData);

      const property = {
        id: createdProperty.id,
        title: createdProperty.title,
        address: `${createdProperty.address}, ${createdProperty.city}, ${createdProperty.state}`,
        price: Number(createdProperty.price),
        beds: createdProperty.bedrooms || 0,
        baths: createdProperty.bathrooms || 0,
        sqft: createdProperty.area || 0,
        status: 'FOR_SALE',
        type: createdProperty.type,
        views: 0,
        daysListed: 0,
        images: createdProperty.images || imageUrls,
      };

      setProperties(prev => [property, ...prev]);
      setIsAddDialogOpen(false);
      setNewProperty({
        title: '',
        address: '',
        city: '',
        state: 'Lagos',
        price: '',
        pricePerSqm: '',
        numberOfPlots: '',
        type: 'LAND',
        beds: '',
        baths: '',
        sqft: '',
        description: '',
      });
      setUploadedImages([]);
      setImageFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLandProperty = newProperty.type === 'LAND';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Properties List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              My Properties
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="LAND">Land</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="APARTMENT">Apartment</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="FOR_SALE">For Sale</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
              </select>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPropertyIcon(property.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{property.title}</h3>
                          <Badge variant="outline" className="text-xs">{property.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {property.address}
                        </p>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    <p className="text-2xl font-bold text-primary mb-1">{formatCurrency(property.price)}</p>
                    {property.type === 'LAND' && property.sqft > 0 && (
                      <p className="text-sm text-green-600 mb-2">
                        {formatCurrency(property.price / property.sqft)}/sqm
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      {property.type !== 'LAND' && (
                        <>
                          <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.beds} beds</span>
                          <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.baths} baths</span>
                        </>
                      )}
                      <span className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.sqft} sqm</span>
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {property.views} views</span>
                      <span>Listed {property.daysListed} days ago</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Property Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Fill in the property details below. Land properties don't require bedroom/bathroom info.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {propertyTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewProperty(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      newProperty.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Title *</label>
              <Input
                placeholder="e.g., Prime Land in Lekki Phase 1"
                value={newProperty.title}
                onChange={(e) => setNewProperty(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address *</label>
                <Input
                  placeholder="Street address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  placeholder="e.g., Lekki"
                  value={newProperty.city}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newProperty.state}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, state: e.target.value }))}
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Kano">Kano</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Delta">Delta</option>
                  <option value="Anambra">Anambra</option>
                  <option value="Kaduna">Kaduna</option>
                </select>
              </div>
              {!isLandProperty ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (₦) *</label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000000"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Plots</label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={newProperty.numberOfPlots}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, numberOfPlots: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Land-specific pricing */}
            {isLandProperty && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-400">Price per sqm (₦) *</label>
                  <Input
                    type="number"
                    placeholder="e.g., 150000"
                    value={newProperty.pricePerSqm}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, pricePerSqm: e.target.value }))}
                    className="border-green-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-400">Total Value (₦)</label>
                  <div className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-md text-lg font-bold text-green-600">
                    {formatCurrency(
                      (parseFloat(newProperty.pricePerSqm) || 0) * (parseInt(newProperty.sqft) || 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-calculated from price/sqm × size</p>
                </div>
              </div>
            )}

            {/* Property Details */}
            <div className="grid grid-cols-3 gap-4">
              {!isLandProperty && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bedrooms</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProperty.beds}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, beds: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bathrooms</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProperty.baths}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, baths: e.target.value }))}
                    />
                  </div>
                </>
              )}
              <div className={`space-y-2 ${isLandProperty ? 'col-span-3' : ''}`}>
                <label className="text-sm font-medium">Size (sqm)</label>
                <Input
                  type="number"
                  placeholder="e.g., 500"
                  value={newProperty.sqft}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, sqft: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-20 resize-none text-sm"
                placeholder="Describe the property..."
                value={newProperty.description}
                onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property Images</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload images</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF up to 10MB each</p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
