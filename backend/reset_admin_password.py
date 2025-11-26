"""
Script to manually reset the admin password in the database
Run this if login is not working
"""
import pymysql
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

def reset_admin_password():
    try:
        # Connect to database
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 1429)),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'rural_health'),
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()
        
        # Generate new password hash for 'admin123'
        new_password = 'admin123'
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        print(f"Generated hash: {password_hash.decode('utf-8')}")
        print(f"Hash length: {len(password_hash.decode('utf-8'))}")
        
        # Update admin user
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE username = 'admin'",
            (password_hash.decode('utf-8'),)
        )
        
        affected = cursor.rowcount
        conn.commit()
        
        if affected > 0:
            print(f"✓ Admin password reset successfully!")
            print(f"  Username: admin")
            print(f"  Password: {new_password}")
            
            # Verify the update
            cursor.execute("SELECT username, password_hash FROM users WHERE username = 'admin'")
            user = cursor.fetchone()
            if user:
                print(f"\n✓ Verification:")
                print(f"  Username: {user['username']}")
                print(f"  Hash stored: {user['password_hash'][:20]}...")
                
                # Test the password
                test_match = bcrypt.checkpw(
                    new_password.encode('utf-8'),
                    user['password_hash'].encode('utf-8')
                )
                print(f"  Password test: {'✓ PASS' if test_match else '✗ FAIL'}")
        else:
            print("✗ Admin user not found in database")
            print("  Creating admin user...")
            cursor.execute(
                "INSERT INTO users (username, password_hash, full_name, role) VALUES (%s, %s, %s, %s)",
                ('admin', password_hash.decode('utf-8'), 'System Administrator', 'admin')
            )
            conn.commit()
            print("✓ Admin user created successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("=" * 50)
    print("Admin Password Reset Tool")
    print("=" * 50)
    reset_admin_password()
    print("=" * 50)
