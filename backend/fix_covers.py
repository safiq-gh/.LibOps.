import asyncio
from app.db.session import SessionLocal
from app.models.books import Book

def fix_covers():
    db = SessionLocal()
    try:
        books = db.query(Book).all()
        count = 0
        for book in books:
            if book.isbn:
                # Update cover to use the standard OpenLibrary ISBN endpoint
                new_cover = f"https://covers.openlibrary.org/b/isbn/{book.isbn}-L.jpg"
                book.cover_image_url = new_cover
                count += 1
                
        db.commit()
        print(f"Successfully updated {count} book covers to match their exact ISBNs!")
    except Exception as e:
        print(f"Error updating covers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_covers()
