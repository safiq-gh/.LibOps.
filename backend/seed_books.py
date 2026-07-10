from app.db.session import SessionLocal
from app.models.books import Book

def seed_books():
    db = SessionLocal()
    try:
        books = [
            {
                "title": "Don Quixote",
                "author": "Miguel de Cervantes",
                "isbn": "9780142437230",
                "publisher": "Penguin Classics",
                "category": "Classic",
                "published_year": 1605,
                "total_copies": 3,
                "available_copies": 3,
                "cover_image_url": "https://covers.openlibrary.org/b/id/10522197-L.jpg"
            },
            {
                "title": "The Brothers Karamazov",
                "author": "Fyodor Dostoevsky",
                "isbn": "9780374528379",
                "publisher": "Farrar, Straus and Giroux",
                "category": "Literature",
                "published_year": 1880,
                "total_copies": 4,
                "available_copies": 4,
                "cover_image_url": "https://covers.openlibrary.org/b/id/12316499-L.jpg"
            },
            {
                "title": "Brave New World",
                "author": "Aldous Huxley",
                "isbn": "9780060850524",
                "publisher": "Harper Perennial",
                "category": "Science Fiction",
                "published_year": 1932,
                "total_copies": 5,
                "available_copies": 5,
                "cover_image_url": "https://covers.openlibrary.org/b/id/8261313-L.jpg"
            },
            {
                "title": "The Metamorphosis",
                "author": "Franz Kafka",
                "isbn": "9780553213690",
                "publisher": "Bantam Classics",
                "category": "Classic",
                "published_year": 1915,
                "total_copies": 2,
                "available_copies": 2,
                "cover_image_url": "https://covers.openlibrary.org/b/id/8060893-L.jpg"
            },
            {
                "title": "The Lord of the Rings",
                "author": "J.R.R. Tolkien",
                "isbn": "9780544003415",
                "publisher": "Mariner Books",
                "category": "Fantasy",
                "published_year": 1954,
                "total_copies": 6,
                "available_copies": 6,
                "cover_image_url": "https://covers.openlibrary.org/b/id/8259439-L.jpg"
            }
        ]

        count = 0
        for book_data in books:
            existing = db.query(Book).filter_by(title=book_data["title"]).first()
            if not existing:
                book = Book(**book_data)
                db.add(book)
                count += 1
        
        db.commit()
        print(f"Successfully seeded {count} new books!")
    
    except Exception as e:
        print(f"Error seeding books: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_books()
