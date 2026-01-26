"""
Routes API pour le système de réservation PEP'S
"""
from flask import Blueprint, request, jsonify
from models import (
    db, Partner, Member, Service, PartnerBookingConfig, Creneau, Booking, 
    GoogleCalendarToken, BookingNotificationLog
)
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
import pytz

booking_bp = Blueprint('booking', __name__)

# ===========================
# ROUTES COMMERÇANT
# ===========================

@booking_bp.route('/api/partner/<int:partner_id>/booking/config', methods=['GET'])
def get_partner_booking_config(partner_id):
    """
    Récupérer la configuration de réservation d'un commerçant
    """
    try:
        config = PartnerBookingConfig.query.filter_by(partner_id=partner_id).first()
        
        if not config:
            # Créer une configuration par défaut
            config = PartnerBookingConfig(
                partner_id=partner_id,
                booking_mode='catalog',
                is_enabled=False,
                slot_duration_minutes=30,
                advance_booking_days=30,
                min_notice_hours=2,
                opening_hours={
                    "monday": {"open": "09:00", "close": "18:00", "enabled": True},
                    "tuesday": {"open": "09:00", "close": "18:00", "enabled": True},
                    "wednesday": {"open": "09:00", "close": "18:00", "enabled": True},
                    "thursday": {"open": "09:00", "close": "18:00", "enabled": True},
                    "friday": {"open": "09:00", "close": "18:00", "enabled": True},
                    "saturday": {"open": "09:00", "close": "17:00", "enabled": True},
                    "sunday": {"open": "10:00", "close": "16:00", "enabled": False}
                },
                closed_dates=[],
                max_concurrent_bookings=1
            )
            db.session.add(config)
            db.session.commit()
        
        return jsonify({
            'success': True,
            'config': config.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/booking/config', methods=['PUT'])
def update_partner_booking_config(partner_id):
    """
    Mettre à jour la configuration de réservation d'un commerçant
    """
    try:
        data = request.json
        
        config = PartnerBookingConfig.query.filter_by(partner_id=partner_id).first()
        
        if not config:
            config = PartnerBookingConfig(partner_id=partner_id)
            db.session.add(config)
        
        # Mise à jour des champs
        if 'booking_mode' in data:
            config.booking_mode = data['booking_mode']
        if 'is_enabled' in data:
            config.is_enabled = data['is_enabled']
        if 'slot_duration_minutes' in data:
            config.slot_duration_minutes = data['slot_duration_minutes']
        if 'advance_booking_days' in data:
            config.advance_booking_days = data['advance_booking_days']
        if 'min_notice_hours' in data:
            config.min_notice_hours = data['min_notice_hours']
        if 'opening_hours' in data:
            config.opening_hours = data['opening_hours']
        if 'closed_dates' in data:
            config.closed_dates = data['closed_dates']
        if 'max_concurrent_bookings' in data:
            config.max_concurrent_bookings = data['max_concurrent_bookings']
        if 'notification_email' in data:
            config.notification_email = data['notification_email']
        if 'notification_phone' in data:
            config.notification_phone = data['notification_phone']
        if 'send_sms_notifications' in data:
            config.send_sms_notifications = data['send_sms_notifications']
        if 'send_email_notifications' in data:
            config.send_email_notifications = data['send_email_notifications']
        if 'cancellation_hours' in data:
            config.cancellation_hours = data['cancellation_hours']
        
        config.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Configuration mise à jour',
            'config': config.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/services', methods=['GET'])
def get_partner_services(partner_id):
    """
    Récupérer tous les services d'un commerçant
    """
    try:
        services = Service.query.filter_by(
            partner_id=partner_id,
            is_active=True
        ).order_by(Service.display_order).all()
        
        return jsonify({
            'success': True,
            'services': [s.to_dict() for s in services]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/services', methods=['POST'])
def create_service(partner_id):
    """
    Créer un nouveau service
    """
    try:
        data = request.json
        
        # Validation
        if not data.get('name'):
            return jsonify({'success': False, 'error': 'Le nom du service est requis'}), 400
        if not data.get('price'):
            return jsonify({'success': False, 'error': 'Le prix est requis'}), 400
        if not data.get('duration_minutes'):
            return jsonify({'success': False, 'error': 'La durée est requise'}), 400
        
        service = Service(
            partner_id=partner_id,
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            peps_discount_percent=float(data.get('peps_discount_percent', 0)),
            peps_discount_amount=float(data.get('peps_discount_amount', 0)),
            duration_minutes=int(data['duration_minutes']),
            capacity=int(data.get('capacity', 1)),
            is_active=data.get('is_active', True),
            display_order=int(data.get('display_order', 0))
        )
        
        db.session.add(service)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Service créé',
            'service': service.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/services/<int:service_id>', methods=['PUT'])
def update_service(partner_id, service_id):
    """
    Mettre à jour un service
    """
    try:
        service = Service.query.filter_by(
            id=service_id,
            partner_id=partner_id
        ).first()
        
        if not service:
            return jsonify({'success': False, 'error': 'Service non trouvé'}), 404
        
        data = request.json
        
        if 'name' in data:
            service.name = data['name']
        if 'description' in data:
            service.description = data['description']
        if 'price' in data:
            service.price = float(data['price'])
        if 'peps_discount_percent' in data:
            service.peps_discount_percent = float(data['peps_discount_percent'])
        if 'peps_discount_amount' in data:
            service.peps_discount_amount = float(data['peps_discount_amount'])
        if 'duration_minutes' in data:
            service.duration_minutes = int(data['duration_minutes'])
        if 'capacity' in data:
            service.capacity = int(data['capacity'])
        if 'is_active' in data:
            service.is_active = data['is_active']
        if 'display_order' in data:
            service.display_order = int(data['display_order'])
        
        service.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Service mis à jour',
            'service': service.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/services/<int:service_id>', methods=['DELETE'])
def delete_service(partner_id, service_id):
    """
    Supprimer un service (soft delete)
    """
    try:
        service = Service.query.filter_by(
            id=service_id,
            partner_id=partner_id
        ).first()
        
        if not service:
            return jsonify({'success': False, 'error': 'Service non trouvé'}), 404
        
        service.is_active = False
        service.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Service désactivé'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/bookings', methods=['GET'])
def get_partner_bookings(partner_id):
    """
    Récupérer toutes les réservations d'un commerçant
    """
    try:
        # Filtres optionnels
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        status = request.args.get('status')
        
        query = Booking.query.filter_by(partner_id=partner_id)
        
        if start_date:
            query = query.filter(Booking.booking_date >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Booking.booking_date <= datetime.fromisoformat(end_date))
        if status:
            query = query.filter(Booking.status == status)
        
        bookings = query.order_by(Booking.booking_date.desc()).all()
        
        return jsonify({
            'success': True,
            'bookings': [b.to_dict() for b in bookings]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/bookings/<int:booking_id>/cancel', methods=['POST'])
def partner_cancel_booking(partner_id, booking_id):
    """
    Commerçant annule une réservation
    """
    try:
        booking = Booking.query.filter_by(
            id=booking_id,
            partner_id=partner_id
        ).first()
        
        if not booking:
            return jsonify({'success': False, 'error': 'Réservation non trouvée'}), 404
        
        if booking.status == 'cancelled':
            return jsonify({'success': False, 'error': 'Réservation déjà annulée'}), 400
        
        data = request.json
        
        booking.status = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        booking.cancelled_by = 'partner'
        booking.cancellation_reason = data.get('reason', '')
        booking.updated_at = datetime.utcnow()
        
        # Libérer le créneau
        creneau = Creneau.query.get(booking.creneau_id)
        if creneau:
            creneau.capacity_remaining += 1
            if creneau.capacity_remaining > 0:
                creneau.is_available = True
        
        db.session.commit()
        
        # TODO: Envoyer notification au membre
        
        return jsonify({
            'success': True,
            'message': 'Réservation annulée',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# ROUTES MEMBRE
# ===========================

@booking_bp.route('/api/member/partners/<int:partner_id>/availability', methods=['GET'])
def get_partner_availability(partner_id):
    """
    Récupérer les disponibilités pour un service donné.
    Cette fonction recherche des créneaux consécutifs disponibles.
    """
    try:
        # 1. Valider les paramètres
        year = int(request.args.get('year', datetime.now().year))
        month = int(request.args.get('month', datetime.now().month))
        service_id = request.args.get('service_id')

        if not service_id:
            return jsonify({'success': False, 'error': 'service_id est requis'}), 400

        # 2. Récupérer les informations nécessaires
        service = Service.query.get(service_id)
        if not service or service.partner_id != partner_id:
            return jsonify({'success': False, 'error': 'Service non trouvé'}), 404

        config = PartnerBookingConfig.query.filter_by(partner_id=partner_id).first()
        if not config or not config.is_enabled:
            return jsonify({'success': False, 'error': 'Réservation désactivée'}), 400

        # 3. Calculer le nombre de slots nécessaires
        service_duration = service.duration_minutes
        slot_duration = config.slot_duration_minutes
        required_slots = (service_duration + slot_duration - 1) // slot_duration

        # 4. Récupérer tous les créneaux du mois
        start_date = datetime(year, month, 1, tzinfo=pytz.UTC)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=pytz.UTC)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=pytz.UTC)

        all_creneaux = Creneau.query.filter(
            Creneau.partner_id == partner_id,
            Creneau.start_utc >= start_date,
            Creneau.start_utc < end_date
        ).order_by(Creneau.start_utc).all()

        # 5. Algorithme de recherche de créneaux consécutifs
        available_booking_slots = []
        if not all_creneaux:
            return jsonify({'success': True, 'creneaux': []}), 200

        for i in range(len(all_creneaux) - required_slots + 1):
            # Vérifier si la séquence de créneaux est consécutive et disponible
            is_sequence_valid = True
            for j in range(required_slots):
                current_creneau = all_creneaux[i+j]
                
                # Vérifier la disponibilité
                if not current_creneau.is_available or current_creneau.capacity_remaining <= 0:
                    is_sequence_valid = False
                    break
                
                # Vérifier la consécutivité (sauf pour le premier)
                if j > 0:
                    previous_creneau = all_creneaux[i+j-1]
                    expected_start = previous_creneau.start_utc + timedelta(minutes=slot_duration)
                    if current_creneau.start_utc != expected_start:
                        is_sequence_valid = False
                        break
            
            if is_sequence_valid:
                # Le premier créneau de la séquence est un slot de réservation valide
                valid_start_creneau = all_creneaux[i]
                available_booking_slots.append(valid_start_creneau)

        return jsonify({
            'success': True,
            'creneaux': [c.to_dict() for c in available_booking_slots]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/member/bookings', methods=['POST'])
def create_booking():
    """
    Créer une nouvelle réservation
    """
    try:
        data = request.json
        
        # Validation
        if not data.get('member_id'):
            return jsonify({'success': False, 'error': 'member_id requis'}), 400
        if not data.get('partner_id'):
            return jsonify({'success': False, 'error': 'partner_id requis'}), 400
        if not data.get('creneau_id'):
            return jsonify({'success': False, 'error': 'creneau_id requis'}), 400
        
        member_id = int(data['member_id'])
        partner_id = int(data['partner_id'])
        creneau_id = int(data['creneau_id'])
        service_id = data.get('service_id')
        
        # Vérifier que le créneau est disponible
        creneau = Creneau.query.get(creneau_id)
        if not creneau:
            return jsonify({'success': False, 'error': 'Créneau non trouvé'}), 404
        
        if not creneau.is_available or creneau.capacity_remaining <= 0:
            return jsonify({'success': False, 'error': 'Créneau non disponible'}), 400
        
        # Récupérer les informations du service
        service = None
        price_original = 0
        price_final = 0
        discount_applied = 0
        duration_minutes = 30  # Valeur par défaut
        
        if service_id:
            service = Service.query.get(service_id)
            if service:
                price_original = service.price
                
                # Calculer la réduction PEP'S
                if service.peps_discount_percent > 0:
                    discount_applied = price_original * (service.peps_discount_percent / 100)
                elif service.peps_discount_amount > 0:
                    discount_applied = service.peps_discount_amount
                
                price_final = price_original - discount_applied
                duration_minutes = service.duration_minutes
        
        # Créer la réservation
        booking = Booking(
            member_id=member_id,
            partner_id=partner_id,
            service_id=service_id,
            creneau_id=creneau_id,
            booking_date=creneau.start_utc,
            duration_minutes=duration_minutes,
            number_of_people=int(data.get('number_of_people', 1)),
            price_original=price_original,
            price_final=price_final,
            discount_applied=discount_applied,
            status='confirmed',
            member_notes=data.get('member_notes', '')
        )
        
        # Réduire la capacité du créneau
        creneau.capacity_remaining -= 1
        if creneau.capacity_remaining <= 0:
            creneau.is_available = False
        
        db.session.add(booking)
        db.session.commit()
        
        # TODO: Envoyer notifications
        # TODO: Créer événement Google Calendar
        
        return jsonify({
            'success': True,
            'message': 'Réservation créée',
            'booking': booking.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/member/<int:member_id>/bookings', methods=['GET'])
def get_member_bookings(member_id):
    """
    Récupérer toutes les réservations d'un membre
    """
    try:
        status = request.args.get('status')
        
        query = Booking.query.filter_by(member_id=member_id)
        
        if status:
            query = query.filter(Booking.status == status)
        
        bookings = query.order_by(Booking.booking_date.desc()).all()
        
        return jsonify({
            'success': True,
            'bookings': [b.to_dict() for b in bookings]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/member/bookings/<int:booking_id>/cancel', methods=['POST'])
def member_cancel_booking(booking_id):
    """
    Membre annule une réservation
    """
    try:
        data = request.json
        member_id = data.get('member_id')
        
        booking = Booking.query.filter_by(
            id=booking_id,
            member_id=member_id
        ).first()
        
        if not booking:
            return jsonify({'success': False, 'error': 'Réservation non trouvée'}), 404
        
        if booking.status == 'cancelled':
            return jsonify({'success': False, 'error': 'Réservation déjà annulée'}), 400
        
        # Vérifier le délai d'annulation
        config = PartnerBookingConfig.query.filter_by(partner_id=booking.partner_id).first()
        if config:
            cancellation_deadline = booking.booking_date - timedelta(hours=config.cancellation_hours)
            if datetime.utcnow() > cancellation_deadline:
                return jsonify({
                    'success': False,
                    'error': f'Annulation impossible (délai de {config.cancellation_hours}h dépassé)'
                }), 400
        
        booking.status = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        booking.cancelled_by = 'member'
        booking.cancellation_reason = data.get('reason', '')
        booking.updated_at = datetime.utcnow()
        
        # Libérer le créneau
        creneau = Creneau.query.get(booking.creneau_id)
        if creneau:
            creneau.capacity_remaining += 1
            if creneau.capacity_remaining > 0:
                creneau.is_available = True
        
        db.session.commit()
        
        # TODO: Envoyer notification au commerçant
        # TODO: Supprimer événement Google Calendar
        
        return jsonify({
            'success': True,
            'message': 'Réservation annulée',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


# ===========================
# ROUTES GOOGLE CALENDAR
# ===========================

@booking_bp.route('/api/partner/<int:partner_id>/google-calendar/connect', methods=['POST'])
def connect_google_calendar(partner_id):
    """
    Connecter Google Calendar (OAuth 2.0)
    TODO: Implémenter le flow OAuth complet
    """
    return jsonify({
        'success': False,
        'error': 'OAuth Google Calendar à implémenter'
    }), 501


@booking_bp.route('/api/partner/<int:partner_id>/google-calendar/disconnect', methods=['POST'])
def disconnect_google_calendar(partner_id):
    """
    Déconnecter Google Calendar
    """
    try:
        token = GoogleCalendarToken.query.filter_by(partner_id=partner_id).first()
        
        if token:
            token.is_active = False
            token.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Google Calendar déconnecté'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@booking_bp.route('/api/partner/<int:partner_id>/google-calendar/status', methods=['GET'])
def get_google_calendar_status(partner_id):
    """
    Vérifier le statut de la connexion Google Calendar
    """
    try:
        token = GoogleCalendarToken.query.filter_by(partner_id=partner_id).first()
        
        if not token:
            return jsonify({
                'success': True,
                'connected': False
            }), 200
        
        return jsonify({
            'success': True,
            'connected': token.is_active,
            'last_sync': token.last_sync_at.isoformat() if token.last_sync_at else None,
            'calendar_id': token.calendar_id
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
