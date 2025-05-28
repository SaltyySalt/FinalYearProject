from smartcard.System import readers
from smartcard.util import toHexString
from pymongo import MongoClient
from datetime import datetime, timezone
from time import sleep
import qrcode
import os
import time

# MongoDB connection
MONGO_URI = "mongodb+srv://Admin1:admin1@nfc-cluster.tthwnws.mongodb.net/?retryWrites=true&w=majority&appName=NFC-Cluster"
client = MongoClient(MONGO_URI)
db = client["nfc_project"]
collection = db["card_uids"]

# Web registration base URL
REGISTRATION_URL = "https://securedormregistration.up.railway.app/register?uid="

# # Ensure UID is unique
# collection.create_index("uid", unique=True)

# # Function to store UID
# def store_uid(uid):
#     if collection.find_one({"uid": uid}):
#         print(f"UID {uid} already exists.")
#         return

#     entry = {
#         "uid": uid,
#         "timestamp": datetime.now(timezone.utc)
#     }
#     collection.insert_one(entry)
#     print(f"UID {uid} stored in MongoDB.")

# # Main reader loop
# def read_cards_continuously():
#     print("Waiting for NFC cards...")
#     last_uid = None

#     while True:
#         try:
#             r = readers()
#             if not r:
#                 print("No NFC reader detected.")
#                 sleep(2)
#                 continue

#             reader = r[0]
#             connection = reader.createConnection()
#             connection.connect()

#             GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
#             data, sw1, sw2 = connection.transmit(GET_UID)

#             if sw1 == 0x90 and sw2 == 0x00:
#                 uid = ''.join(format(x, '02X') for x in data)

#                 if uid != last_uid:
#                     print(f"Card UID: {uid}")
#                     store_uid(uid)
#                     last_uid = uid
#                 else:
#                     print("Same card still on reader. Waiting for removal...")

#             else:
#                 last_uid = None  # Reset when no card is present

#         except Exception as e:
#             last_uid = None
#             # Don't spam errors — just wait and retry
#             sleep(1)

#         sleep(1)  # Delay to avoid rapid polling

# # Start the loop
# read_cards_continuously()

# def store_uid(uid):
#     # Search for UID in the DB
#     existing = collection.find_one({"uid": uid})

#     if existing:
#         name = existing.get("name", "user")
#         print(f"You have registered, {name}! Welcome.")
#     else:
#         print("New card detected. Generating registration QR code...")
#         generate_qr(uid)
# # Ensure you do not insert the UID here — let the web registration site handle that after the user submits the form.

# def generate_qr(uid):
#     # Create URL with UID in query parameter
#     registration_link = f"{REGISTRATION_URL}?uid={uid}"
#     print(f"Registration Link: {registration_link}")

#     # Generate QR
#     qr = qrcode.make(registration_link)

#     # Save or display QR
#     qr_path = f"qr_{uid}.png"
#     qr.save(qr_path)
#     print(f"QR code saved to {qr_path}")

#     # Optional: Open the image (requires GUI on Raspberry Pi)
#     try:
#         os.system(f"xdg-open {qr_path}")  # For RPi with GUI
#     except Exception as e:
#         print("Couldn't open QR visually:", e)

# def read_cards():
#     print("Waiting for NFC cards...")
#     last_uid = None

#     while True:
#         try:
#             r = readers()
#             if not r:
#                 print("No NFC reader found.")
#                 sleep(2)
#                 continue

#             reader = r[0]
#             connection = reader.createConnection()
#             connection.connect()

#             GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
#             data, sw1, sw2 = connection.transmit(GET_UID)

#             if sw1 == 0x90 and sw2 == 0x00:
#                 uid = ''.join(format(x, '02X') for x in data)

#                 if uid != last_uid:
#                     print(f"Card UID: {uid}")
#                     store_uid(uid)
#                     last_uid = uid
#                 else:
#                     print("Same card still on reader...")

#             else:
#                 last_uid = None

#         except Exception as e:
#             print("Waiting for card...")
#             last_uid = None
#             sleep(1)

#         sleep(1)

# # Start
# read_cards()





def read_uid():
    r = readers()
    if not r:
        print("No NFC reader found.")
        return None
    reader = r[0]
    conn = reader.createConnection()
    conn.connect()
    GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
    data, sw1, sw2 = conn.transmit(GET_UID)
    if sw1 == 0x90:
        return ''.join(format(x, '02X') for x in data)
    return None

def generate_qr(url):
    qr = qrcode.make(url)
    qr.show()

while True:
    print("Place your NFC card...")
    uid = read_uid()
    if uid:
        user = collection.find_one({ "uid": uid })
        if user:
            print(f"✅ Card already registered to {user.get('name', 'Unknown')}")
        else:
            url = REGISTRATION_SITE + uid
            print("🆕 New card detected. Show this QR to the user:")
            generate_qr(url)
    time.sleep(2)
