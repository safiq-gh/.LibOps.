from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    LIBRARIAN = "librarian"
    MEMBER = "member"


class Status(str, Enum):
    RETURNED = "returned"
    BORROWED = "borrowed"
