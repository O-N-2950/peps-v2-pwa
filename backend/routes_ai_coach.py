"""
Routes API pour l'IA Coach Gemini Flash
Fournit des suggestions intelligentes pour aider les partenaires à améliorer leur business
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Partner, Offer, PrivilegeUsage
from datetime import datetime, timedelta
import os
import json

ai_coach_bp = Blueprint('ai_coach', __name__, url_prefix='/api/ai-coach')

def get_partner_from_token():
    """Récupère le partenaire depuis le token JWT"""
    try:
        user_id = int(get_jwt_identity()) if isinstance(get_jwt_identity(), str) else get_jwt_identity()['id']
        partner = Partner.query.filter_by(user_id=user_id).first()
        return partner
    except:
        return None

def get_partner_stats(partner):
    """Récupère les statistiques du partenaire pour l'IA"""
    now = datetime.utcnow()
    
    # Activations 7 derniers jours
    seven_days_ago = now - timedelta(days=7)
    activations_7d = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= seven_days_ago
    ).count()
    
    # Activations 30 derniers jours
    thirty_days_ago = now - timedelta(days=30)
    activations_30d = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= thirty_days_ago
    ).count()
    
    # Activations mois précédent (pour comparaison)
    sixty_days_ago = now - timedelta(days=60)
    activations_prev_month = PrivilegeUsage.query.join(Offer).filter(
        Offer.partner_id == partner.id,
        PrivilegeUsage.used_at >= sixty_days_ago,
        PrivilegeUsage.used_at < thirty_days_ago
    ).count()
    
    # Followers
    followers_count = len(partner.followers_list)
    
    # Dernière offre flash
    last_flash_offer = Offer.query.filter_by(
        partner_id=partner.id,
        offer_type='flash'
    ).order_by(Offer.created_at.desc()).first()
    
    days_since_flash = None
    if last_flash_offer and last_flash_offer.created_at:
        days_since_flash = (now - last_flash_offer.created_at).days
    
    # Nombre d'offres actives
    active_offers = Offer.query.filter_by(partner_id=partner.id, active=True).count()
    
    # Offres sans photo (si le champ image_url existe)
    offers_without_photo = Offer.query.filter_by(
        partner_id=partner.id,
        active=True
    ).filter(
        (Offer.image_url == None) | (Offer.image_url == '')
    ).count() if hasattr(Offer, 'image_url') else 0
    
    return {
        'activations_7d': activations_7d,
        'activations_30d': activations_30d,
        'activations_prev_month': activations_prev_month,
        'followers': followers_count,
        'days_since_flash': days_since_flash,
        'active_offers': active_offers,
        'offers_without_photo': offers_without_photo,
        'partner_name': partner.name,
        'partner_category': partner.category
    }

def call_gemini_flash(prompt):
    """Appelle l'API Gemini Flash pour générer des suggestions"""
    try:
        from openai import OpenAI
        
        client = OpenAI()
        
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {
                    "role": "system",
                    "content": """Tu es un coach business expert pour les commerces partenaires PEP's.
Ta mission : analyser les données et donner 3 suggestions actionnables et concrètes.

Format de réponse (JSON strict) :
{
  "suggestions": [
    {
      "type": "performance|followers|contenu|timing|opportunite",
      "icon": "emoji approprié",
      "title": "Titre court et percutant",
      "description": "Explication claire (max 80 caractères)",
      "action": "Texte du bouton d'action",
      "priority": "high|medium|low"
    }
  ]
}

Règles :
- Sois direct et actionnable
- Utilise des chiffres précis
- Propose des solutions concrètes
- Reste positif et encourageant
- Maximum 3 suggestions"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        content = response.choices[0].message.content
        
        # Parser la réponse JSON
        try:
            # Extraire le JSON si entouré de markdown
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            result = json.loads(content)
            return result.get('suggestions', [])
        except json.JSONDecodeError:
            # Fallback si le parsing échoue
            return []
            
    except Exception as e:
        print(f"Erreur Gemini API: {e}")
        return []

@ai_coach_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Génère des suggestions IA pour le partenaire"""
    partner = get_partner_from_token()
    if not partner:
        return jsonify({'error': 'Partenaire non trouvé'}), 404
    
    # Récupérer les stats
    stats = get_partner_stats(partner)
    
    # Construire le prompt pour Gemini
    prompt = f"""
Analyse les données de ce commerce partenaire PEP's et donne 3 suggestions pour améliorer sa performance :

📊 DONNÉES :
- Nom : {stats['partner_name']}
- Catégorie : {stats['partner_category']}
- Activations derniers 7 jours : {stats['activations_7d']}
- Activations derniers 30 jours : {stats['activations_30d']}
- Activations mois précédent : {stats['activations_prev_month']}
- Followers : {stats['followers']}
- Offres actives : {stats['active_offers']}
- Jours depuis dernière offre flash : {stats['days_since_flash'] if stats['days_since_flash'] is not None else 'Jamais créé'}
- Offres sans photo : {stats['offers_without_photo']}

🎯 CONTEXTE :
- PEP's est une plateforme de privilèges pour membres
- Les offres flash génèrent du trafic immédiat
- Les followers reçoivent les notifications push
- Plus de photos = plus d'engagement

Donne 3 suggestions concrètes et actionnables.
"""
    
    # Appeler Gemini
    suggestions = call_gemini_flash(prompt)
    
    # Si l'IA ne répond pas, utiliser des suggestions par défaut basées sur les règles
    if not suggestions:
        suggestions = generate_fallback_suggestions(stats)
    
    return jsonify({
        'suggestions': suggestions,
        'stats': stats
    })

def generate_fallback_suggestions(stats):
    """Génère des suggestions par défaut si l'IA ne répond pas"""
    suggestions = []
    
    # Règle 1 : Offre flash
    if stats['days_since_flash'] is None or stats['days_since_flash'] > 10:
        suggestions.append({
            'type': 'performance',
            'icon': '⚡',
            'title': 'Créez une offre flash',
            'description': 'Aucune offre flash récente. Boostez votre visibilité !',
            'action': 'Créer maintenant',
            'priority': 'high'
        })
    
    # Règle 2 : Followers
    if stats['followers'] < 20:
        suggestions.append({
            'type': 'followers',
            'icon': '👥',
            'title': f'Objectif : 25 followers',
            'description': f'Vous avez {stats["followers"]} followers. Créez des offres attractives !',
            'action': 'Voir actions',
            'priority': 'medium'
        })
    
    # Règle 3 : Photos
    if stats['offers_without_photo'] > 0:
        suggestions.append({
            'type': 'contenu',
            'icon': '📸',
            'title': 'Ajoutez des photos',
            'description': f'{stats["offers_without_photo"]} offre(s) sans photo. +40% d\'engagement !',
            'action': 'Upload photos',
            'priority': 'medium'
        })
    
    # Règle 4 : Performance en baisse
    if stats['activations_30d'] < stats['activations_prev_month'] * 0.7:
        suggestions.append({
            'type': 'performance',
            'icon': '📉',
            'title': 'Activations en baisse',
            'description': 'Vos activations baissent. Créez une offre flash ce weekend !',
            'action': 'Créer offre',
            'priority': 'high'
        })
    
    # Règle 5 : Encouragement
    if stats['activations_30d'] > stats['activations_prev_month']:
        suggestions.append({
            'type': 'opportunite',
            'icon': '🎉',
            'title': 'Excellente progression !',
            'description': f'+{int((stats["activations_30d"] - stats["activations_prev_month"]) / stats["activations_prev_month"] * 100)}% ce mois. Continuez !',
            'action': 'Voir stats',
            'priority': 'low'
        })
    
    # Retourner maximum 3 suggestions
    return suggestions[:3]

@ai_coach_bp.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint de chat avec Pepi (Gemini Flash)
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message vide'}), 400
        
        # Appel à Gemini Flash
        from openai import OpenAI
        client = OpenAI()
        
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "system", "content": "Tu es Pepi, l'assistant IA de PEP's. Tu aides les utilisateurs à découvrir des privilèges locaux en Suisse, France et Belgique. Sois amical, concis et utilise le tutoiement."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_response = response.choices[0].message.content
        
        return jsonify({'response': assistant_response}), 200
        
    except Exception as e:
        print(f"Erreur chat Pepi: {str(e)}")
        return jsonify({'error': 'Erreur serveur'}), 500
