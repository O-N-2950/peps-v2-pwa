"""
Migration pour créer les tables du système de réservation
"""
from app import app, db
from models_booking import (
    Service, PartnerBookingConfig, Creneau, Booking, 
    GoogleCalendarToken, BookingNotificationLog
)

def run_migration():
    """
    Créer les tables de réservation
    """
    print("🔄 Début de la migration des tables de réservation...")
    
    with app.app_context():
        try:
            # Créer toutes les tables définies dans models_booking.py
            db.create_all()
            
            print("✅ Tables de réservation créées avec succès:")
            print("   - services")
            print("   - partner_booking_configs")
            print("   - creneaux")
            print("   - bookings")
            print("   - google_calendar_tokens")
            print("   - booking_notification_logs")
            
        except Exception as e:
            print(f"❌ Erreur lors de la migration: {e}")
            raise

if __name__ == '__main__':
    run_migration()
