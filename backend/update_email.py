import sqlite3

conn = sqlite3.connect('atlas.db')
cursor = conn.cursor()

# Update the email
cursor.execute("UPDATE users SET email = 'promsfriday@gmail.com' WHERE email = 'user1@test.com'")
conn.commit()

# Verify the change
cursor.execute("SELECT id, email, full_name FROM users")
users = cursor.fetchall()
print("Users in database:")
for user in users:
    print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")

conn.close()
print("\n✅ Email update complete!")
