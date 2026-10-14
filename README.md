# Curio - Rule-Based Recommendation System

A small MERN-stack project that uses views and likes to find popular items and recommend items in categories a user enjoys. The interface works in demo mode without a database; adding a MongoDB connection enables persistence.

## Architecture

```text
React (Vite) browser app
        │ HTTP / JSON
        ▼
Express API (Node.js)
   ├── activity rules: view = 1 point, like = 3 points
   ├── trending: rank by likes and views
   └── recommendations: match user's strongest category, exclude items already liked
        │ Mongoose (when MONGO_URI is set)
        ▼
MongoDB
```

The API starts with seeded sample items and a sample profile. If `MONGO_URI` is not provided or the database is unavailable, it uses the same sample data in memory, so the app is still easy to explore. Demo activity resets when the server restarts. In production, Express serves the built React website and its API from one web service.

## Run it

1. Install Node.js (LTS).
2. In this project folder, run `npm run install:all`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite (normally `http://localhost:5173`). Vite proxies the API requests to Express while you develop.

### Optional MongoDB persistence

Copy `server/.env.example` to `server/.env`, then set `MONGO_URI` to a local MongoDB URI or a MongoDB Atlas connection string. Restart the server. On first connection, the server seeds the database if it has no items.

## How the recommendation rules work

- Opening an item records a **view** and adds 1 interest point to its category.
- Liking an item records a **like** and adds 3 interest points to its category.
- The category with the highest score becomes the user's current preference.
- Recommendations are unliked items in that category, ordered by a simple score: popularity plus a small newness bonus.
- Trending items are ranked by likes first, then views.

This is a transparent starter algorithm, not machine learning. The labels and scores shown in the interface are descriptive signals, not a promise of future behavior.

## Tech stack and languages

| Layer | Technology | Language / purpose |
|---|---|---|
| Frontend | React 18, Vite | JavaScript UI and local development server |
| Styling | CSS | Responsive layout, colors, spacing, cards and charts |
| Backend | Node.js, Express | JavaScript REST API |
| Database | MongoDB, Mongoose | Document storage and JavaScript schemas |
| API format | JSON over HTTP | Browser-to-server data exchange |

## Project layout

```text
client/                 React screens and styling
  src/App.jsx           Dashboard, navigation, filters, activity controls
  src/api.js            Browser API calls
  src/main.jsx          React entry point
  src/styles.css        Responsive visual system
server/
  src/index.js          Express API and demo data
  src/models.js         Mongoose schemas
  .env.example          Optional MongoDB configuration
```

## Main API routes

- `GET /api/dashboard` - summary, activity trend, and personalized picks
- `GET /api/items` - searchable/filterable catalog
- `POST /api/activity` - record a view or like
- `GET /api/trending` - ranked popular items
- `GET /api/health` - server and database mode

## Deploy from Git (one service)

The easiest deployment is one Render Web Service connected to one GitHub repository. It builds the React site and serves the site and API from the same Node.js server. No `VITE_API_URL` setting is required.

1. Create an empty repository on GitHub. From this project folder, run these commands one at a time: `git init`, `git add .`, `git commit -m "Initial Curio project"`, `git branch -M main`, `git remote add origin YOUR_GITHUB_REPOSITORY_URL`, and `git push -u origin main`. Do not add `.env` files or paste passwords into the repository.
2. In Render, create a **New Web Service**, connect your GitHub repository, and select the `main` branch.
3. Set **Language** to Node, leave **Root Directory** blank, set **Build Command** to `npm run install:all && npm run build`, and **Start Command** to `npm start`.
4. Click **Create Web Service**. Render builds and publishes the whole website at its `onrender.com` URL. Future pushes to the connected branch deploy automatically.

The simplest demo uses in-memory sample data, so activity resets whenever the server restarts. To keep activity and item counts between restarts, add MongoDB Atlas later and set the Render environment variable `MONGO_URI` to your database connection string. Atlas requires a database user and an allowed network address before the app can connect.

## Make it your own

Change the sample catalog in `server/src/index.js`, update the colors in `client/src/styles.css`, or add another category. For a class presentation, demonstrate how views and likes change the category preference and recommendation list.
