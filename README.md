# Biratnagar Turf Booking — simple Flask edition

Only the essential files are kept in the project root:

- `app.py` — Python server and booking API
- `index.html` — website structure
- `style.css` — design
- `script.js` — booking interactions
- `schema.sql` — one-time database setup
- `requirements.txt` — Python dependency list

## What makes bookings shared online

The browser never stores the official booking list. `app.py` saves it to a Supabase database and the unique database index prevents two players booking the same futsal, date, and hour.

## Set it up

1. Create a Supabase project. In its **SQL Editor**, run the full contents of `schema.sql` once.
2. Copy `.env.example` and rename the copy to `.env`. Keep your three secret values only in `.env`: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `OWNER_PIN`. `.env` is already excluded from GitHub.
3. Install Python packages and run locally:

   ```powershell
   py -m pip install -r requirements.txt
   py app.py
   ```

   Open `http://127.0.0.1:5000`.

4. Push this folder to a new GitHub repository. For production, create a Render Web Service from that repository. Use build command `pip install -r requirements.txt` and start command `gunicorn app:app --bind 0.0.0.0:$PORT`. Add the same three values as Render Environment Variables.

## Important security rule

`SUPABASE_SECRET_KEY` and `OWNER_PIN` are secrets. Put them only in `.env` locally and Render Environment Variables. Never paste them in GitHub, HTML, CSS, JavaScript, or chat.
