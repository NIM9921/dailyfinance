# DailyFinance

DailyFinance is a personal finance management app built with the MERN stack (MongoDB, Express, React, Node). It helps you track income, expenses, and view reports to better understand your spending habits.

## Features
- Add, edit, and delete transactions (income & expenses)
- Categorize transactions
- View summaries and charts of spending
- User authentication (register/login)
- Responsive UI

## Tech Stack
- MongoDB
- Express.js
- React
- Node.js

## Repository layout (example)
This repository typically follows a client/server split (adjust paths to your project structure):

- /client - React frontend
- /server - Node/Express backend
- /README.md - this file

## Getting started (local development)
1. Clone the repo

   git clone https://github.com/NIM9921/dailyfinance.git
   cd dailyfinance

2. Backend setup

   cd server
   npm install

   Create a .env file in the server folder with the required environment variables. Example .env:

   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000

   Start the backend (example using nodemon):

   npm run dev

3. Frontend setup

   cd ../client
   npm install

   If your React app expects an API base URL, create a .env in the client or use REACT_APP_API_URL. Example:

   REACT_APP_API_URL=http://localhost:5000/api

   Start the frontend:

   npm start

4. Open the app in your browser (usually http://localhost:3000)

## Environment variables
List any environment variables your app needs (example):
- MONGO_URI - MongoDB connection string
- JWT_SECRET - secret for signing JWTs
- PORT - server port (default 5000)
- REACT_APP_API_URL - base URL for API on the client

## Screenshots / App image
To add a picture of the app for the related area, add the image file to the repository (recommended places):

- client/public/images/app-screenshot.png  (for Create React App public assets)
- docs/images/app-screenshot.png
- README folder like /assets or /images at the repository root

Then reference it in this README with Markdown, for example:

   ![DailyFinance - Dashboard](./client/public/images/app-screenshot.png)

Or if you place it in docs/images:

   ![DailyFinance - Transactions](./docs/images/transactions.png)

If you prefer to keep images in a remote location, you can link directly to an image URL: 

   ![App image](https://example.com/path/to/image.png)

Notes: GitHub will render images placed in the repository once pushed. If using client/public, files will also be served by React dev server.

## Contributing
Contributions are welcome. Please open an issue or PR with a clear description of changes and tests where applicable.

## License
Specify a license for your project (e.g., MIT).

## Contact
If you have questions, reach out to the maintainer: NIM9921 (GitHub)
