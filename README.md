# Crowd Control

## Overview

Crowd Control,

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---

## Features

- Interactive heatmap
- Social media posts
- User log in/sign up

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---

## Usage

To run the application locally:

1. **Clone** the repository.
2. **Install dependencies** by running `npm install` in the project root directory.
3. **Start the development server** by running the command: `npm run dev`.
4. Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1. Browse the map of hotspots displayed on the main page.
2. Click the dot (or similar) to mark a spot as being busy or not.
3. View your posts in the social section.

---

## Project Structure

```text
1800_202610_BBY09/
├── data/
├── node_modules/
├── public/
│ ├── bootstrap/
│ ├── images/
│ ├── login.html
│ ├── newPost.html
│ ├── profile.html
│ └── socialfeed.html
├── src/
├── index.html
├── package.json
└── README.md