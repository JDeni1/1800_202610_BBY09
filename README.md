# Crowd Control

## Overview

Crowd Control, a visual demonstration of crowds around the 5 most congested areas within the FIFA Area area in Vancouver.

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---

## Features

- Interactive heatmap
- Social mdiea posts
- User log in/sign up

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---

## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1.  Browse the list of hiking trails displayed on the main page.
2.  Click the heart icon (or similar) to mark a trail as a favorite.
3.  View your favorite hikes in the favorites section.

---

## Project Structure

```
elmo-hikes/
├── src/
│   ├── main.js
├── styles/
│   └── style.css
├── public/
├── images/
├── index.html
├── package.json
├── README.md
```

---

## Contributors

- **Ozgur** - BCIT CST Student learning Git collaboration.
- **Jill** - BCIT CST Student, who appricate walks.
- **Darwin** - BCIT CST Student, a radio expert.!

---

## Acknowledgments

- Map data and images are for demonstration purposes only.
- Code snippets were adapted from resources such as [Stack Overflow](https://stackoverflow.com/) and [MDN Web Docs](https://developer.mozilla.org/).
- Icons sourced from [FontAwesome](https://fontawesome.com/) and images from [Unsplash](https://unsplash.com/).

---

## Limitations and Future Work

### Limitations

- Posts update only the nearst of the 5 areas within the heatmap
- Heatmap has already built-in locations

### Future Work

- Danamically updates crowd based on current location information
- Create a better UI for user accessibility

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
