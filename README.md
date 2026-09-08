# GRANDSTAY HOTEL

A beginner-friendly, professionally structured Hotel Management frontend demonstration built using **HTML5, CSS3, Vanilla JavaScript and XML**.

Tagline: **Where Luxury Feels Like Home**

## Features

- 5-star fictional hotel booking experience
- Normal, Premium, Luxury and 5-Star Suite room categories
- XML-driven hotel and room data
- Dynamic room rendering
- Room category filtering
- Tariff comparison table
- Booking form with validation
- Automatic night and cost calculation
- Guest-capacity validation
- Booking confirmation
- LocalStorage booking persistence
- Customer/booking search
- Responsive desktop, tablet and mobile layout
- Accessible semantic HTML and form labels
- Error handling for XML loading/parsing

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- XML
- Git
- GitHub

## Project Structure

```text
grandstay-hotel/
├── index.html
├── rooms.html
├── booking.html
├── tariff.html
├── customers.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── data/
│   └── hotel.xml
├── images/
│   └── README.txt
└── README.md
```

## How HTML, CSS, JavaScript and XML work together

- **HTML** provides the page structure, forms, navigation, tables and content containers.
- **CSS** controls the premium hotel visual design, responsive layout, cards, forms and tables.
- **JavaScript** loads XML, parses the data with `DOMParser`, renders room/tariff content, validates bookings, calculates costs, filters/searches data and stores bookings in `localStorage`.
- **XML** acts as the simple data source for hotel details and room information.

## How to Run

Because JavaScript uses `fetch()` to load `data/hotel.xml`, do not open `index.html` directly with `file://`.

### Recommended: VS Code Live Server

1. Open the `grandstay-hotel` folder in VS Code.
2. Install the **Live Server** extension if you do not already have it.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. The application will open in your browser.

## Pages

- `index.html` — Hotel dashboard/home
- `rooms.html` — Room categories and filtering
- `tariff.html` — Tariff comparison
- `booking.html` — Booking form and cost calculator
- `customers.html` — Saved booking records and search

## Learning Concepts

This project demonstrates:

- DOM manipulation
- JavaScript events
- Fetch API
- XML parsing
- DOMParser
- Dynamic rendering
- Form validation
- Date calculations
- Local Storage
- Search and filtering
- Responsive CSS
- Semantic HTML
- Error handling

## Important Note

This is a frontend learning/demo application. It has **no real backend, database, authentication or payment processing**. Booking records are stored only in the browser's localStorage.

## Git Practice

This project can be used to learn the complete developer workflow:

```text
Create code
    ↓
Run and test
    ↓
git status
    ↓
git add .
    ↓
git commit
    ↓
git branch
    ↓
git push
    ↓
GitHub
```
