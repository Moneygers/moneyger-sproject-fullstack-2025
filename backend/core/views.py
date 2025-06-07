from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import ParkingSlot, Reservation, ParkingFee
from django.utils import timezone
from django.contrib.auth.decorators import login_required
import json

@login_required
def allocate_slot(request):
    if not request.user.is_clerk and not request.user.is_admin:
        return JsonResponse({"error": "Only clerks and admins can allocate slots"}, status=403)
    if request.method == "POST":
        data = json.loads(request.body)
        slot_number = data.get("slot_number")
        plate_number = data.get("plate_number")
        slot = get_object_or_404(ParkingSlot, slot_number=slot_number)
        if slot.is_occupied or slot.is_reserved:
            return JsonResponse({"error": "Slot is occupied or reserved"}, status=400)
        slot.is_occupied = True
        slot.plate_number = plate_number
        slot.save()
        ParkingFee.objects.create(slot=slot, plate_number=plate_number)
        return JsonResponse({"message": f"Slot {slot_number} allocated", "slot": slot_number})
    return JsonResponse({"error": "POST request required"}, status=405)

@login_required
def reserve_slot(request):
    if not request.user.is_clerk and not request.user.is_admin:
        return JsonResponse({"error": "Only clerks and admins can reserve slots"}, status=403)
    if request.method == "POST":
        data = json.loads(request.body)
        slot_number = data.get("slot_number")
        customer_name = data.get("customer_name")
        slot = get_object_or_404(ParkingSlot, slot_number=slot_number)
        if slot.is_occupied or slot.is_reserved:
            return JsonResponse({"error": "Slot is occupied or reserved"}, status=400)
        slot.is_reserved = True
        slot.save()
        Reservation.objects.create(slot=slot, customer_name=customer_name)
        return JsonResponse({"message": f"Slot {slot_number} reserved for {customer_name}"})
    return JsonResponse({"error": "POST request required"}, status=405)

def search_slots(request):
    available_slots = ParkingSlot.objects.filter(is_occupied=False, is_reserved=False)
    slots_data = [{"slot_number": slot.slot_number} for slot in available_slots]
    return JsonResponse({"available_slots": slots_data})

@login_required
def update_fee(request):
    if not request.user.is_clerk and not request.user.is_admin:
        return JsonResponse({"error": "Only clerks and admins can update fees"}, status=403)
    if request.method == "POST":
        data = json.loads(request.body)
        slot_number = data.get("slot_number")
        end_time = data.get("end_time")
        slot = get_object_or_404(ParkingSlot, slot_number=slot_number)
        fee = get_object_or_404(ParkingFee, slot=slot, end_time__isnull=True)
        fee.end_time = timezone.datetime.fromisoformat(end_time)
        duration = (fee.end_time - fee.start_time).total_seconds() / 3600  # Hours
        fee.total_fee = duration * fee.rate_per_hour
        fee.save()
        slot.is_occupied = False
        slot.plate_number = None
        slot.save()
        return JsonResponse({"message": f"Fee updated for {slot_number}: ${fee.total_fee}"})
    return JsonResponse({"error": "POST request required"}, status=405)

def register_customer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        customer_name = data.get("customer_name")
        return JsonResponse({"message": f"Customer {customer_name} registered", "customer_name": customer_name})
    return JsonResponse({"error": "POST request required"}, status=405)