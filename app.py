from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app) # HTML-ൽ നിന്ന് API വിളിക്കാൻ ഇത് സഹായിക്കും

# Database Setup (SQLite)
def init_db():
    conn = sqlite3.connect('agri_portal.db')
    cursor = conn.cursor()
    # ഉപയോക്താക്കളുടെ വിവരങ്ങളും ചോദ്യങ്ങളും സേവ് ചെയ്യാൻ ഒരു Table ഉണ്ടാക്കുന്നു
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_name TEXT,
            location TEXT,
            crop TEXT,
            user_query TEXT,
            language TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# ആപ്പ് സ്റ്റാർട്ട് ചെയ്യുമ്പോൾ ഡാറ്റാബേസ് റെഡിയാക്കും
init_db()

# 1. ഭാഷകൾക്കനുസരിച്ചുള്ള മറുപടികൾ (Multi-language Dictionary)
TRANSLATIONS = {
    'ml': {
        'success': "നിങ്ങളുടെ ചോദ്യം ലഭിച്ചു. {location} പ്രദേശത്തെ {crop} കൃഷിയെക്കുറിച്ചുള്ള വിവരങ്ങൾ പരിശോധിക്കുന്നു. നല്ല വിത്തുകളും ശരിയായ ജലസേചനവും ഉറപ്പാക്കുക.",
        'error': "വിവരങ്ങൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല."
    },
    'en': {
        'success': "Query received. Analyzing information for {crop} in {location}. Ensure good seed selection and proper irrigation.",
        'error': "Failed to fetch information."
    },
    'hi': {
        'success': "प्रश्न प्राप्त हुआ। {location} में {crop} के बारे में जानकारी का विश्लेषण किया जा रहा है।",
        'error': "जानकारी प्राप्त करने में विफल।"
    }
}

# 2. Frontend-ൽ നിന്നുള്ള ചോദ്യങ്ങൾ സ്വീകരിച്ച് DB-യിലേക്ക് മാറ്റുന്ന API Endpoint
@app.route('/api/ask-advisor', methods=['POST'])
def ask_advisor():
    data = request.json
    
    farmer_name = data.get('farmerName')
    location = data.get('location')
    crop = data.get('crop')
    user_query = data.get('query')
    lang = data.get('language', 'ml') # ഡിഫോൾട്ട് ആയി മലയാളം

    # SQLite ഡാറ്റാബേസിലേക്ക് ഡാറ്റ Save ചെയ്യുന്നു
    try:
        conn = sqlite3.connect('agri_portal.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO queries (farmer_name, location, crop, user_query, language)
            VALUES (?, ?, ?, ?, ?)
        ''', (farmer_name, location, crop, user_query, lang))
        conn.commit()
        conn.close()

        # തിരഞ്ഞെടുത്ത് ഭാഷ അനുസരിച്ച് മറുപടി നൽകുന്നു
        template = TRANSLATIONS.get(lang, TRANSLATIONS['ml'])['success']
        advice_text = template.format(location=location, crop=crop)

        return jsonify({
            'success': True,
            'advice': advice_text
        })
    except Exception as e:
        print("Error:", e)
        return jsonify({'success': False, 'message': 'Database Error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)