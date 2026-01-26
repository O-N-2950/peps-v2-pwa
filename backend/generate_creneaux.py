'''
Script pour générer les créneaux horaires (Creneau) pour un commerçant.

Ce script est essentiel pour la performance du système de réservation.
Il pré-calcule les disponibilités, évitant des calculs complexes lors de la recherche.

À exécuter via une tâche CRON (ex: tous les soirs).
'''
import os
import sys
from datetime import datetime, timedelta
import pytz

# Ajouter le chemin du projet pour les imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import app, db
from models import Partner, PartnerBookingConfig, Creneau, Service

def generate_slots_for_partner(partner_id):
    '''
    Génère les créneaux pour un commerçant sur la base de sa configuration.
    '''
    with app.app_context():
        config = PartnerBookingConfig.query.filter_by(partner_id=partner_id).first()
        if not config or not config.is_enabled:
            print(f"⚠️ Système de réservation désactivé pour le partenaire {partner_id}")
            return

        print(f"🚀 Génération des créneaux pour le partenaire {partner_id}...")
        print(f"   - Mode: {config.booking_mode}")
        print(f"   - Jours à l'avance: {config.advance_booking_days}")

        # Supprimer les anciens créneaux pour éviter les doublons
        today = datetime.now(pytz.utc).date()
        db.session.query(Creneau).filter(
            Creneau.partner_id == partner_id,
            Creneau.start_utc >= today
        ).delete()
        db.session.commit()

        new_creneaux = []
        days_generated = 0

        for i in range(config.advance_booking_days):
            current_date = datetime.now(pytz.utc).date() + timedelta(days=i)
            weekday = current_date.strftime('%A').lower()
            date_str = current_date.strftime('%Y-%m-%d')

            # Vérifier si c'est un jour de fermeture exceptionnel
            if date_str in (config.closed_dates or []):
                continue

            # Vérifier les horaires d'ouverture
            day_config = (config.opening_hours or {}).get(weekday)
            if not day_config or not day_config.get('enabled'):
                continue

            # Créer les créneaux pour la journée
            try:
                open_time = datetime.strptime(day_config['open'], '%H:%M').time()
                close_time = datetime.strptime(day_config['close'], '%H:%M').time()

                start_of_day = datetime.combine(current_date, open_time, tzinfo=pytz.timezone('Europe/Zurich')).astimezone(pytz.utc)
                end_of_day = datetime.combine(current_date, close_time, tzinfo=pytz.timezone('Europe/Zurich')).astimezone(pytz.utc)

                current_slot_start = start_of_day

                while current_slot_start < end_of_day:
                    slot_duration = config.slot_duration_minutes
                    current_slot_end = current_slot_start + timedelta(minutes=slot_duration)

                    if current_slot_end > end_of_day:
                        break

                    creneau = Creneau(
                        partner_id=partner_id,
                        start_utc=current_slot_start,
                        end_utc=current_slot_end,
                        capacity_total=config.max_concurrent_bookings,
                        capacity_remaining=config.max_concurrent_bookings,
                        is_available=True
                    )
                    new_creneaux.append(creneau)

                    current_slot_start = current_slot_end
                
                days_generated += 1

            except (ValueError, KeyError) as e:
                print(f"   - ❌ Erreur format horaire pour {weekday}: {e}")
                continue

        if new_creneaux:
            db.session.bulk_save_objects(new_creneaux)
            db.session.commit()
        
        print(f"✅ {len(new_creneaux)} créneaux générés sur {days_generated} jours.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_creneaux.py <partner_id>")
        sys.exit(1)
    
    try:
        partner_id_arg = int(sys.argv[1])
        generate_slots_for_partner(partner_id_arg)
    except ValueError:
        print("Erreur: <partner_id> doit être un nombre entier.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Une erreur inattendue est survenue: {e}")
        sys.exit(1)
