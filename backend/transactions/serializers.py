from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction data"""
    class Meta:
        model = Transaction
        fields = ['id', 'allocation', 'reservation', 'amount', 'transaction_type',
                 'payment_method', 'receipt_number', 'customer_name', 'license_plate',
                 'processed_by', 'created_at']

class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout process"""
    allocation_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Transaction.PAYMENT_METHODS)
