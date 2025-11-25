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

## Screenshots
Below are screenshots for the main areas of the app. These images are hosted on Cloudinary (provided).

- Main dashboard

  ![DailyFinance - Main Dashboard](https://res.cloudinary.com/ddko1nsop/image/upload/v1764044800/Screenshot_2025-11-25_095544_pltgmx.png)

  Suggested local path: client/public/images/dashboard.png or docs/images/dashboard.png

- Add Income (Transaction)

  ![Add Income - Transaction](https://res.cloudinary.com/ddko1nsop/image/upload/v1764045318/add_income_c5zzzr.png)

  Suggested local path: client/public/images/add_income.png

- Add Expenses (Transaction)

  ![Add Expenses - Transaction](https://res.cloudinary.com/ddko1nsop/image/upload/v1764045318/add_expences_v9chkf.png)

  Suggested local path: client/public/images/add_expenses.png

- Set Budget

  ![Set Budget](https://res.cloudinary.com/ddko1nsop/image/upload/v1764045319/set_budget_p1qxgw.png)

  Suggested local path: client/public/images/set_budget.png

- Reports

  ![Reports](https://res.cloudinary.com/ddko1nsop/image/upload/v1764045318/report_gkncer.png)

  Suggested local path: client/public/images/reports.png

- Settings

  ![Settings](https://res.cloudinary.com/ddko1nsop/image/upload/v1764045318/settings_i7qcod.png)

  Suggested local path: client/public/images/settings.png

- Mobile / Responsive

  The app is mobile responsive and works well on phones and small screens. Example mobile layout:

  ![Mobile Responsive - DailyFinance](https://res.cloudinary.com/ddko1nsop/image/upload/v1764046198/mobile_responsive_gnwwtx.png)

  Suggested local path: client/public/images/mobile_responsive.png

## Contributing
Contributions are welcome. Please open an issue or PR with a clear description of changes and tests where applicable.

## License
Specify a license for your project (e.g., MIT).

## Contact
If you have questions, reach out to the maintainer: NIM9921 (GitHub)
