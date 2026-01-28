"""
Service IA pour la catégorisation automatique des partenaires
et autres fonctionnalités d'intelligence artificielle
"""

import os
import google.generativeai as genai  # ✅ IMPORT CORRECT

# ============================================
# CONFIGURATION GEMINI
# ============================================

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    print("[AI_SERVICE] ⚠️ WARNING: GOOGLE_API_KEY manquante")
    print("[AI_SERVICE] Les fonctionnalités IA ne seront pas disponibles")
else:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        print(f"[AI_SERVICE] ✅ Gemini configuré (clé: {GOOGLE_API_KEY[:10]}...)")
    except Exception as e:
        print(f"[AI_SERVICE] ❌ Erreur configuration Gemini: {e}")

# ============================================
# CONFIGURATION MODÈLE
# ============================================

# Configuration pour catégorisation (réponses courtes et déterministes)
CATEGORIZATION_CONFIG = {
    "temperature": 0.3,  # Plus déterministe
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 100,  # Court pour catégorisation
}

# Configuration pour génération de contenu (créative)
GENERATION_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 512,
}

# Safety settings (permissifs pour contenu commercial)
SAFETY_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
    },
]

# ============================================
# CATÉGORIES DISPONIBLES
# ============================================

PARTNER_CATEGORIES = [
    "Restaurant",
    "Café/Bar",
    "Boulangerie/Pâtisserie",
    "Coiffeur/Salon de beauté",
    "Esthétique/Spa",
    "Fitness/Sport",
    "Hôtel/Hébergement",
    "Commerce/Boutique",
    "Mode/Vêtements",
    "Bijouterie",
    "Santé/Médical",
    "Pharmacie",
    "Optique",
    "Garage/Mécanique",
    "Assurance/Finance",
    "Services professionnels",
    "Loisirs/Culture",
    "Cinéma/Spectacle",
    "Traiteur",
    "Fleuriste",
    "Autre"
]

# ============================================
# FONCTION PRINCIPALE : CATÉGORISATION
# ============================================

def categorize_partner_activity(business_name, description=None, address=None):
    """
    Catégorise automatiquement l'activité d'un partenaire en utilisant Gemini
    
    Args:
        business_name (str): Nom du commerce/partenaire
        description (str, optional): Description de l'activité
        address (str, optional): Adresse (peut contenir des indices)
        
    Returns:
        str: Catégorie identifiée (ex: "Restaurant", "Coiffeur", etc.)
        
    Example:
        >>> categorize_partner_activity("La Petite Brasserie", "Restaurant traditionnel suisse")
        "Restaurant"
    """
    try:
        if not GOOGLE_API_KEY:
            print(f"[AI_SERVICE] Catégorisation impossible (pas de clé API) : {business_name}")
            return "Autre"
        
        # Construction du prompt
        context = f"Nom du commerce : {business_name}\n"
        if description:
            context += f"Description : {description}\n"
        if address:
            context += f"Adresse : {address}\n"
        
        prompt = f"""Analyse ce commerce et choisis LA CATÉGORIE LA PLUS APPROPRIÉE parmi cette liste :

{', '.join(PARTNER_CATEGORIES)}

{context}

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT par le nom exact de la catégorie (copie-colle depuis la liste)
- Si plusieurs catégories correspondent, choisis la PRINCIPALE
- Si aucune ne correspond parfaitement, choisis "Autre"
- Ne donne AUCUNE explication, juste le nom de la catégorie

Catégorie :"""

        # Appel Gemini
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=CATEGORIZATION_CONFIG,
            safety_settings=SAFETY_SETTINGS
        )
        
        response = model.generate_content(prompt)
        category = response.text.strip()
        
        # Validation : la catégorie doit être dans la liste
        if category not in PARTNER_CATEGORIES:
            print(f"[AI_SERVICE] ⚠️ Catégorie invalide '{category}' pour '{business_name}' → 'Autre'")
            category = "Autre"
        
        print(f"[AI_SERVICE] ✅ Catégorisation : '{business_name}' → {category}")
        return category
        
    except Exception as e:
        print(f"[AI_SERVICE] ❌ Erreur catégorisation '{business_name}': {type(e).__name__}: {e}")
        return "Autre"


# ============================================
# FONCTION : SUGGESTION DE PRIVILÈGES
# ============================================

def suggest_privileges(business_name, category, description=None):
    """
    Suggère des privilèges attractifs pour un partenaire
    
    Args:
        business_name (str): Nom du commerce
        category (str): Catégorie du commerce
        description (str, optional): Description de l'activité
        
    Returns:
        list: Liste de 3-5 suggestions de privilèges
        
    Example:
        >>> suggest_privileges("Fitness Plus", "Fitness/Sport")
        ["10% sur l'abonnement annuel", "Séance d'essai gratuite", ...]
    """
    try:
        if not GOOGLE_API_KEY:
            return []
        
        context = f"Nom : {business_name}\nCatégorie : {category}\n"
        if description:
            context += f"Description : {description}\n"
        
        prompt = f"""Tu es un expert en marketing pour la plateforme PEP's (Privilèges Économiques et Partenariats).

{context}

Propose 5 privilèges ATTRACTIFS et CONCRETS que ce commerce pourrait offrir à ses membres PEP's.

RÈGLES :
- Privilèges RÉALISTES (pas de "50% de réduction" irréaliste)
- VARIÉS (prix, service, produit, expérience)
- SPÉCIFIQUES à l'activité
- Format : liste numérotée courte (max 10 mots par privilège)

Exemples :
1. 10% sur tous les services
2. Boisson offerte dès 20 CHF d'achat
3. Séance d'essai gratuite

Privilèges :"""

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=GENERATION_CONFIG,
            safety_settings=SAFETY_SETTINGS
        )
        
        response = model.generate_content(prompt)
        
        # Parser la réponse
        privileges = []
        for line in response.text.strip().split('\n'):
            line = line.strip()
            # Retirer la numérotation (1., 2., etc.)
            if line and (line[0].isdigit() or line.startswith('-')):
                privilege = line.split('.', 1)[-1].strip()
                privilege = privilege.lstrip('- ').strip()
                if privilege:
                    privileges.append(privilege)
        
        print(f"[AI_SERVICE] ✅ Suggestions privilèges pour '{business_name}' : {len(privileges)} idées")
        return privileges[:5]  # Max 5
        
    except Exception as e:
        print(f"[AI_SERVICE] ❌ Erreur suggestions privilèges: {e}")
        return []


# ============================================
# FONCTION : AMÉLIORATION DE DESCRIPTION
# ============================================

def improve_description(business_name, current_description, category):
    """
    Améliore la description d'un partenaire pour la rendre plus attractive
    
    Args:
        business_name (str): Nom du commerce
        current_description (str): Description actuelle
        category (str): Catégorie
        
    Returns:
        str: Description améliorée
    """
    try:
        if not GOOGLE_API_KEY or not current_description:
            return current_description
        
        prompt = f"""Tu es rédacteur marketing pour la plateforme PEP's.

Commerce : {business_name}
Catégorie : {category}
Description actuelle : {current_description}

Réécris cette description en 2-3 phrases MAXIMUM pour :
- La rendre ATTRACTIVE et PROFESSIONNELLE
- Mettre en valeur les POINTS FORTS
- Donner envie de devenir membre PEP's
- Rester CONCIS (max 200 caractères)

Description améliorée :"""

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=GENERATION_CONFIG,
            safety_settings=SAFETY_SETTINGS
        )
        
        response = model.generate_content(prompt)
        improved = response.text.strip()
        
        # Limiter à 200 caractères
        if len(improved) > 200:
            improved = improved[:197] + "..."
        
        print(f"[AI_SERVICE] ✅ Description améliorée pour '{business_name}'")
        return improved
        
    except Exception as e:
        print(f"[AI_SERVICE] ❌ Erreur amélioration description: {e}")
        return current_description


# ============================================
# FONCTION : VÉRIFICATION SANTÉ
# ============================================

def check_ai_health():
    """
    Vérifie que le service IA est opérationnel
    
    Returns:
        dict: Statut du service
    """
    status = {
        'available': False,
        'configured': False,
        'model': None,
        'error': None
    }
    
    if not GOOGLE_API_KEY:
        status['error'] = 'GOOGLE_API_KEY non configurée'
        return status
    
    status['configured'] = True
    
    try:
        # Test simple
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content("Réponds juste 'OK'")
        
        if response.text.strip().upper() == 'OK':
            status['available'] = True
            status['model'] = 'gemini-1.5-flash'
        
    except Exception as e:
        status['error'] = str(e)
    
    return status


# ============================================
# TEST AU DÉMARRAGE
# ============================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("TEST AI_SERVICE.PY")
    print("="*60)
    
    # Test 1 : Configuration
    health = check_ai_health()
    print(f"\n✅ Santé du service :")
    for key, value in health.items():
        print(f"   {key}: {value}")
    
    # Test 2 : Catégorisation
    if health['available']:
        print(f"\n✅ Test catégorisation :")
        category = categorize_partner_activity(
            "La Petite Brasserie",
            "Restaurant traditionnel suisse avec terrasse"
        )
        print(f"   Résultat : {category}")
        
        # Test 3 : Suggestions
        print(f"\n✅ Test suggestions privilèges :")
        privileges = suggest_privileges("La Petite Brasserie", category)
        for i, priv in enumerate(privileges, 1):
            print(f"   {i}. {priv}")
    
    print("\n" + "="*60 + "\n")
