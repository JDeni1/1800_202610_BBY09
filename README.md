# Crowd Control

## Overview

Crowd Control,

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---

## Features

- Interactive heatmap
- Social mdiea posts
- User log in/sign up

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, bootstrap
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

1.  Browse the map of hostpots displayed on the main page.
2.  Click the dot (or similar) to mark a spot as being busy or not.
3.  View your posts in the social section.

---

## Project Structure

```
1800_202610_BBY09/
├── data/
├── node_modules/
├── public/
│   ├── bootstrap/
│   │   ├── css/
│   │   └── js/
│   ├── images/
│   ├── login.html
│   ├── newPost.html
│   ├── profile.html
│   └── socialfeed.html
├── src/
├── index.html
├── package-lock.json
├── package.json
└── README.md
```

---

## Contributors

- **Ozgur** - BCIT CST Student learning Git collaboration.
- **Jill** - BCIT CST Student, who dreams of living in the countryside.
- **Darwin** - BCIT CST Student, a radio expert.

---

## Acknowledgments

- Map data and images are for demonstration purposes only.
- Code snippets were adapted from resources such as [Stack Overflow](https://stackoverflow.com/) and [MDN Web Docs](https://developer.mozilla.org/).
- Icons sourced from [FontAwesome](https://fontawesome.com/) and images from [Unsplash](https://unsplash.com/).

## Refrances

- MapLibre GL JS, "MapLibre GL JS Documentation," MapLibre, 2024. [Online]. Available: https://maplibre.org/maplibre-gl-js/docs/
- MapTiler, "MapTiler Cloud API Documentation," MapTiler, 2024. [Online]. Available: https://docs.maptiler.com/cloud/api/
- Freepik Company, "Flaticon — Free Vector Icons," Flaticon, 2024. [Online]. Available: https://www.flaticon.com/

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
