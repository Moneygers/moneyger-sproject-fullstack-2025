import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.api_key = settings.TEXTBEE_API_KEY
        self.device_id = settings.TEXTBEE_DEVICE_ID
        self.base_url = settings.TEXTBEE_BASE_URL
        
        if not all([self.api_key, self.device_id]):
            logger.error("TextBee credentials not configured properly!")
            logger.error("Please set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID in your environment variables")
            self.is_configured = False
        else:
            self.is_configured = True
            logger.info("TextBee SMS Service initialized successfully")
            logger.info(f"Device ID: {self.device_id}")
            # Don't log the full API key for security, just show if it's set
            logger.info(f"API Key configured: {'Yes' if self.api_key and self.api_key != 'YOUR_API_KEY' else 'No'}")
    
    def format_phone_number(self, phone_number):
        """
        Format phone number to international format for TextBee
        """
        if not phone_number:
            return None
            
        # Remove all non-digit characters except +
        cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # If already has country code, return as is
        if cleaned.startswith('+'):
            return cleaned
        
        # Handle Philippines numbers (most common case for your system)
        if cleaned.startswith('09'):
            return '+63' + cleaned[1:]  # Replace 09 with +639
        elif cleaned.startswith('9') and len(cleaned) == 10:
            return '+63' + cleaned  # Add +63 prefix
        elif cleaned.startswith('63') and len(cleaned) == 12:
            return '+' + cleaned  # Add + prefix
        
        # Handle US numbers
        elif len(cleaned) == 10:
            return '+1' + cleaned  # Assume US number
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            return '+' + cleaned  # US number with country code
        
        # Return as is if we can't determine format
        return '+' + cleaned if not cleaned.startswith('+') else cleaned
    
    def send_sms(self, to_number, message):
        """
        Send SMS message using TextBee API
        """
        if not self.is_configured:
            logger.error("TextBee SMS service not configured. Cannot send SMS.")
            return False
        
        try:
            # Format phone number
            formatted_number = self.format_phone_number(to_number)
            
            if not formatted_number:
                logger.error(f"Invalid phone number format: {to_number}")
                return False
            
            # Prepare API request with correct headers
            url = f"{self.base_url}/gateway/devices/{self.device_id}/sendSMS"
            headers = {
                'x-api-key': self.api_key,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            payload = {
                'recipients': [formatted_number],
                'message': message
            }
            
            logger.info(f"Sending SMS to {formatted_number} via TextBee")
            logger.info(f"URL: {url}")
            logger.info(f"Message: {message[:50]}...")
            
            # Send request to TextBee API
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            logger.info(f"TextBee API Response Status: {response.status_code}")
            logger.info(f"TextBee API Response: {response.text}")
            
            if response.status_code in [200, 201]:  # Accept both 200 and 201 as success
                try:
                    response_data = response.json()
                    logger.info(f"✅ SMS sent successfully via TextBee!")
                    logger.info(f"Response data: {response_data}")
                    return True
                except Exception as json_error:
                    logger.error(f"Failed to parse JSON response: {json_error}")
                    logger.error(f"Raw response: {response.text}")
                    return False
            elif response.status_code == 401:
                logger.error(f"❌ TextBee API Authentication Error (401)")
                logger.error(f"Please check your TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID")
                logger.error(f"Current API Key starts with: {self.api_key[:10]}..." if self.api_key else "None")
                logger.error(f"Current Device ID: {self.device_id}")
                return False
            else:
                logger.error(f"❌ TextBee API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"❌ TextBee API timeout when sending SMS to {to_number}")
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ TextBee API request failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to send SMS to {to_number}: {str(e)}")
            return False
    
    def send_reservation_approved_sms(self, reservation):
        """
        Send SMS notification when reservation is approved
        """
        try:
            # Format slot display
            slot_display = f"{reservation.park_slot.structure}-{reservation.park_slot.section}-{reservation.park_slot.slotNo}"
            
            # Format date
            date_str = reservation.date.strftime('%B %d, %Y')
            
            message = (
                f"🎉 RESERVATION APPROVED!\n\n"
                f"📍 Slot: {slot_display}\n"
                f"📅 Date: {date_str}\n"
                f"🚗 Vehicle: {reservation.plate_no}\n"
                f"👤 Name: {reservation.name}\n\n"
                f"Please arrive on time. Thank you for choosing our parking service!\n\n"
                f"- MoneyGers Parking Management"
            )
            
            logger.info(f"Sending approval SMS for reservation {reservation.id} to {reservation.mobileNo}")
            success = self.send_sms(reservation.mobileNo, message)
            
            return success
            
        except Exception as e:
            logger.error(f"Error in send_reservation_approved_sms: {str(e)}")
            return False
    
    def send_reservation_rejected_sms(self, reservation):
        """
        Send SMS notification when reservation is rejected
        """
        try:
            # Format slot display
            slot_display = f"{reservation.park_slot.structure}-{reservation.park_slot.section}-{reservation.park_slot.slotNo}"
            
            # Format date
            date_str = reservation.date.strftime('%B %d, %Y')
            
            message = (
                f"❌ RESERVATION REJECTED\n\n"
                f"📍 Slot: {slot_display}\n"
                f"📅 Date: {date_str}\n"
                f"🚗 Vehicle: {reservation.plate_no}\n\n"
                f"We apologize for the inconvenience. Please try booking another slot or contact us for assistance.\n\n"
                f"- MoneyGers Parking Management"
            )
            
            logger.info(f"Sending rejection SMS for reservation {reservation.id} to {reservation.mobileNo}")
            success = self.send_sms(reservation.mobileNo, message)
            
            return success
            
        except Exception as e:
            logger.error(f"Error in send_reservation_rejected_sms: {str(e)}")
            return False
    
    def send_arrival_confirmation_sms(self, reservation):
        """
        Send SMS when customer arrival is recorded
        """
        try:
            # Format slot display
            slot_display = f"{reservation.park_slot.structure}-{reservation.park_slot.section}-{reservation.park_slot.slotNo}"
            
            # Format arrival time - convert to local timezone first
            if reservation.arrival_time:
                local_arrival_time = timezone.localtime(reservation.arrival_time)
                arrival_time_str = local_arrival_time.strftime('%I:%M %p')
            else:
                arrival_time_str = timezone.localtime(timezone.now()).strftime('%I:%M %p')
            
            message = (
                f"✅ ARRIVAL CONFIRMED!\n\n"
                f"📍 Slot: {slot_display}\n"
                f"🚗 Vehicle: {reservation.plate_no}\n"
                f"⏰ Arrival: {arrival_time_str}\n\n"
                f"Welcome! Your parking session has started. Enjoy your stay!\n\n"
                f"- MoneyGers Parking Management"
            )
            
            logger.info(f"Sending arrival confirmation SMS for reservation {reservation.id} to {reservation.mobileNo}")
            success = self.send_sms(reservation.mobileNo, message)
            
            return success
            
        except Exception as e:
            logger.error(f"Error in send_arrival_confirmation_sms: {str(e)}")
            return False
    
    def send_reservation_reminder_sms(self, reservation):
        """
        Send SMS reminder for upcoming reservation
        """
        try:
            # Format slot display
            slot_display = f"{reservation.park_slot.structure}-{reservation.park_slot.section}-{reservation.park_slot.slotNo}"
            
            # Format date
            date_str = reservation.date.strftime('%B %d, %Y')
            
            message = (
                f"⏰ PARKING REMINDER\n\n"
                f"Your reservation is TODAY!\n\n"
                f"📍 Slot: {slot_display}\n"
                f"📅 Date: {date_str}\n"
                f"🚗 Vehicle: {reservation.plate_no}\n\n"
                f"Don't forget to arrive on time. See you soon!\n\n"
                f"- MoneyGers Parking Management"
            )
            
            logger.info(f"Sending reminder SMS for reservation {reservation.id} to {reservation.mobileNo}")
            success = self.send_sms(reservation.mobileNo, message)
            
            return success
            
        except Exception as e:
            logger.error(f"Error in send_reservation_reminder_sms: {str(e)}")
            return False
    
    def get_service_status(self):
        """
        Get TextBee service status for debugging
        """
        return {
            'service': 'TextBee',
            'configured': self.is_configured,
            'api_key_set': bool(self.api_key and self.api_key != 'default'),
            'device_id_set': bool(self.device_id and self.device_id != 'default'),
            'base_url': self.base_url,
            'api_key_preview': f"{self.api_key[:10]}..." if self.api_key else "None",
            'device_id': self.device_id
        }

class OTPService:
    def __init__(self):
        self.sms_service = sms_service
    
    def send_otp(self, phone_number):
        """
        Generate and send OTP to phone number
        """
        from .models import ReservationOTP
        
        try:
            # Format phone number
            formatted_number = self.sms_service.format_phone_number(phone_number)
            if not formatted_number:
                return False, "Invalid phone number format"
            
            # Check if there's a recent unused OTP (within last 2 minutes)
            recent_otp = ReservationOTP.objects.filter(
                phone_number=formatted_number,
                is_used=False,
                created_at__gte=timezone.now() - timedelta(minutes=2)
            ).first()
            
            if recent_otp and not recent_otp.is_expired():
                return False, "Please wait before requesting a new OTP"
            
            # Create new OTP
            if getattr(settings, 'OTP_DEVELOPMENT_MODE', True):
                # Development mode: use fixed OTP
                otp = ReservationOTP.objects.create(
                    phone_number=formatted_number,
                    otp_code=getattr(settings, 'OTP_TEST_CODE', '123456')
                )
                logger.info(f"Development mode: OTP {otp.otp_code} created for {formatted_number}")
                return True, f"OTP sent successfully (DEV MODE: {otp.otp_code})"
            else:
                # Production mode: generate random OTP and send SMS
                otp = ReservationOTP.objects.create(phone_number=formatted_number)
                
                # Send SMS
                message = (
                    f"🔐 MoneyGers Parking - OTP Verification\n\n"
                    f"Your verification code is: {otp.otp_code}\n\n"
                    f"This code will expire in 5 minutes.\n"
                    f"Do not share this code with anyone.\n\n"
                    f"- MoneyGers Parking Management"
                )
                
                success = self.sms_service.send_sms(formatted_number, message)
                
                if success:
                    logger.info(f"OTP sent successfully to {formatted_number}")
                    return True, "OTP sent successfully"
                else:
                    logger.error(f"Failed to send OTP to {formatted_number}")
                    return False, "Failed to send OTP"
                
        except Exception as e:
            logger.error(f"Error in send_otp: {str(e)}")
            return False, f"Error sending OTP: {str(e)}"
    
    def verify_otp(self, phone_number, otp_code):
        """
        Verify OTP for phone number
        """
        from .models import ReservationOTP
        
        try:
            formatted_number = self.sms_service.format_phone_number(phone_number)
            if not formatted_number:
                return False, "Invalid phone number format"
            
            # Get the most recent unused OTP for this phone number
            otp_record = ReservationOTP.objects.filter(
                phone_number=formatted_number,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp_record:
                return False, "No OTP found for this phone number"
            
            # Verify the OTP
            success, message = otp_record.verify(otp_code)
            return success, message
            
        except Exception as e:
            logger.error(f"Error in verify_otp: {str(e)}")
            return False, f"Error verifying OTP: {str(e)}"
    
    def cleanup_expired_otps(self):
        """
        Clean up expired OTPs (should be run periodically)
        """
        from .models import ReservationOTP
        
        try:
            expired_count = ReservationOTP.objects.filter(
                expires_at__lt=timezone.now()
            ).delete()[0]
            
            logger.info(f"Cleaned up {expired_count} expired OTPs")
            return expired_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired OTPs: {str(e)}")
            return 0

# Create global instances
sms_service = SMSService()
otp_service = OTPService()
