# Marketing Form Builder

A full-stack, minimalistic form builder and response management app. Built with React (frontend) and Express/TypeScript (backend), using MySQL for persistent storage.

## Features
- Drag-and-drop form builder with text, dropdown, and table components
- Conditional logic for dropdowns (jump to specific questions)
- Static and dynamic tables
- Form validation (required, min/max, options, etc.)
- Save, edit, delete forms
- Submit and view responses

## Project Structure

```
FormBuilder/
├── client/      # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── server/      # Express backend
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js & npm
- MySQL database

### Setup
1. **Clone the repo:**
   ```
   git clone https://github.com/yourusername/FormBuilder.git
   cd FormBuilder
   ```

2. **Configure environment variables:**
   - Create `.env` in `server/` with:
     ```
     DB_HOST=your_db_host
     DB_USER=your_db_user
     DB_PASSWORD=your_db_password
     DB_DATABASE=your_db_name
     ```

3. **Install dependencies:**
   ```
   cd client && npm install
   cd ../server && npm install
   ```

4. **Set up MySQL tables:**
   No need, as there are functions to ensure tables exist, and they will be automatically created

### Running
- **Start the backend:**
  ```
  cd server
  npm run start
  ```
- **Start the frontend:**
  ```
  cd client
  npm run start
  ```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8080`.

## API Endpoints
- `POST /api/forms` — Create form
- `GET /api/forms` — List forms
- `GET /api/forms/:id` — Get form
- `PUT /api/forms/:id` — Update form
- `DELETE /api/forms/:id` — Delete form
- `POST /api/forms/:id/responses` — Submit response
- `GET /api/forms/:id/responses` — List responses
- `DELETE /api/forms/:id/responses` — Delete responses

