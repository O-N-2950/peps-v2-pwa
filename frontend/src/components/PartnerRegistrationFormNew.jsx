/**
 * Formulaire d'inscription PARTENAIRE (Commerce/Association/Artisan)
 * 6 étapes : Établissement → Contact → Adresse → Privilège → Logo → Validation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
    Briefcase, User, MapPin, Gift, Image as ImageIcon, CheckSquare, 
    Loader2, ArrowLeft, ArrowRight, Lightbulb, UploadCloud, Trash2, 
    Mail, Phone, Calendar, Building, Tag, FileText, Lock
} from 'lucide-react';

// --- Constantes ---
const COLORS = {
    TURQUOISE: '#2A9D8F',
    CORAIL: '#E76F51',
    BG_LIGHT: '#F4F4F4',
    TEXT_DARK: '#333333',
};

const ESTABLISHMENT_TYPES = [
    { value: 'commerce', label: 'Commerce' },
    { value: 'association', label: 'Association' },
    { value: 'artisan', label: 'Artisan' }
];

// --- Composant de Base pour l'Input ---
const InputField = ({ label, icon: Icon, error, ...props }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />}
            <input
                {...props}
                className={`w-full p-3 ${Icon ? 'pl-10' : 'pl-3'} border rounded-lg focus:ring-2 transition-all ${
                    error ? 'border-corail ring-corail/30' : 'border-gray-300 focus:border-turquoise focus:ring-turquoise/30'
                }`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-corail">{error}</p>}
    </div>
);

const TextAreaField = ({ label, icon: Icon, error, ...props }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />}
            <textarea
                {...props}
                className={`w-full p-3 ${Icon ? 'pl-10' : 'pl-3'} border rounded-lg focus:ring-2 transition-all resize-none ${
                    error ? 'border-corail ring-corail/30' : 'border-gray-300 focus:border-turquoise focus:ring-turquoise/30'
                }`}
                rows={4}
            />
        </div>
        {error && <p className="mt-1 text-xs text-corail">{error}</p>}
    </div>
);

// --- Composant d'Upload de Logo ---
const LogoUpload = ({ control, errors, watch, setValue }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const logoUrl = watch('logo_url');

    const handleFileChange = async (e, onChange) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (file.size > 2 * 1024 * 1024) {
            alert('Le fichier est trop volumineux. Maximum 2MB.');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Format non supporté. Utilisez JPG, PNG ou WebP.');
            return;
        }

        // Preview local
        setPreviewUrl(URL.createObjectURL(file));

        // Upload immédiat au backend
        setIsUploading(true);
        const formData = new FormData();
        formData.append('logo', file);

        try {
            const response = await axios.post('/api/upload/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Stocker l'URL retournée par le backend
            setValue('logo_url', response.data.url, { shouldValidate: true });
            onChange(response.data.url);
        } catch (error) {
            console.error('Erreur upload logo:', error);
            alert('Erreur lors de l\'upload du logo. Réessayez.');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = (onChange) => {
        setPreviewUrl(null);
        setValue('logo_url', '', { shouldValidate: true });
        onChange('');
    };

    return (
        <Controller
            name="logo_url"
            control={control}
            rules={{ required: "Le logo est obligatoire" }}
            render={({ field: { onChange, value } }) => (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo de l'établissement *
                    </label>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                            errors.logo_url ? 'border-corail bg-corail/5' : 'border-gray-300 hover:border-turquoise'
                        }`}
                        onClick={() => !isUploading && document.getElementById('logo-input').click()}
                    >
                        <input
                            id="logo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleFileChange(e, onChange)}
                            className="hidden"
                            disabled={isUploading}
                        />
                        
                        {isUploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-turquoise animate-spin mb-2" />
                                <p className="text-sm text-gray-600">Upload en cours...</p>
                            </div>
                        ) : previewUrl || value ? (
                            <div className="relative">
                                <img 
                                    src={previewUrl || value} 
                                    alt="Logo preview" 
                                    className="max-h-32 mx-auto rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(onChange);
                                    }}
                                    className="absolute top-2 right-2 bg-corail text-white p-2 rounded-full hover:bg-corail/80"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    Cliquez pour uploader le logo (Max 2MB)
                                </p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP</p>
                            </>
                        )}
                    </div>
                    {errors.logo_url && <p className="mt-1 text-xs text-corail">{errors.logo_url.message}</p>}
                </div>
            )}
        />
    );
};

// --- ÉTAPE 1 : Informations Établissement ---
const StepEstablishment = ({ control, errors, watch, setValue }) => {
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        // Charger les catégories depuis le backend
        axios.get('/api/partners/categories')
            .then(response => {
                setCategories(response.data.categories || []);
            })
            .catch(error => {
                console.error('Erreur chargement catégories:', error);
                // Fallback avec catégories statiques
                setCategories([
                    { id: 1, name: 'Restaurant', parent: 'Restauration & Gastronomie' },
                    { id: 2, name: 'Café / Bar', parent: 'Restauration & Gastronomie' },
                    { id: 3, name: 'Boulangerie / Pâtisserie', parent: 'Restauration & Gastronomie' },
                    { id: 5, name: 'Fast-food / Street food', parent: 'Restauration & Gastronomie' },
                    { id: 7, name: 'Épicerie / Superette', parent: 'Alimentation & Épicerie' },
                    { id: 10, name: 'Hôtel', parent: 'Hébergement & Tourisme' },
                    { id: 15, name: 'Coiffeur', parent: 'Beauté & Bien-être' },
                    { id: 20, name: 'Salle de sport', parent: 'Sports & Loisirs' },
                ]);
            })
            .finally(() => setLoadingCategories(false));
    }, []);

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
                <Briefcase className="w-6 h-6 mr-2" />
                1. Informations de l'établissement
            </h3>
            
            <Controller
                name="establishment_name"
                control={control}
                rules={{ required: "Le nom de l'établissement est requis", minLength: { value: 2, message: "Minimum 2 caractères" } }}
                render={({ field }) => (
                    <InputField 
                        label="Nom de l'établissement *" 
                        icon={Building} 
                        error={errors.establishment_name?.message} 
                        placeholder="Ex: Restaurant Chez Paul"
                        {...field} 
                    />
                )}
            />

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'établissement *</label>
                <Controller
                    name="establishment_type"
                    control={control}
                    rules={{ required: "Le type d'établissement est requis" }}
                    render={({ field }) => (
                        <div className="flex gap-3">
                            {ESTABLISHMENT_TYPES.map(type => (
                                <label key={type.value} className="flex-1">
                                    <input
                                        type="radio"
                                        {...field}
                                        value={type.value}
                                        checked={field.value === type.value}
                                        className="hidden peer"
                                    />
                                    <div className="p-3 border-2 rounded-lg text-center cursor-pointer transition-all peer-checked:border-turquoise peer-checked:bg-turquoise/10 hover:border-turquoise/50">
                                        <span className="font-medium">{type.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                />
                {errors.establishment_type && <p className="mt-1 text-xs text-corail">{errors.establishment_type.message}</p>}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie d'activité *</label>
                <Controller
                    name="category_id"
                    control={control}
                    rules={{ required: "La catégorie est requise" }}
                    render={({ field }) => {
                        const [searchQuery, setSearchQuery] = useState('');
                        const [showDropdown, setShowDropdown] = useState(false);
                        
                        // Trier les catégories par ordre alphabétique
                        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
                        
                        // Filtrer les catégories selon la recherche
                        const filteredCategories = sortedCategories.filter(cat => 
                            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            cat.parent.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        // Trouver la catégorie sélectionnée
                        const selectedCategory = categories.find(cat => cat.id === field.value);
                        
                        return (
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                <input
                                    type="text"
                                    value={selectedCategory ? `${selectedCategory.name} (${selectedCategory.parent})` : searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowDropdown(true);
                                        if (!e.target.value && selectedCategory) {
                                            field.onChange('');
                                        }
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder={loadingCategories ? 'Chargement...' : 'Rechercher une catégorie...'}
                                    disabled={loadingCategories}
                                    className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 transition-all ${
                                        errors.category_id ? 'border-corail ring-corail/30' : 'border-gray-300 focus:border-turquoise focus:ring-turquoise/30'
                                    }`}
                                />
                                {showDropdown && filteredCategories.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    field.onChange(cat.id);
                                                    setSearchQuery('');
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left p-3 hover:bg-turquoise/10 transition-colors border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900">{cat.name}</div>
                                                <div className="text-xs text-gray-500">{cat.parent}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && filteredCategories.length === 0 && searchQuery && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-gray-500 text-sm">
                                        Aucune catégorie trouvée
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
                {errors.category_id && <p className="mt-1 text-xs text-corail">{errors.category_id.message}</p>}
            </div>

            <Controller
                name="description"
                control={control}
                render={({ field }) => (
                    <TextAreaField 
                        label="Description de l'établissement (optionnel)" 
                        icon={FileText}
                        placeholder="Présentez votre établissement en quelques mots..."
                        {...field} 
                    />
                )}
            />

            <Controller
                name="website"
                control={control}
                rules={{
                    pattern: {
                        value: /^https?:\/\/.+/,
                        message: "URL invalide (doit commencer par http:// ou https://)"
                    }
                }}
                render={({ field }) => (
                    <InputField 
                        label="Site web (optionnel)" 
                        icon={Building}
                        error={errors.website?.message}
                        placeholder="https://www.votre-site.ch"
                        {...field} 
                    />
                )}
            />
        </motion.div>
    );
};

// --- ÉTAPE 2 : Personne de Contact ---
const StepContact = ({ control, errors }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
            <User className="w-6 h-6 mr-2" />
            2. Personne de contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
                name="contact.first_name"
                control={control}
                rules={{ required: "Le prénom est requis", minLength: { value: 2, message: "Minimum 2 caractères" } }}
                render={({ field }) => (
                    <InputField 
                        label="Prénom *" 
                        icon={User} 
                        error={errors.contact?.first_name?.message} 
                        placeholder="Paul"
                        {...field} 
                    />
                )}
            />

            <Controller
                name="contact.last_name"
                control={control}
                rules={{ required: "Le nom est requis", minLength: { value: 2, message: "Minimum 2 caractères" } }}
                render={({ field }) => (
                    <InputField 
                        label="Nom *" 
                        icon={User} 
                        error={errors.contact?.last_name?.message} 
                        placeholder="Dupont"
                        {...field} 
                    />
                )}
            />
        </div>

        <Controller
            name="contact.birth_date"
            control={control}
            rules={{ 
                required: "La date de naissance est requise",
                validate: value => {
                    const today = new Date();
                    const birthDate = new Date(value);
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    const actualAge = (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age;
                    return actualAge >= 18 || "Vous devez avoir au moins 18 ans";
                }
            }}
            render={({ field }) => (
                <InputField 
                    label="Date de naissance *" 
                    icon={Calendar}
                    type="date" 
                    error={errors.contact?.birth_date?.message} 
                    {...field} 
                />
            )}
        />

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sexe *</label>
            <Controller
                name="contact.gender"
                control={control}
                rules={{ required: "Le sexe est requis" }}
                render={({ field }) => (
                    <div className="flex gap-4">
                        {[
                            { value: 'male', label: 'Homme' },
                            { value: 'female', label: 'Femme' },
                            { value: 'other', label: 'Autre' }
                        ].map(sex => (
                            <label key={sex.value} className="inline-flex items-center">
                                <input
                                    type="radio"
                                    {...field}
                                    value={sex.value}
                                    checked={field.value === sex.value}
                                    className="form-radio text-turquoise border-gray-300 focus:ring-turquoise"
                                />
                                <span className="ml-2 text-gray-700">{sex.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            />
            {errors.contact?.gender && <p className="mt-1 text-xs text-corail">{errors.contact.gender.message}</p>}
        </div>

        <Controller
            name="contact.position"
            control={control}
            rules={{ required: "La fonction est requise" }}
            render={({ field }) => (
                <InputField 
                    label="Fonction *" 
                    icon={Briefcase}
                    error={errors.contact?.position?.message} 
                    placeholder="Ex: Gérant, Directeur, Responsable"
                    {...field} 
                />
            )}
        />

        <Controller
            name="contact.email"
            control={control}
            rules={{ 
                required: "L'email est requis",
                pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Format d'email invalide"
                }
            }}
            render={({ field }) => (
                <InputField 
                    label="Email *" 
                    icon={Mail}
                    type="email"
                    error={errors.contact?.email?.message} 
                    placeholder="paul@example.com"
                    {...field} 
                />
            )}
        />

        <Controller
            name="contact.phone"
            control={control}
            rules={{ 
                required: "Le téléphone est requis",
                pattern: {
                    value: /^(\+|00)?[0-9\s\-\(\)]{8,20}$/,
                    message: "Format de téléphone invalide"
                }
            }}
            render={({ field }) => (
                <InputField 
                    label="Téléphone *" 
                    icon={Phone}
                    type="tel"
                    error={errors.contact?.phone?.message} 
                    placeholder="+41 21 123 45 67"
                    {...field} 
                />
            )}
        />
    </motion.div>
);

// --- ÉTAPE 3 : Adresse ---
const StepAddress = ({ control, errors, setValue }) => {
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleAddressSearch = useCallback(async (query) => {
        if (query.length < 3) {
            setAddressSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    format: 'json',
                    q: query,
                    countrycodes: 'ch,fr',
                    limit: 5
                }
            });
            setAddressSuggestions(response.data);
        } catch (error) {
            console.error('Erreur recherche adresse:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const selectAddress = (suggestion) => {
        // Parser l'adresse depuis Nominatim en utilisant l'objet address
        const addr = suggestion.address || {};
        
        // Extraire le nom de rue (road, street, pedestrian, etc.)
        const street = addr.road || addr.street || addr.pedestrian || addr.path || '';
        
        // Extraire le numéro de rue (house_number)
        const number = addr.house_number || '';
        
        // Extraire la ville (city, town, village, municipality)
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        
        // Extraire le code postal
        const postalCode = addr.postcode || '';
        
        // Extraire le canton (state pour la Suisse)
        const canton = addr.state || '';
        
        // Extraire le pays (country_code en majuscules)
        const country = addr.country_code ? addr.country_code.toUpperCase() : 'CH';
        
        // Remplir les champs du formulaire
        setValue('address.street', street, { shouldValidate: true });
        setValue('address.number', number, { shouldValidate: true });
        setValue('address.postal_code', postalCode, { shouldValidate: true });
        setValue('address.city', city, { shouldValidate: true });
        setValue('address.canton', canton, { shouldValidate: true });
        setValue('address.country', country, { shouldValidate: true });

        setAddressSuggestions([]);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                3. Adresse de l'établissement
            </h3>

            <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rechercher une adresse
                </label>
                <input
                    type="text"
                    placeholder="Tapez une adresse..."
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:border-turquoise focus:ring-turquoise/30"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-10 w-5 h-5 text-turquoise animate-spin" />
                )}
                
                {addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, idx) => (
                            <div
                                key={idx}
                                onClick={() => selectAddress(suggestion)}
                                className="p-3 hover:bg-turquoise/10 cursor-pointer border-b last:border-b-0"
                            >
                                <p className="text-sm">{suggestion.display_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <Controller
                        name="address.street"
                        control={control}
                        rules={{ required: "La rue est requise" }}
                        render={({ field }) => (
                            <InputField 
                                label="Rue *" 
                                icon={MapPin}
                                error={errors.address?.street?.message} 
                                placeholder="Rue du Commerce"
                                {...field} 
                            />
                        )}
                    />
                </div>
                <Controller
                    name="address.number"
                    control={control}
                    render={({ field }) => (
                        <InputField 
                            label="Numéro" 
                            placeholder="12"
                            {...field} 
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                    name="address.postal_code"
                    control={control}
                    rules={{ required: "Le code postal est requis" }}
                    render={({ field }) => (
                        <InputField 
                            label="Code postal *" 
                            error={errors.address?.postal_code?.message} 
                            placeholder="1003"
                            {...field} 
                        />
                    )}
                />

                <Controller
                    name="address.city"
                    control={control}
                    rules={{ required: "La ville est requise" }}
                    render={({ field }) => (
                        <InputField 
                            label="Ville *" 
                            error={errors.address?.city?.message} 
                            placeholder="Lausanne"
                            {...field} 
                        />
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                    name="address.canton"
                    control={control}
                    render={({ field }) => (
                        <InputField 
                            label="Canton (optionnel)" 
                            placeholder="Vaud"
                            {...field} 
                        />
                    )}
                />

                <Controller
                    name="address.country"
                    control={control}
                    rules={{ required: "Le pays est requis" }}
                    render={({ field }) => (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                            <select
                                {...field}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:border-turquoise focus:ring-turquoise/30"
                            >
                                <option value="CH">Suisse</option>
                                <option value="FR">France</option>
                                <option value="BE">Belgique</option>
                                <option value="LU">Luxembourg</option>
                            </select>
                            {errors.address?.country && <p className="mt-1 text-xs text-corail">{errors.address.country.message}</p>}
                        </div>
                    )}
                />
            </div>
        </motion.div>
    );
};

// --- ÉTAPE 4 : Privilège Exclusif ---
const StepPrivilege = ({ control, errors, watch }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const categoryId = watch('category_id');

    useEffect(() => {
        if (categoryId) {
            setLoadingSuggestions(true);
            axios.get(`/api/partners/privilege-suggestions?category_id=${categoryId}&limit=5`)
                .then(response => {
                    setSuggestions(response.data.suggestions || []);
                })
                .catch(error => {
                    console.error('Erreur chargement suggestions:', error);
                    // Suggestions par défaut
                    setSuggestions([
                        "10% de réduction sur l'addition",
                        "Café offert",
                        "Dessert offert",
                        "Livraison gratuite",
                        "Entrée offerte"
                    ]);
                })
                .finally(() => setLoadingSuggestions(false));
        }
    }, [categoryId]);

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
                <Gift className="w-6 h-6 mr-2" />
                4. Privilège exclusif
            </h3>

            <div className="bg-turquoise/10 border border-turquoise/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                    <strong>Important :</strong> Le privilège que vous offrez sera visible par tous les membres PEP'S. 
                    Soyez attractif et clair !
                </p>
            </div>

            <Controller
                name="privilege"
                control={control}
                rules={{ 
                    required: "Le privilège est obligatoire",
                    minLength: { value: 5, message: "Minimum 5 caractères" }
                }}
                render={({ field }) => (
                    <TextAreaField 
                        label="Décrivez votre privilège exclusif *" 
                        icon={Gift}
                        error={errors.privilege?.message}
                        placeholder="Ex: 10% de réduction sur toute l'addition (hors boissons alcoolisées)"
                        {...field} 
                    />
                )}
            />

            {suggestions.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <Lightbulb className="w-5 h-5 text-turquoise mr-2" />
                        <span className="text-sm font-medium text-gray-700">Suggestions IA :</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    const currentValue = watch('privilege');
                                    if (!currentValue) {
                                        control._formValues.privilege = suggestion;
                                        control._subjects.values.next({ ...control._formValues });
                                    }
                                }}
                                className="px-3 py-2 bg-turquoise/10 text-turquoise rounded-lg text-sm hover:bg-turquoise/20 transition-all"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// --- ÉTAPE 5 : Logo ---
const StepLogo = ({ control, errors, watch, setValue }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
            <ImageIcon className="w-6 h-6 mr-2" />
            5. Logo de l'établissement
        </h3>

        <div className="bg-turquoise/10 border border-turquoise/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
                Uploadez le logo de votre établissement. Il sera affiché sur votre profil et sur la carte.
            </p>
        </div>

        <LogoUpload control={control} errors={errors} watch={watch} setValue={setValue} />
    </motion.div>
);

// --- ÉTAPE 6 : Validation et Mot de Passe ---
const StepValidation = ({ control, errors, watch }) => {
    const formData = watch();

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise flex items-center">
                <CheckSquare className="w-6 h-6 mr-2" />
                6. Validation et sécurité
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Récapitulatif :</h4>
                <div className="space-y-2 text-sm">
                    <p><strong>Établissement :</strong> {formData.establishment_name || '—'}</p>
                    <p><strong>Type :</strong> {formData.establishment_type || '—'}</p>
                    <p><strong>Contact :</strong> {formData.contact?.first_name} {formData.contact?.last_name}</p>
                    <p><strong>Email :</strong> {formData.contact?.email || '—'}</p>
                    <p><strong>Adresse :</strong> {formData.address?.street} {formData.address?.number}, {formData.address?.postal_code} {formData.address?.city}</p>
                    <p><strong>Privilège :</strong> {formData.privilege || '—'}</p>
                </div>
            </div>

            <div className="mb-6">
                <Controller
                    name="password"
                    control={control}
                    rules={{ 
                        required: "Le mot de passe est requis",
                        minLength: { value: 8, message: "Minimum 8 caractères" }
                    }}
                    render={({ field }) => (
                        <InputField 
                            label="Mot de passe *" 
                            icon={Lock}
                            type="password"
                            error={errors.password?.message}
                            placeholder="Minimum 8 caractères"
                            {...field} 
                        />
                    )}
                />

                <Controller
                    name="password_confirm"
                    control={control}
                    rules={{ 
                        required: "Confirmez le mot de passe",
                        validate: value => value === watch('password') || "Les mots de passe ne correspondent pas"
                    }}
                    render={({ field }) => (
                        <InputField 
                            label="Confirmer le mot de passe *" 
                            icon={Lock}
                            type="password"
                            error={errors.password_confirm?.message}
                            placeholder="Retapez le mot de passe"
                            {...field} 
                        />
                    )}
                />
            </div>

            <div className="mb-4">
                <Controller
                    name="terms_accepted"
                    control={control}
                    rules={{ required: "Vous devez accepter les conditions" }}
                    render={({ field }) => (
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                {...field}
                                value={undefined}
                                checked={field.value}
                                className="mt-1 form-checkbox text-turquoise border-gray-300 focus:ring-turquoise"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                J'accepte les <a href="/terms" className="text-turquoise underline">conditions générales</a> et 
                                la <a href="/privacy" className="text-turquoise underline">politique de confidentialité</a> *
                            </span>
                        </label>
                    )}
                />
                {errors.terms_accepted && <p className="mt-1 text-xs text-corail">{errors.terms_accepted.message}</p>}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    <strong>⏳ Validation manuelle :</strong> Votre inscription sera examinée par notre équipe sous 24-48h. 
                    Vous recevrez un email de confirmation une fois votre compte validé.
                </p>
            </div>
        </motion.div>
    );
};

// --- COMPOSANT PRINCIPAL ---
export default function PartnerRegistrationFormNew() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { handleSubmit, control, trigger, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            establishment_name: '',
            establishment_type: 'commerce',
            category_id: '',
            description: '',
            website: '',
            contact: {
                first_name: '',
                last_name: '',
                birth_date: '',
                gender: 'male',
                position: '',
                email: '',
                phone: ''
            },
            address: {
                street: '',
                number: '',
                postal_code: '',
                city: '',
                canton: '',
                country: 'CH'
            },
            privilege: '',
            logo_url: '',
            password: '',
            password_confirm: '',
            terms_accepted: false
        }
    });

    const steps = [
        { component: StepEstablishment, label: 'Établissement', fields: ['establishment_name', 'establishment_type', 'category_id'] },
        { component: StepContact, label: 'Contact', fields: ['contact.first_name', 'contact.last_name', 'contact.birth_date', 'contact.gender', 'contact.position', 'contact.email', 'contact.phone'] },
        { component: StepAddress, label: 'Adresse', fields: ['address.street', 'address.postal_code', 'address.city', 'address.country'] },
        { component: StepPrivilege, label: 'Privilège', fields: ['privilege'] },
        { component: StepLogo, label: 'Logo', fields: ['logo_url'] },
        { component: StepValidation, label: 'Validation', fields: ['password', 'password_confirm', 'terms_accepted'] }
    ];

    const CurrentStepComponent = steps[currentStep].component;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = async () => {
        const fieldsToValidate = steps[currentStep].fields;
        const isValid = await trigger(fieldsToValidate);
        
        if (isValid) {
            if (isLastStep) {
                // Soumettre le formulaire
                handleSubmit(onSubmit)();
            } else {
                setCurrentStep(prev => prev + 1);
                setSubmissionError(null);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setSubmissionError(null);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        setSubmissionError(null);

        // Préparer les données pour le backend
        const payload = {
            establishment_name: data.establishment_name,
            establishment_type: data.establishment_type,
            category_id: parseInt(data.category_id),
            description: data.description || null,
            privilege: data.privilege,
            website: data.website || null,
            logo_url: data.logo_url,
            contact: {
                first_name: data.contact.first_name,
                last_name: data.contact.last_name,
                birth_date: data.contact.birth_date,
                gender: data.contact.gender,
                position: data.contact.position,
                email: data.contact.email.toLowerCase().trim(),
                phone: data.contact.phone
            },
            address: {
                street: data.address.street,
                number: data.address.number || '',
                postal_code: data.address.postal_code,
                city: data.address.city,
                canton: data.address.canton || '',
                country: data.address.country
            },
            password: data.password
        };

        try {
            const response = await axios.post('/api/partners/register', payload);
            
            setIsSuccess(true);
            console.log("Inscription Partenaire réussie:", response.data);

        } catch (error) {
            console.error("Erreur d'inscription:", error);
            setSubmissionError(
                error.response?.data?.error || 
                "Une erreur est survenue lors de l'inscription. Veuillez réessayer."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-turquoise/10 to-corail/10 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center"
                >
                    <div className="w-16 h-16 bg-turquoise rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-turquoise mb-4">Inscription envoyée !</h2>
                    <p className="text-gray-700 mb-6">
                        Votre demande d'inscription a été transmise à notre équipe. 
                        Vous recevrez un email de confirmation sous 24-48h une fois votre compte validé.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-turquoise text-white rounded-lg hover:bg-turquoise/80 transition-all"
                    >
                        Retour à l'accueil
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-turquoise/10 to-corail/10 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* En-tête */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-turquoise mb-2">
                        Inscription Partenaire
                    </h1>
                    <p className="text-gray-600">
                        Rejoignez le réseau PEP'S et attirez de nouveaux clients
                    </p>
                </div>

                {/* Indicateur de progression */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                    idx <= currentStep ? 'bg-turquoise text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-xs mt-1 text-gray-600 hidden md:block">{step.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-turquoise transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Formulaire */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {submissionError && (
                        <div className="mb-4 p-4 bg-corail/10 border border-corail rounded-lg text-corail text-sm">
                            {submissionError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <AnimatePresence mode="wait">
                            <CurrentStepComponent 
                                key={currentStep}
                                control={control}
                                errors={errors}
                                watch={watch}
                                setValue={setValue}
                            />
                        </AnimatePresence>

                        {/* Boutons de navigation */}
                        <div className="flex justify-between mt-8">
                            <motion.button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                                    currentStep === 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                }`}
                                whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
                                whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Précédent
                            </motion.button>

                            <motion.button
                                type="button"
                                onClick={handleNext}
                                disabled={isLoading}
                                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                                    isLoading
                                        ? 'bg-turquoise/70 text-white cursor-wait'
                                        : 'bg-turquoise hover:bg-turquoise/80 text-white'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Envoi...
                                    </>
                                ) : isLastStep ? (
                                    <>
                                        Envoyer ma demande <CheckSquare className="w-5 h-5 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
