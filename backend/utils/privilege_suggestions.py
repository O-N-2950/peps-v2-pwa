"""
Utilitaire pour générer des suggestions de privilèges selon la catégorie d'activité
Utilise d'abord les suggestions prédéfinies, puis l'IA si nécessaire
"""

import json
import os
from typing import List, Optional
from openai import OpenAI

# Chemin vers les fichiers de données
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'data')
CATEGORIES_FILE = os.path.join(DATA_DIR, 'categories.json')
SUGGESTIONS_FILE = os.path.join(DATA_DIR, 'privilege_suggestions.json')


class PrivilegeSuggestionService:
    """Service de suggestions de privilèges"""
    
    def __init__(self):
        self.categories = self._load_categories()
        self.suggestions = self._load_suggestions()
        self.openai_client = None
        
        # Initialiser OpenAI si la clé API est disponible
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.openai_client = OpenAI()
    
    def _load_categories(self) -> dict:
        """Charge les catégories depuis le fichier JSON"""
        try:
            with open(CATEGORIES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {cat['id']: cat for cat in data['categories']}
        except FileNotFoundError:
            print(f"Fichier {CATEGORIES_FILE} non trouvé")
            return {}
        except json.JSONDecodeError as e:
            print(f"Erreur lors du parsing de {CATEGORIES_FILE}: {e}")
            return {}
    
    def _load_suggestions(self) -> dict:
        """Charge les suggestions depuis le fichier JSON"""
        try:
            with open(SUGGESTIONS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {s['category_id']: s['privileges'] for s in data['suggestions']}
        except FileNotFoundError:
            print(f"Fichier {SUGGESTIONS_FILE} non trouvé")
            return {}
        except json.JSONDecodeError as e:
            print(f"Erreur lors du parsing de {SUGGESTIONS_FILE}: {e}")
            return {}
    
    def get_suggestions_by_category_id(self, category_id: int, limit: int = 5) -> List[str]:
        """
        Récupère les suggestions de privilèges pour une catégorie donnée
        
        Args:
            category_id: ID de la catégorie
            limit: Nombre maximum de suggestions à retourner
        
        Returns:
            Liste de suggestions de privilèges
        
        Example:
            >>> service = PrivilegeSuggestionService()
            >>> suggestions = service.get_suggestions_by_category_id(1, limit=5)
            >>> print(suggestions)
            ['10% sur l\'addition', 'Café offert', 'Dessert offert', ...]
        """
        if category_id in self.suggestions:
            return self.suggestions[category_id][:limit]
        return []
    
    def get_suggestions_by_category_name(self, category_name: str, limit: int = 5) -> List[str]:
        """
        Récupère les suggestions de privilèges pour une catégorie donnée (par nom)
        
        Args:
            category_name: Nom de la catégorie (ex: "Restaurant", "Coiffeur")
            limit: Nombre maximum de suggestions à retourner
        
        Returns:
            Liste de suggestions de privilèges
        
        Example:
            >>> service = PrivilegeSuggestionService()
            >>> suggestions = service.get_suggestions_by_category_name("Restaurant", limit=5)
            >>> print(suggestions)
            ['10% sur l\'addition', 'Café offert', 'Dessert offert', ...]
        """
        # Recherche de la catégorie par nom
        for cat_id, cat_data in self.categories.items():
            if cat_data['name'].lower() == category_name.lower():
                return self.get_suggestions_by_category_id(cat_id, limit)
        
        # Si non trouvé, essayer de générer avec l'IA
        return self.generate_suggestions_with_ai(category_name, limit)
    
    def generate_suggestions_with_ai(self, category_name: str, limit: int = 5) -> List[str]:
        """
        Génère des suggestions de privilèges avec l'IA (OpenAI)
        
        Args:
            category_name: Nom de la catégorie
            limit: Nombre de suggestions à générer
        
        Returns:
            Liste de suggestions générées par l'IA
        
        Example:
            >>> service = PrivilegeSuggestionService()
            >>> suggestions = service.generate_suggestions_with_ai("Fleuriste", limit=5)
            >>> print(suggestions)
            ['10% sur bouquets', 'Rose offerte', 'Livraison gratuite', ...]
        """
        if not self.openai_client:
            print("OpenAI API non configurée")
            return []
        
        try:
            prompt = f"""Tu es un expert en marketing et fidélisation client pour des commerces locaux.

Génère {limit} suggestions de privilèges exclusifs pour un commerce de type "{category_name}".

Règles:
- Chaque privilège doit être court (max 50 caractères)
- Doit être attractif pour les clients
- Doit être réaliste et facile à mettre en place pour le commerce
- Doit créer de la valeur perçue
- Exemples: "10% sur l'addition", "Café offert", "Livraison gratuite"

Retourne uniquement la liste des privilèges, un par ligne, sans numérotation."""

            response = self.openai_client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Tu es un expert en marketing et fidélisation client."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            content = response.choices[0].message.content.strip()
            suggestions = [line.strip() for line in content.split('\n') if line.strip()]
            
            # Nettoyer les suggestions (enlever les numéros, tirets, etc.)
            cleaned_suggestions = []
            for suggestion in suggestions:
                # Enlever les numéros au début (1., 1), etc.)
                cleaned = suggestion.lstrip('0123456789.-) ')
                if cleaned:
                    cleaned_suggestions.append(cleaned)
            
            return cleaned_suggestions[:limit]
        
        except Exception as e:
            print(f"Erreur lors de la génération avec l'IA: {e}")
            return []
    
    def get_category_by_id(self, category_id: int) -> Optional[dict]:
        """
        Récupère les informations d'une catégorie par son ID
        
        Args:
            category_id: ID de la catégorie
        
        Returns:
            Dictionnaire contenant les informations de la catégorie ou None
        """
        return self.categories.get(category_id)
    
    def get_category_by_name(self, category_name: str) -> Optional[dict]:
        """
        Récupère les informations d'une catégorie par son nom
        
        Args:
            category_name: Nom de la catégorie
        
        Returns:
            Dictionnaire contenant les informations de la catégorie ou None
        """
        for cat_data in self.categories.values():
            if cat_data['name'].lower() == category_name.lower():
                return cat_data
        return None
    
    def get_all_categories(self) -> List[dict]:
        """
        Récupère toutes les catégories
        
        Returns:
            Liste de toutes les catégories
        """
        return list(self.categories.values())


# Instance globale pour réutilisation
privilege_suggestion_service = PrivilegeSuggestionService()


def get_privilege_suggestions(category_name: str, limit: int = 5) -> List[str]:
    """
    Fonction helper pour récupérer des suggestions de privilèges
    
    Example:
        >>> from utils.privilege_suggestions import get_privilege_suggestions
        >>> suggestions = get_privilege_suggestions("Restaurant", limit=5)
        >>> print(suggestions)
        ['10% sur l\'addition', 'Café offert', 'Dessert offert', ...]
    """
    return privilege_suggestion_service.get_suggestions_by_category_name(category_name, limit)


def get_all_categories() -> List[dict]:
    """
    Fonction helper pour récupérer toutes les catégories
    
    Example:
        >>> from utils.privilege_suggestions import get_all_categories
        >>> categories = get_all_categories()
        >>> print(len(categories))
        57
    """
    return privilege_suggestion_service.get_all_categories()


if __name__ == "__main__":
    # Tests
    service = PrivilegeSuggestionService()
    
    print("Test 1: Suggestions pour Restaurant")
    suggestions = service.get_suggestions_by_category_name("Restaurant", limit=5)
    print(f"Résultat: {suggestions}")
    
    print("\nTest 2: Suggestions pour Coiffeur")
    suggestions = service.get_suggestions_by_category_name("Coiffeur", limit=5)
    print(f"Résultat: {suggestions}")
    
    print("\nTest 3: Suggestions pour une catégorie non existante (avec IA)")
    suggestions = service.generate_suggestions_with_ai("Chocolaterie", limit=5)
    print(f"Résultat: {suggestions}")
    
    print("\nTest 4: Récupérer toutes les catégories")
    categories = service.get_all_categories()
    print(f"Nombre de catégories: {len(categories)}")
    print(f"Première catégorie: {categories[0]}")
