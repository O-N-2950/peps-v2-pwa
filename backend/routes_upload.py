"""
Routes API pour l'upload de fichiers (logos, photos)
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

upload_bp = Blueprint('upload', __name__)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_LOGO_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_PHOTO_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB

# Créer le dossier uploads s'il n'existe pas
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'logos'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'photos'), exist_ok=True)


def allowed_file(filename, allowed_extensions):
    """Vérifie si l'extension du fichier est autorisée"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def generate_unique_filename(original_filename):
    """Génère un nom de fichier unique"""
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    return unique_name


@upload_bp.route('/logo', methods=['POST'])
def upload_logo():
    """
    Upload d'un logo d'établissement
    
    Form-data:
    - logo: fichier image (PNG, JPG, JPEG, WEBP, max 2MB)
    
    Response:
    {
        "success": true,
        "url": "/uploads/logos/abc123.jpg",
        "filename": "abc123.jpg"
    }
    """
    try:
        # Vérifier qu'un fichier est présent
        if 'logo' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['logo']
        
        # Vérifier que le fichier a un nom
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        
        # Vérifier l'extension
        if not allowed_file(file.filename, ALLOWED_LOGO_EXTENSIONS):
            return jsonify({'success': False, 'error': f'Extension non autorisée. Utilisez: {", ".join(ALLOWED_LOGO_EXTENSIONS)}'}), 400
        
        # Vérifier la taille
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_LOGO_SIZE:
            return jsonify({'success': False, 'error': f'Fichier trop volumineux. Maximum {MAX_LOGO_SIZE // (1024*1024)}MB'}), 400
        
        # Générer un nom unique et sécurisé
        filename = generate_unique_filename(secure_filename(file.filename))
        filepath = os.path.join(UPLOAD_FOLDER, 'logos', filename)
        
        # Sauvegarder le fichier
        file.save(filepath)
        
        # Retourner l'URL relative
        file_url = f"/uploads/logos/{filename}"
        
        return jsonify({
            'success': True,
            'url': file_url,
            'filename': filename
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@upload_bp.route('/photo', methods=['POST'])
def upload_photo():
    """
    Upload d'une photo d'établissement
    
    Form-data:
    - photo: fichier image (PNG, JPG, JPEG, WEBP, max 5MB)
    
    Response:
    {
        "success": true,
        "url": "/uploads/photos/xyz789.jpg",
        "filename": "xyz789.jpg"
    }
    """
    try:
        # Vérifier qu'un fichier est présent
        if 'photo' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['photo']
        
        # Vérifier que le fichier a un nom
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        
        # Vérifier l'extension
        if not allowed_file(file.filename, ALLOWED_PHOTO_EXTENSIONS):
            return jsonify({'success': False, 'error': f'Extension non autorisée. Utilisez: {", ".join(ALLOWED_PHOTO_EXTENSIONS)}'}), 400
        
        # Vérifier la taille
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_PHOTO_SIZE:
            return jsonify({'success': False, 'error': f'Fichier trop volumineux. Maximum {MAX_PHOTO_SIZE // (1024*1024)}MB'}), 400
        
        # Générer un nom unique et sécurisé
        filename = generate_unique_filename(secure_filename(file.filename))
        filepath = os.path.join(UPLOAD_FOLDER, 'photos', filename)
        
        # Sauvegarder le fichier
        file.save(filepath)
        
        # Retourner l'URL relative
        file_url = f"/uploads/photos/{filename}"
        
        return jsonify({
            'success': True,
            'url': file_url,
            'filename': filename
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@upload_bp.route('/menu-pdf', methods=['POST'])
def upload_menu_pdf():
    """
    Upload d'un menu PDF pour les privilèges planifiés
    
    Form-data:
    - menu: fichier PDF (max 10MB)
    
    Response:
    {
        "success": true,
        "url": "/uploads/menus/menu123.pdf",
        "filename": "menu123.pdf"
    }
    """
    try:
        if 'menu' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['menu']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nom de fichier vide'}), 400
        
        # Vérifier que c'est un PDF
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'success': False, 'error': 'Seuls les fichiers PDF sont acceptés'}), 400
        
        # Vérifier la taille (max 10MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            return jsonify({'success': False, 'error': 'Fichier trop volumineux. Maximum 10MB'}), 400
        
        # Créer le dossier menus s'il n'existe pas
        menus_folder = os.path.join(UPLOAD_FOLDER, 'menus')
        os.makedirs(menus_folder, exist_ok=True)
        
        # Générer un nom unique
        filename = generate_unique_filename(secure_filename(file.filename))
        filepath = os.path.join(menus_folder, filename)
        
        # Sauvegarder
        file.save(filepath)
        
        file_url = f"/uploads/menus/{filename}"
        
        return jsonify({
            'success': True,
            'url': file_url,
            'filename': filename
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
