from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Permission class for admin-only access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin

class IsStaffUser(permissions.BasePermission):
    """Permission class for staff (clerk/admin) access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff_member

class IsCustomerUser(permissions.BasePermission):
    """Permission class for customer access"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_customer

class IsOwnerOrStaff(permissions.BasePermission):
    """Permission class for owner or staff access to objects"""
    def has_object_permission(self, request, view, obj):
        # Staff can access any object
        if request.user.is_staff_member:
            return True
        # Customers can only access their own objects
        return hasattr(obj, 'customer') and obj.customer == request.user
