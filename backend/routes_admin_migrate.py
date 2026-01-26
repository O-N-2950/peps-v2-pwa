"""
Route admin pour exécuter les migrations de base de données
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db
from sqlalchemy import text

admin_migrate_bp = Blueprint('admin_migrate', __name__)

@admin_migrate_bp.route('/api/admin/migrate-booking-tables', methods=['POST'])
@jwt_required()
def migrate_booking_tables():
    """Créer les tables de réservation si elles n'existent pas"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # SQL pour créer les tables
        sql_commands = [
            # Table Services
            """
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price FLOAT NOT NULL DEFAULT 0,
                peps_discount_percent FLOAT DEFAULT 0,
                peps_discount_amount FLOAT DEFAULT 0,
                duration_minutes INTEGER NOT NULL DEFAULT 30,
                capacity INTEGER DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Table PartnerBookingConfig
            """
            CREATE TABLE IF NOT EXISTS partner_booking_config (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
                is_enabled BOOLEAN DEFAULT FALSE,
                booking_mode VARCHAR(50) DEFAULT 'simple',
                slot_duration_minutes INTEGER DEFAULT 30,
                advance_booking_days INTEGER DEFAULT 30,
                min_notice_hours INTEGER DEFAULT 2,
                max_concurrent_bookings INTEGER DEFAULT 1,
                cancellation_hours INTEGER DEFAULT 24,
                opening_hours JSONB,
                closed_dates JSONB DEFAULT '[]',
                send_email_notifications BOOLEAN DEFAULT TRUE,
                send_sms_notifications BOOLEAN DEFAULT FALSE,
                notification_email VARCHAR(255),
                notification_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Table Creneaux
            """
            CREATE TABLE IF NOT EXISTS creneaux (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                capacity INTEGER DEFAULT 1,
                booked_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Table Bookings
            """
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
                creneau_id INTEGER REFERENCES creneaux(id) ON DELETE SET NULL,
                booking_datetime TIMESTAMP NOT NULL,
                duration_minutes INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'confirmed',
                number_of_people INTEGER DEFAULT 1,
                total_price FLOAT DEFAULT 0,
                notes TEXT,
                cancellation_reason TEXT,
                cancelled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Table GoogleCalendarToken
            """
            CREATE TABLE IF NOT EXISTS google_calendar_tokens (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                token_expiry TIMESTAMP NOT NULL,
                calendar_id VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Table BookingNotificationLog
            """
            CREATE TABLE IF NOT EXISTS booking_notification_log (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                notification_type VARCHAR(50) NOT NULL,
                recipient VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL,
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Index pour performance (APRÈS création de la table)
            """
            CREATE INDEX IF NOT EXISTS idx_creneaux_partner_datetime 
            ON creneaux(partner_id, start_datetime, is_available)
            """
        ]
        
        # Exécuter chaque commande SQL
        for i, sql in enumerate(sql_commands, 1):
            db.session.execute(text(sql))
            print(f"✅ Commande {i}/{len(sql_commands)} exécutée")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tables de réservation créées avec succès',
            'tables_created': [
                'services',
                'partner_booking_config',
                'creneaux',
                'bookings',
                'google_calendar_tokens',
                'booking_notification_log'
            ]
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
