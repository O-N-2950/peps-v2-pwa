"""
Service IA Gemini 2.5 Flash pour catégorisation automatique des partenaires
Implémentation officielle avec google-genai SDK
"""

import os
import json
from google import genai
from google.genai.errors import APIError

# Initialisation du client Gemini (lit GEMINI_API_KEY automatiquement)
try:
    client = genai.Client()
    print("[AI_SERVICE] Client Gemini initialisé avec succès")
except Exception as e:
    print(f"[AI_SERVICE] ERREUR initialisation Gemini: {e}")
    client = None

# Catégories existantes par défaut
DEFAULT_CATEGORIES = [
    "Restaurants",
    "Hôtels",
    "Beauté & Bien-être",
    "Sports & Loisirs",
    "Mode & Accessoires",
    "Autres Services"
]


def get_existing_categories():
    """
    Récupère la liste des catégories existantes depuis la base de données
    TODO: Implémenter requête SQL pour récupérer depuis table categories
    """
    return DEFAULT_CATEGORIES


def categorize_partner_activity(description_activite: str) -> dict:
    """
    Catégorise automatiquement l'activité d'un partenaire avec Gemini 2.5 Flash
    
    Args:
        description_activite: Description textuelle de l'activité du partenaire
        
    Returns:
        dict: {
            "categorie_suggeree": str,
            "statut": "EXISTANTE" | "NOUVELLE_CREATION",
            "justification": str,
            "success": bool,
            "error": str (optionnel)
        }
    """
    
    # Vérifier que le client est initialisé
    if client is None:
        return {
            "success": False,
            "error": "Service IA non disponible (client non initialisé)",
            "categorie_suggeree": "Autres Services",
            "statut": "EXISTANTE",
            "justification": "Erreur d'initialisation du service IA"
        }
    
    try:
        # Récupérer les catégories existantes
        categories_existantes = get_existing_categories()
        categories_str = "\n".join([f"- {cat}" for cat in categories_existantes])
        
        # Construire le prompt selon spécifications
        prompt = f"""Vous êtes un expert en classification d'activités commerciales. Votre rôle est de catégoriser intelligemment les entreprises partenaires.

Description de l'activité du partenaire:
{description_activite}

Catégories existantes (à utiliser si possible):
{categories_str}

Analysez l'activité. Si elle correspond à une catégorie existante, retournez-la. Si elle est unique ou trop spécifique, créez une nouvelle catégorie concise (max 3 mots) et professionnelle.

Répondez UNIQUEMENT en JSON valide (sans markdown, sans backticks):
{{
  "categorie_suggeree": "string",
  "statut": "EXISTANTE ou NOUVELLE_CREATION",
  "justification": "string (courte explication)"
}}"""
        
        # Appel Gemini 2.5 Flash avec gestion d'erreurs
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=500
            )
        )
        
        # Extraire le texte généré
        content = response.text.strip()
        
        # Nettoyer le contenu (enlever markdown, commentaires, etc.)
        if content.startswith("```"):
            # Enlever les backticks markdown
            parts = content.split("```")
            if len(parts) >= 2:
                content = parts[1]
                if content.startswith("json"):
                    content = content[4:]
        
        # Enlever les commentaires JavaScript (// ...)
        lines = content.split('\n')
        cleaned_lines = []
        for line in lines:
            # Enlever commentaires inline
            if '//' in line:
                line = line.split('//')[0]
            cleaned_lines.append(line)
        content = '\n'.join(cleaned_lines).strip()
        
        # Parser le JSON
        result = json.loads(content)
        
        # Valider la structure
        if not all(k in result for k in ["categorie_suggeree", "statut", "justification"]):
            raise ValueError("Réponse Gemini incomplète")
        
        # Ajouter le flag de succès
        result["success"] = True
        
        return result
        
    except APIError as e:
        # Erreur API Gemini (clé invalide, quota, etc.)
        print(f"[AI_SERVICE] Erreur API Gemini: {e}")
        return {
            "success": False,
            "error": f"Erreur API Gemini: {str(e)}",
            "categorie_suggeree": "Autres Services",
            "statut": "EXISTANTE",
            "justification": "Erreur de catégorisation automatique"
        }
    
    except json.JSONDecodeError as e:
        # Erreur parsing JSON
        print(f"[AI_SERVICE] Erreur parsing JSON Gemini: {e}")
        return {
            "success": False,
            "error": f"Erreur parsing JSON Gemini: {str(e)}",
            "categorie_suggeree": "Autres Services",
            "statut": "EXISTANTE",
            "justification": "Erreur de catégorisation automatique"
        }
    
    except Exception as e:
        # Erreur générique
        print(f"[AI_SERVICE] Erreur service IA: {e}")
        return {
            "success": False,
            "error": f"Erreur service IA: {str(e)}",
            "categorie_suggeree": "Autres Services",
            "statut": "EXISTANTE",
            "justification": "Erreur de catégorisation automatique"
        }


def validate_and_save_category(categorie: str, statut: str):
    """
    Valide et sauvegarde une nouvelle catégorie dans la base de données
    
    Args:
        categorie: Nom de la catégorie
        statut: EXISTANTE ou NOUVELLE_CREATION
        
    Returns:
        bool: True si sauvegarde réussie
    """
    # TODO: Implémenter insertion dans table categories
    # Si NOUVELLE_CREATION: INSERT avec statut PENDING_REVIEW
    # Si EXISTANTE: Vérifier existence et incrémenter compteur usage
    
    if statut == "NOUVELLE_CREATION":
        print(f"[AI_SERVICE] Nouvelle catégorie créée: {categorie} (PENDING_REVIEW)")
        # INSERT INTO categories (nom, statut, date_creation) VALUES (categorie, 'PENDING_REVIEW', NOW())
    
    return True
