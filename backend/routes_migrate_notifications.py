"""
Route temporaire pour exécuter la migration SQL du système de notifications push et offres flash
"""
from flask import Blueprint, jsonify
from sqlalchemy import text
from models import db

migrate_notifications_bp = Blueprint('migrate_notifications', __name__)

@migrate_notifications_bp.route('/api/migrate-notifications-flash', methods=['POST'])
def migrate_notifications_flash():
    """
    Exécuter la migration SQL pour créer les tables de notifications push et offres flash
    """
    try:
        # Lire le fichier SQL
        with open('/home/ubuntu/peps-v2-pwa/backend/migration_notifications_flash.sql', 'r') as f:
            sql_content = f.read()
        
        # Séparer les commandes SQL (en ignorant les commentaires)
        sql_commands = []
        current_command = []
        
        for line in sql_content.split('\n'):
            # Ignorer les commentaires
            if line.strip().startswith('--') or not line.strip():
                continue
            
            current_command.append(line)
            
            # Si la ligne se termine par un point-virgule, c'est la fin d'une commande
            if line.strip().endswith(';'):
                sql_commands.append('\n'.join(current_command))
                current_command = []
        
        # Exécuter chaque commande SQL
        results = []
        for command in sql_commands:
            if command.strip() and not command.strip().upper().startswith('SELECT'):
                try:
                    db.session.execute(text(command))
                    results.append(f"✅ Commande exécutée: {command[:50]}...")
                except Exception as e:
                    results.append(f"⚠️ Erreur: {str(e)[:100]}")
        
        db.session.commit()
        
        # Vérifier les tables créées
        verification = db.session.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'member_favorites',
                'member_notification_settings',
                'push_notifications_log',
                'waitlist'
            )
            ORDER BY table_name
        """)).fetchall()
        
        tables_created = [row[0] for row in verification]
        
        return jsonify({
            "success": True,
            "message": "Migration exécutée avec succès",
            "tables_created": tables_created,
            "details": results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
