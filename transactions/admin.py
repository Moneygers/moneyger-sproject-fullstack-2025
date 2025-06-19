from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'customer_name', 'amount', 'transaction_type', 'payment_method', 'created_at']
    list_filter = ['transaction_type', 'payment_method', 'created_at']
    search_fields = ['receipt_number', 'customer_name', 'license_plate']
    ordering = ['-created_at']
    readonly_fields = ['receipt_number', 'created_at']
