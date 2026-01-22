// /home/ubuntu/peps-v2-pwa/frontend/src/components/MemberRegistrationForm.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User, Mail, MapPin, CheckSquare, Loader2, ArrowLeft, ArrowRight, DollarSign } from 'lucide-react';

// --- Constantes et Grille Tarifaire ---
const COLORS = {
    TURQUOISE: '#2A9D8F',
    CORAIL: '#E76F51',
    BG_LIGHT: '#F4F4F4',
    TEXT_DARK: '#333333',
};

const PRICING_TIERS = {
    1: 49, 2: 89, 3: 129, 4: 169, 5: 199,
    6: 229, 7: 259, 8: 289, 9: 319, 10: 390,
    15: 525, 20: 700, 30: 900, 40: 1200,
    50: 1500, 75: 1875, 100: 2500, 150: 3000,
    200: 3500, 300: 4500, 400: 5500, 500: 7500,
    750: 9000, 1000: 12000, 1500: 15000, 2000: 18000,
    3000: 24000, 5000: 40000
};

// Fonction utilitaire pour trouver le prix le plus proche
const getPriceForAccessCount = (count) => {
    const tiers = Object.keys(PRICING_TIERS).map(Number).sort((a, b) => a - b);
    
    // Si le compte est un palier exact
    if (PRICING_TIERS[count]) {
        return PRICING_TIERS[count];
    }

    // Sinon, trouver le palier supérieur le plus proche
    for (const tier of tiers) {
        if (count < tier) {
            return PRICING_TIERS[tier];
        }
    }
    // Si count > 5000
    return PRICING_TIERS[5000];
};

// --- Composant de Base pour l'Input ---
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

// --- Composants d'Étapes (Simplifiés) ---

const StepPersonalInfo = ({ control, errors }) => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h3 className="text-xl font-semibold mb-4 text-turquoise">1. Informations personnelles</h3>
        <Controller
            name="firstName"
            control={control}
            rules={{ required: "Le prénom est requis", minLength: { value: 2, message: "Minimum 2 caractères" } }}
            render={({ field }) => <InputField label="Prénom" icon={User} error={errors.firstName?.message} {...field} />}
        />
        <Controller
            name="lastName"
            control={control}
            rules={{ required: "Le nom est requis", minLength: { value: 2, message: "Minimum 2 caractères" } }}
            render={({ field }) => <InputField label="Nom" icon={User} error={errors.lastName?.message} {...field} />}
        />
        <Controller
            name="birthDate"
            control={control}
            rules={{ 
                required: "La date de naissance est requise",
                validate: value => {
                    const today = new Date();
                    const birthDate = new Date(value);
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        return age - 1 >= 16 || "Vous devez avoir au moins 16 ans";
                    }
                    return age >= 16 || "Vous devez avoir au moins 16 ans";
                }
            }}
            render={({ field }) => <InputField label="Date de naissance" type="date" error={errors.birthDate?.message} {...field} />}
        />
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
            {['Homme', 'Femme', 'Autre'].map(sex => (
                <Controller
                    key={sex}
                    name="sex"
                    control={control}
                    rules={{ required: "Le sexe est requis" }}
                    render={({ field }) => (
                        <label className="inline-flex items-center mr-4">
                            <input
                                type="radio"
                                {...field}
                                value={sex}
                                checked={field.value === sex}
                                className="form-radio text-turquoise border-gray-300 focus:ring-turquoise"
                            />
                            <span className="ml-2 text-gray-700">{sex}</span>
                        </label>
                    )}
                />
            ))}
            {errors.sex && <p className="mt-1 text-xs text-corail">{errors.sex.message}</p>}
        </div>
    </motion.div>
);

const StepContact = ({ control, errors, setValue }) => {
    // Gestion de l'autocomplétion (simplifiée ici)
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    
    const handleAddressChange = useCallback(async (e) => {
        const query = e.target.value;
        setValue('address.full', query);
        if (query.length > 3) {
            // Démonstration d'appel API Nominatim (simulé)
            // const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=ch,fr,be`);
            // setAddressSuggestions(response.data.map(item => item.display_name));
            setAddressSuggestions([
                `12 Rue de la Paix, 75002 Paris, France`,
                `Avenue du Léman 1, 1005 Lausanne, Suisse`,
                `Rue Royale 10, 1000 Bruxelles, Belgique`,
            ]);
        } else {
            setAddressSuggestions([]);
        }
    }, [setValue]);

    const selectAddress = (suggestion) => {
        // En vrai, il faudrait parser l'adresse pour remplir Rue, NPA, Localité, etc.
        // Ici, on simule le remplissage
        setValue('address.full', suggestion, { shouldValidate: true });
        setValue('address.street', suggestion.split(',')[0].trim());
        setValue('address.npa', '1000');
        setValue('address.locality', 'Lausanne');
        setValue('address.country', 'Suisse'); // Déterminé par le géocodage
        setValue('address.canton', 'Vaud');
        setAddressSuggestions([]);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise">2. Coordonnées</h3>
            
            <Controller
                name="email"
                control={control}
                rules={{ 
                    required: "L'email est requis", 
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Format email invalide" } 
                    // Validation unique se fera au backend
                }}
                render={({ field }) => <InputField label="Email" type="email" icon={Mail} error={errors.email?.message} {...field} />}
            />
            
            <Controller
                name="mobile"
                control={control}
                rules={{ 
                    required: "Le mobile est requis",
                    pattern: { 
                        value: /^\+(?:[0-9] ?){6,14}[0-9]$/, // Regex international simplifié
                        message: "Format international requis (+XX...)" 
                    }
                }}
                render={({ field }) => <InputField label="Mobile" type="tel" icon={Mail} error={errors.mobile?.message} {...field} placeholder="+41 79 123 45 67" />}
            />

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
                            onBlur={field.onBlur} // Important pour RHF
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
            
            {/* Champs cachés ou désactivés après autocomplétion (pour l'affichage/vérification) */}
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Pays" disabled value={control._get  'address.country' || ''} />
                <InputField label="NPA" disabled value={control._get  'address.npa' || ''} />
            </div>
        </motion.div>
    );
};

const StepSubscription = ({ control, errors, watch, setValue }) => {
    const accessCount = watch('accessCount') || 1;
    const price = useMemo(() => getPriceForAccessCount(accessCount), [accessCount]);
    
    // Assurez-vous que le prix est mis à jour dans l'état du formulaire
    React.useEffect(() => {
        setValue('finalPrice', price);
    }, [price, setValue]);

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-xl font-semibold mb-4 text-turquoise">3. Abonnement</h3>

            <div className="mb-6 p-4 border border-turquoise/50 rounded-xl bg-turquoise/5 shadow-inner">
                <label className="block text-sm font-medium text-gray-700 mb-3">Nombre d'accès (Licences)</label>
                
                <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-turquoise">{accessCount}</span>
                    <div className="text-right">
                        <span className="text-sm text-gray-600">Prix total (TTC)</span>
                        <p className="text-3xl font-extrabold text-corail flex items-center justify-end">
                            <DollarSign className="w-6 h-6 mr-1" />{price.toLocaleString('fr-CH')} CHF
                        </p>
                    </div>
                </div>

                <Controller
                    name="accessCount"
                    control={control}
                    rules={{ required: "Le nombre d'accès est requis", min: { value: 1, message: "Minimum 1 accès" } }}
                    defaultValue={1}
                    render={({ field }) => (
                        <input
                            type="range"
                            min="1"
                            max="100" // Limité à 100 pour le slider, mais le champ pourrait être un input pour 100+
                            step="1"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-turquoise"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                    )}
                />
                 {errors.accessCount && <p className="mt-1 text-xs text-corail">{errors.accessCount.message}</p>}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'abonnement</label>
                {['Privé', 'Entreprise'].map(type => (
                    <Controller
                        key={type}
                        name="subscriptionType"
                        control={control}
                        rules={{ required: "Le type est requis" }}
                        defaultValue="Privé"
                        render={({ field }) => (
                            <label className="inline-flex items-center mr-4">
                                <input
                                    type="radio"
                                    {...field}
                                    value={type}
                                    checked={field.value === type}
                                    className="form-radio text-turquoise border-gray-300 focus:ring-turquoise"
                                />
                                <span className="ml-2 text-gray-700">{type}</span>
                            </label>
                        )}
                    />
                ))}
            </div>

            <Controller
                name="termsAccepted"
                control={control}
                rules={{ required: "Vous devez accepter les conditions générales" }}
                render={({ field }) => (
                    <div className="flex items-start mt-6">
                        <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 form-checkbox h-5 w-5 text-turquoise rounded focus:ring-turquoise"
                        />
                        <label className="ml-3 text-sm text-gray-700">
                            J'accepte les <a href="/cgu" target="_blank" className="text-turquoise hover:underline">Conditions Générales d'Utilisation</a>.
                        </label>
                    </div>
                )}
            />
            {errors.termsAccepted && <p className="mt-1 text-xs text-corail">{errors.termsAccepted.message}</p>}
        </motion.div>
    );
};


// --- Composant Principal ---

const steps = [
    { name: 'Informations personnelles', component: StepPersonalInfo, icon: User, fields: ['firstName', 'lastName', 'birthDate', 'sex'] },
    { name: 'Coordonnées', component: StepContact, icon: Mail, fields: ['email', 'mobile', 'address.full'] },
    { name: 'Abonnement', component: StepSubscription, icon: CheckSquare, fields: ['accessCount', 'termsAccepted'] },
];

export const MemberRegistrationForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { handleSubmit, control, trigger, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            birthDate: '',
            sex: 'Homme',
            email: '',
            mobile: '',
            address: { full: '', street: '', npa: '', locality: '', canton: '', country: 'Suisse' },
            accessCount: 1,
            subscriptionType: 'Privé',
            termsAccepted: false,
            finalPrice: getPriceForAccessCount(1) // Initialisation du prix
        },
        mode: 'onBlur',
    });

    const CurrentStepComponent = steps[currentStep].component;
    const isLastStep = currentStep === steps.length - 1;

    // Fonction pour avancer
    const handleNext = async () => {
        // Valide uniquement les champs de l'étape courante
        const isValid = await trigger(steps[currentStep].fields);
        
        if (isValid && !isLastStep) {
            setCurrentStep(prev => prev + 1);
            setSubmissionError(null);
        }
    };

    // Soumission finale
    const onSubmit = async (data) => {
        setIsLoading(true);
        setSubmissionError(null);
        
        // Simuler le géocodage et la validation backend
        const finalData = {
            ...data,
            address: {
                ...data.address,
                // Simuler l'ajout de lat/lng après géocodage
                lat: 46.519962,
                lng: 6.633597
            }
        };

        try {
            // 4. Backend valide + géocode + calcule prix + crée session Stripe
            const response = await axios.post('/api/members/register', finalData);
            
            // 6. Redirection vers Stripe Checkout (simulée)
            // window.location.href = response.data.stripeCheckoutUrl; 
            
            setIsSuccess(true);
            console.log("Inscription Membre réussie, redirection vers Stripe:", response.data.stripeCheckoutUrl);

        } catch (error) {
            console.error("Erreur d'inscription:", error);
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
                <CheckSquare className="w-16 h-16 text-turquoise mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-turquoise mb-2">Inscription Réussie !</h2>
                <p className="text-gray-600">
                    Merci de votre inscription. Vous êtes maintenant redirigé vers notre plateforme de paiement sécurisé (Stripe) pour finaliser votre adhésion.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    (Simulation: Redirection vers Stripe en cours...)
                </p>
            </motion.div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-2xl rounded-2xl border-t-8 border-turquoise/70 relative overflow-hidden">
            
            {/* En-tête et Progress Bar */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                    <User className="w-8 h-8 mr-3 text-corail" />
                    Inscription Membre
                </h1>
                <p className="text-gray-500 mt-1">Rejoignez la communauté PEP'S et profitez des privilèges locaux.</p>
            </div>

            <div className="flex justify-between mb-8">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <motion.div
                            animate={{ 
                                scale: index === currentStep ? 1.1 : 1,
                                backgroundColor: index <= currentStep ? COLORS.TURQUOISE : '#E5E7EB'
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                index <= currentStep ? 'bg-turquoise' : 'bg-gray-300 text-gray-600'
                            }`}
                        >
                            <step.icon className="w-5 h-5" />
                        </motion.div>
                        <p className={`mt-2 text-xs font-medium text-center ${index === currentStep ? 'text-turquoise font-semibold' : 'text-gray-500'}`}>
                            {step.name}
                        </p>
                        {index < steps.length - 1 && (
                            <div className={`absolute h-0.5 mt-5 top-28 ${index < currentStep ? 'bg-turquoise' : 'bg-gray-300'}`} style={{ width: `calc(100% / ${steps.length} - 50px)`, left: `calc(${index * (100 / steps.length)}% + 50px)` }}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Formulaire et Étapes */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-12">
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
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
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
                                ? 'bg-turquoise/70 text-white cursor-wait'
                                : 'bg-turquoise hover:bg-turquoise/80 text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Traitement...
                            </>
                        ) : isLastStep ? (
                            <>
                                Payer et S'inscrire <DollarSign className="w-5 h-5 ml-2" />
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