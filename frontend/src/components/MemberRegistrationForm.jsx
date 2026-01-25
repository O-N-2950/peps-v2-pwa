// /home/ubuntu/peps-v2-pwa/frontend/src/components/PartnerRegistrationForm.jsx

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
    Briefcase, User, MapPin, Image, Gift, CheckSquare, 
    Loader2, ArrowLeft, ArrowRight, Lightbulb, UploadCloud, Link, Trash2, Mail
} from 'lucide-react';

// --- Constantes et Données Fictives ---
const COLORS = {
    TURQUOISE: '#2A9D8F',
    CORAIL: '#E76F51',
};

// Extrait des catégories pour la démo
const CATEGORIES = [
    "Restaurants", "Hôtels", "Beauté & Bien-être", "Sports & Loisirs", "Mode & Accessoires", "Autres Services"
];

// --- Composant de Base pour l'Input (réutilisé) ---
const InputField = ({ label, icon: Icon, error, ...props }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />}
            <input
                {...props}
                className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 transition-all ${
                    error ? 'border-corail ring-corail/30' : 'border-gray-300 focus:border-turquoise focus:ring-turquoise/30'
                }`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-corail">{error}</p>}
    </div>
);

// --- Composant d'Upload de Fichier ---
const FileUpload = ({ label, name, control, rules, maxFileSize, allowedFormats, isMultiple = false, watch, setValue, errors }) => {
    const files = watch(name);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e, onChange) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length > 0) {
            const file = selectedFiles[0]; // Prend le premier si non multiple

            if (file.size > maxFileSize * 1024 * 1024) {
                alert(`Le fichier est trop volumineux. Max ${maxFileSize}MB.`);
                return;
            }
            if (!allowedFormats.includes(file.type)) {
                alert(`Format non supporté. Formats acceptés: ${allowedFormats.join(', ')}`);
                return;
            }

            if (!isMultiple) {
                setPreviewUrl(URL.createObjectURL(file));
                onChange(file);
            } else {
                // Logique pour gérer plusieurs fichiers (simplifiée pour la démo)
                onChange(selectedFiles);
            }
        }
    };

    const handleRemove = (onChange) => {
        setPreviewUrl(null);
        onChange(isMultiple ? [] : null);
    };

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, onBlur, value } }) => (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                            errors[name] ? 'border-corail bg-corail/5' : 'border-gray-300 hover:border-turquoise'
                        }`}
                        onClick={() => document.getElementById(name).click()}
                    >
                        <input
                            id={name}
                            type="file"
                            multiple={isMultiple}
                            accept={allowedFormats.map(f => `.${f.split('/')[1]}`).join(',')}
                            onChange={(e) => handleFileChange(e, onChange)}
                            onBlur={onBlur}
                            className="hidden"
                        />
                        <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                            {isMultiple ? "Cliquez pour uploader des photos (Max 5)" : "Cliquez pour uploader le logo (Max 2MB)"}
                        </p>
                        {errors[name] && <p className="mt-1 text-xs text-corail">{errors[name].message}</p>}
                    </div>

                    {previewUrl && !isMultiple && (
                        <div className="mt-3 flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                            <img src={previewUrl} alt="Logo Preview" className="w-16 h-16 object-contain rounded" />
                            <span className="text-sm text-gray-600 truncate">{files?.name}</span>
                            <button type="button" onClick={() => handleRemove(onChange)} className="text-corail hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        />
    );
};


// --- Composants d'Étapes ---

const StepCompanyInfo = ({ control, errors }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise">1. Informations de l'entreprise</h3>
        <Controller
            name="companyName"
            control={control}
            rules={{ required: "Le nom du commerce est requis", minLength: { value: 3, message: "Minimum 3 caractères" } }}
            render={({ field }) => <InputField label="Nom du commerce/entreprise" icon={Briefcase} error={errors.companyName?.message} {...field} />}
        />
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie d'activité</label>
            <Controller
                name="category"
                control={control}
                rules={{ required: "La catégorie est requise" }}
                render={({ field }) => (
                    <select
                        {...field}
                        className={`w-full p-3 border rounded-lg focus:ring-2 transition-all ${
                            errors.category ? 'border-corail ring-corail/30' : 'border-gray-300 focus:border-turquoise focus:ring-turquoise/30'
                        }`}
                    >
                        <option value="">Sélectionnez une catégorie</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                )}
            />
            {errors.category && <p className="mt-1 text-xs text-corail">{errors.category.message}</p>}
        </div>
        <Controller
            name="shortDescription"
            control={control}
            rules={{ maxLength: { value: 200, message: "Maximum 200 caractères" } }}
            render={({ field }) => (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description courte (Optionnel)</label>
                    <textarea
                        {...field}
                        rows="3"
                        className={`w-full p-3 border rounded-lg focus:ring-2 transition-all ${
                            errors.shortDescription ? 'border-corail' : 'border-gray-300 focus:border-turquoise'
                        }`}
                        placeholder="Ex: Boulangerie artisanale spécialisée en pains au levain."
                    />
                    <p className="text-xs text-right text-gray-500">{field.value?.length || 0}/200</p>
                    {errors.shortDescription && <p className="mt-1 text-xs text-corail">{errors.shortDescription.message}</p>}
                </div>
            )}
        />
    </motion.div>
);

const StepContactPerson = ({ control, errors }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise">2. Personne de contact</h3>
        <Controller
            name="contact.firstName"
            control={control}
            rules={{ required: "Le prénom est requis" }}
            render={({ field }) => <InputField label="Prénom" icon={User} error={errors.contact?.firstName?.message} {...field} />}
        />
        <Controller
            name="contact.lastName"
            control={control}
            rules={{ required: "Le nom est requis" }}
            render={({ field }) => <InputField label="Nom" icon={User} error={errors.contact?.lastName?.message} {...field} />}
        />
        <Controller
            name="contact.position"
            control={control}
            rules={{ required: "La fonction est requise" }}
            render={({ field }) => <InputField label="Fonction (ex: Gérant)" icon={User} error={errors.contact?.position?.message} {...field} />}
        />
        <Controller
            name="contact.email"
            control={control}
            rules={{ required: "L'email est requis", pattern: { value: /^\S+@\S+\.\S+$/, message: "Format email invalide" } }}
            render={({ field }) => <InputField label="Email" type="email" icon={Mail} error={errors.contact?.email?.message} {...field} />}
        />
        <Controller
            name="contact.mobile"
            control={control}
            rules={{ required: "Le mobile est requis", pattern: { value: /^\+(?:[0-9] ?){6,14}[0-9]$/, message: "Format international requis (+XX...)" } }}
            render={({ field }) => <InputField label="Mobile" type="tel" icon={Mail} error={errors.contact?.mobile?.message} {...field} />}
        />
    </motion.div>
);

const StepAddress = ({ control, errors, setValue }) => {
     // Logique d'autocomplétion simplifiée (identique au formulaire Membre)
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    
    const handleAddressChange = useCallback(async (e) => {
        const query = e.target.value;
        setValue('address.full', query);
        if (query.length > 3) {
            setAddressSuggestions([
                `12 Rue de la Paix, 75002 Paris, France`,
                `Avenue du Léman 1, 1005 Lausanne, Suisse`,
            ]);
        } else {
            setAddressSuggestions([]);
        }
    }, [setValue]);

    const selectAddress = (suggestion) => {
        setValue('address.full', suggestion, { shouldValidate: true });
        setValue('address.street', suggestion.split(',')[0].trim());
        setValue('address.npa', '1000');
        setValue('address.locality', 'Lausanne');
        setValue('address.country', 'Suisse'); 
        setValue('address.canton', 'Vaud');
        setAddressSuggestions([]);
    };
    
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise">3. Adresse du commerce</h3>
            
            <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Complète</label>
                <Controller
                    name="address.full"
                    control={control}
                    rules={{ required: "L'adresse est requise" }}
                    render={({ field }) => (
                        <InputField 
                            label="Adresse" 
                            icon={MapPin} 
                            error={errors.address?.full?.message} 
                            onChange={handleAddressChange} 
                            value={field.value || ''}
                            onBlur={field.onBlur}
                        />
                    )}
                />
                
                {addressSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                        {addressSuggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="p-2 text-sm hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => selectAddress(suggestion)}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <Controller
                name="website"
                control={control}
                rules={{ 
                    pattern: { 
                        value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 
                        message: "URL invalide (ex: https://monsite.com)" 
                    } 
                }}
                render={({ field }) => <InputField label="Site Internet (Optionnel)" icon={Link} error={errors.website?.message} {...field} placeholder="https://votresite.com" />}
            />
        </motion.div>
    );
};

const StepMedia = ({ control, errors, watch, setValue }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise">4. Médias</h3>
        
        <FileUpload
            label="Logo du commerce"
            name="logo"
            control={control}
            rules={{}} // Logo optionnel mais recommandé
            maxFileSize={2} // 2MB
            allowedFormats={['image/jpeg', 'image/png', 'image/webp']}
            watch={watch}
            setValue={setValue}
            errors={errors}
        />

        <FileUpload
            label="Photos du commerce (Max 5)"
            name="photos"
            control={control}
            isMultiple={true}
            maxFileSize={5} // 5MB par fichier
            allowedFormats={['image/jpeg', 'image/png']}
            watch={watch}
            setValue={setValue}
            errors={errors}
        />
        <p className="text-xs text-gray-500 mt-[-10px]">Note: L'upload de photos multiples est géré par le backend après soumission.</p>

    </motion.div>
);

const StepPrivilege = ({ control, errors, watch, setValue }) => {
    const category = watch('category');
    const title = watch('privilege.title');
    const description = watch('privilege.description');
    const [isSuggesting, setIsSuggesting] = useState(false);
    
    const handleSuggest = async () => {
        if (!category) {
            alert("Veuillez sélectionner une catégorie d'abord.");
            return;
        }
        setIsSuggesting(true);
        try {
            // Appel API simulé pour la suggestion IA
            const response = await axios.get(`/api/partners/privilege-suggestions?category=${category}`);
            const suggestion = response.data.suggestion || {
                title: `-15% sur l'addition (exclu boissons)`,
                description: `Profitez d'une réduction de 15% sur tous les plats à la carte, valable du lundi au jeudi soir, hors jours fériés. Non cumulable avec d'autres offres. Valable pour une table de 4 personnes maximum.`,
            };
            
            setValue('privilege.title', suggestion.title, { shouldValidate: true });
            setValue('privilege.description', suggestion.description, { shouldValidate: true });

        } catch (e) {
            alert("Erreur lors de la suggestion IA. Veuillez entrer manuellement.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise flex justify-between items-center">
                5. Privilège Exclusif
                <motion.button
                    type="button"
                    onClick={handleSuggest}
                    disabled={!category || isSuggesting}
                    className={`py-1 px-3 text-sm rounded-full flex items-center transition-colors ${
                        !category ? 'bg-gray-200 text-gray-500' : 'bg-corail text-white hover:bg-corail/90'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isSuggesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-1" />}
                    Suggestion IA
                </motion.button>
            </h3>

            <Controller
                name="privilege.title"
                control={control}
                rules={{ required: "Le titre est requis", maxLength: { value: 100, message: "Maximum 100 caractères" } }}
                render={({ field }) => <InputField label="Titre du privilège" error={errors.privilege?.title?.message} {...field} />}
            />
            
            <Controller
                name="privilege.description"
                control={control}
                rules={{ 
                    required: "La description complète est requise", 
                    minLength: { value: 50, message: "Minimum 50 caractères pour les conditions" },
                    maxLength: { value: 500, message: "Maximum 500 caractères" }
                }}
                render={({ field }) => (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description complète (Conditions)</label>
                        <textarea
                            {...field}
                            rows="5"
                            className={`w-full p-3 border rounded-lg focus:ring-2 transition-all ${
                                errors.privilege?.description ? 'border-corail' : 'border-gray-300 focus:border-turquoise'
                            }`}
                            placeholder="Décrivez précisément les conditions d'utilisation, la validité et les exclusions."
                        />
                        <p className="text-xs text-right text-gray-500">{field.value?.length || 0}/500</p>
                        {errors.privilege?.description && <p className="mt-1 text-xs text-corail">{errors.privilege.description.message}</p>}
                    </div>
                )}
            />

            {/* Preview du Privilège (Bonus) */}
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                <h4 className="text-lg font-bold text-turquoise">Aperçu du Privilège</h4>
                <p className="text-corail font-semibold mt-1">{title || "[Titre du privilège]"}</p>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{description || "Conditions de validité, exclusions, etc."}</p>
            </div>
        </motion.div>
    );
};

const StepValidation = ({ control, errors }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise">6. Validation Finale</h3>
        
        <Controller
            name="termsPartnerAccepted"
            control={control}
            rules={{ required: "Vous devez accepter les conditions partenaires" }}
            render={({ field }) => (
                <div className="flex items-start mt-4">
                    <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 form-checkbox h-5 w-5 text-turquoise rounded focus:ring-turquoise"
                    />
                    <label className="ml-3 text-sm text-gray-700">
                        J'accepte les <a href="/cgp" target="_blank" className="text-turquoise hover:underline">Conditions Générales Partenaires</a>.
                    </label>
                </div>
            )}
        />
        {errors.termsPartnerAccepted && <p className="mt-1 text-xs text-corail">{errors.termsPartnerAccepted.message}</p>}

        <Controller
            name="freeConfirmation"
            control={control}
            rules={{ required: "La confirmation de gratuité est requise" }}
            render={({ field }) => (
                <div className="flex items-start mt-4 p-4 bg-turquoise/5 border border-turquoise/30 rounded-lg">
                    <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 form-checkbox h-5 w-5 text-corail rounded focus:ring-corail"
                    />
                    <label className="ml-3 text-sm text-gray-700 font-medium">
                        Je confirme que l'inscription en tant que partenaire PEP'S est **entièrement gratuite** et sans engagement financier.
                    </label>
                </div>
            )}
        />
        {errors.freeConfirmation && <p className="mt-1 text-xs text-corail">{errors.freeConfirmation.message}</p>}

    </motion.div>
);


// --- Composant Principal Partenaire ---

const partnerSteps = [
    { name: 'Entreprise', component: StepCompanyInfo, icon: Briefcase, fields: ['companyName', 'category'] },
    { name: 'Contact', component: StepContactPerson, icon: User, fields: ['contact.firstName', 'contact.email', 'contact.mobile'] },
    { name: 'Adresse', component: StepAddress, icon: MapPin, fields: ['address.full'] },
    { name: 'Médias', component: StepMedia, icon: Image, fields: ['logo'] },
    { name: 'Privilège', component: StepPrivilege, icon: Gift, fields: ['privilege.title', 'privilege.description'] },
    { name: 'Validation', component: StepValidation, icon: CheckSquare, fields: ['termsPartnerAccepted', 'freeConfirmation'] },
];

export const PartnerRegistrationForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { handleSubmit, control, trigger, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            companyName: '',
            category: '',
            shortDescription: '',
            contact: { firstName: '', lastName: '', position: '', email: '', mobile: '' },
            address: { full: '', street: '', npa: '', locality: '', canton: '', country: 'Suisse' },
            website: '',
            logo: null,
            photos: [],
            privilege: { title: '', description: '' },
            termsPartnerAccepted: false,
            freeConfirmation: false,
        },
        mode: 'onBlur',
    });

    const CurrentStepComponent = partnerSteps[currentStep].component;
    const isLastStep = currentStep === partnerSteps.length - 1;

    // Fonction pour avancer
    const handleNext = async () => {
        const isValid = await trigger(partnerSteps[currentStep].fields);
        
        if (isValid && !isLastStep) {
            setCurrentStep(prev => prev + 1);
            setSubmissionError(null);
        }
    };

    // Soumission finale
    const onSubmit = async (data) => {
        setIsLoading(true);
        setSubmissionError(null);
        
        // Préparation des données pour l'upload
        const formData = new FormData();
        
        // Ajouter tous les champs texte/JSON
        Object.keys(data).forEach(key => {
            if (key === 'logo' && data[key] instanceof File) {
                formData.append('logo', data[key]);
            } else if (key === 'photos' && Array.isArray(data[key])) {
                data[key].forEach((file, index) => {
                    formData.append(`photo_${index}`, file);
                });
            } else {
                formData.append(key, JSON.stringify(data[key]));
            }
        });

        try {
            // 5. Backend valide + géocode + upload médias + création compte "pending"
            const response = await axios.post('/api/partners/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setIsSuccess(true);
            console.log("Inscription Partenaire réussie:", response.data);

        } catch (error) {
            console.error("Erreur d'inscription partenaire:", error);
            setSubmissionError(error.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-8 bg-white shadow-2xl rounded-xl text-center border-t-4 border-turquoise"
            >
                <Gift className="w-16 h-16 text-turquoise mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-turquoise mb-2">Merci pour votre partenariat !</h2>
                <p className="text-gray-600">
                    Votre demande a été reçue avec succès. Un administrateur PEP'S va examiner votre proposition de privilège et valider votre compte dans les 48 heures.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    Un email de confirmation vous a été envoyé.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-3xl rounded-2xl border-t-8 border-corail/70 relative overflow-hidden">
            
            {/* En-tête et Progress Bar */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                    <Briefcase className="w-8 h-8 mr-3 text-turquoise" />
                    Inscription Partenaire
                </h1>
                <p className="text-gray-500 mt-1">Devenez partenaire PEP'S et offrez un privilège à notre communauté.</p>
            </div>

            {/* Progress Bar (Stylisation plus compacte pour 6 étapes) */}
            <div className="flex justify-between items-center mb-8 relative">
                {partnerSteps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center flex-1 z-10">
                            <motion.div
                                animate={{ 
                                    scale: index === currentStep ? 1.2 : 1,
                                    backgroundColor: index <= currentStep ? COLORS.CORAIL : '#E5E7EB'
                                }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                    index <= currentStep ? 'bg-corail' : 'bg-gray-300 text-gray-600'
                                }`}
                            >
                                <step.icon className="w-4 h-4" />
                            </motion.div>
                            <p className={`mt-2 text-xs font-medium text-center hidden sm:block ${index === currentStep ? 'text-corail font-semibold' : 'text-gray-500'}`}>
                                {step.name}
                            </p>
                        </div>
                        {index < partnerSteps.length - 1 && (
                            <motion.div
                                initial={false}
                                animate={{ width: index < currentStep ? '100%' : '0%' }}
                                transition={{ duration: 0.5 }}
                                className="absolute h-1 bg-corail/50 top-4 left-0"
                                style={{ 
                                    width: `calc(100% / ${partnerSteps.length} - 50px)`, 
                                    left: `calc(${index * (100 / partnerSteps.length)}% + 50px)`,
                                    backgroundColor: index < currentStep ? COLORS.CORAIL : '#E5E7EB'
                                }}
                            >
                            </motion.div>
                        )}
                    </React.Fragment>
                ))}
            </div>


            {/* Formulaire et Étapes */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-12 mb-[100px] md:mb-0">
                <AnimatePresence mode="wait">
                    <CurrentStepComponent 
                        key={currentStep} 
                        control={control} 
                        errors={errors} 
                        watch={watch} 
                        setValue={setValue} 
                    />
                </AnimatePresence>

                {submissionError && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="p-3 bg-corail/10 border border-corail text-corail rounded-lg mt-4 text-sm"
                    >
                        {submissionError}
                    </motion.div>
                )}

                {/* Navigation */}
                <div className="fixed bottom-0 inset-x-0 bg-white p-4 shadow-2xl z-50 md:relative md:mt-8 md:pt-4 md:border-t md:border-gray-100 flex justify-between pb-safe">
                    <motion.button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        disabled={currentStep === 0 || isLoading}
                        className={`py-2 px-4 rounded-lg flex items-center transition-colors ${
                            currentStep === 0 || isLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-50 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                    </motion.button>

                    <motion.button
                        type={isLastStep ? 'submit' : 'button'}
                        onClick={!isLastStep ? handleNext : undefined}
                        disabled={isLoading}
                        className={`py-3 px-6 rounded-lg font-semibold flex items-center transition-all shadow-md ${
                            isLoading 
                                ? 'bg-corail/70 text-white cursor-wait'
                                : 'bg-corail hover:bg-corail/80 text-white'
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
                                Soumettre la Demande <CheckSquare className="w-5 h-5 ml-2" />
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
    );
};