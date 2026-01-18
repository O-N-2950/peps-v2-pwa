import os
from twilio.rest import Client

def send_sms(to_number, message_body):
    sid = os.getenv('TWILIO_ACCOUNT_SID')
    token = os.getenv('TWILIO_AUTH_TOKEN')
    sender = os.getenv('TWILIO_PHONE_NUMBER')

    if not sid or not token:
        print(f"📱 [SMS SIMULÉ] Vers: {to_number} | Msg: {message_body}")
        return True

    try:
        client = Client(sid, token)
        msg = client.messages.create(body=message_body, from_=sender, to=to_number)
        print(f"✅ SMS envoyé: {msg.sid}")
        return True
    except Exception as e:
        print(f"❌ Erreur SMS: {e}")
        return False
