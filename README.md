![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.2+-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-3.9+-000000?logo=express&logoColor=white)
![Node](https://img.shields.io/badge/TsNode-10.9+-339933?logo=tsnode&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
# Easy Form Builder
![photo](/resources/home.png)

A full-stack, minimalistic form builder and response management app. Built with React (frontend) and Express/TypeScript (backend), using MySQL for persistent storage.

---

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

---

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
   cd server && npm install
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

---

## Features

### Drag-and-drop form builder with text, dropdown, and table components with validation rules (required, min/max, options)

![photo](/resources/edit.png)
### Conditional logic for dropdowns (jump to specific questions)

![photo](/resources/dropdown.png)
### Static and dynamic tables

![photo](/resources/tables.png)
### Save forms and preview

![photo](/resources/preview.png)
### Submit and view responses

![photo](/resources/results.png)

---

## Acknowledgements

- My first Typescript project, using project-based learning to pick up this language.

- Built in a focused sprint (< 1 week) to demonstrate full-stack capability.

- Inspired by Google Forms, Typeform and real form builders, will continue to add more special features later.

- learning how to port forward and deploy on github pages next.

---

## Contact

Luis Ng — email.luisng@gmail.com