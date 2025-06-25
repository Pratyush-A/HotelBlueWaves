It is a real-world Hotel Management System built using React Native and Node.js. This application is designed to simplify and streamline hotel operations, enabling easy guest entry, booking management, and real-time access to essential hotel data – all from your mobile device.

🚀 Features
📋 Guest check-in/check-out system

🛏️ Room availability tracking

📅 Booking management by date

🖼️ ID proof upload support (via Cloudinary)

📊 Room statistics dashboard (Total, Available, Occupied)

🔐 Secure login system with JWT-based authentication

⚙️ Admin/Manager role-based access

🌐 Backend-hosted APIs with real-time database connection










| Technology                  | Purpose                                                                          |
| --------------------------- | -------------------------------------------------------------------------------- |
| **React Native (Expo CLI)** | Frontend mobile framework for building cross-platform UIs and testing on-the-fly |
| **Node.js & Express.js**    | Backend server to handle API requests and manage data flow                       |
| **MongoDB**                 | NoSQL database used to store users, rooms, and booking details                   |
| **Nodemon**                 | Dev tool that automatically restarts the server on code changes                  |
| **Cloudinary**              | Image hosting service for storing guest ID proofs                                |






File Structure

Backend

├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── index.js


Frontend

├── frontend/
│   ├── screens/
│   ├── components/
│   ├── constants/
│   └── App.js


📱 How to Run the Project
1. Backend Setup
bash
Copy
Edit
cd backend
npm install
npm run dev
Make sure MongoDB is running and your .env file contains valid credentials.

2. Frontend (Expo) Setup
bash
Copy
Edit
cd frontend
npm install
npx expo start
Use the Expo Go app or an emulator to test the application in real time.



💡 Future Enhancements
Push notification support for upcoming bookings

Bill email delivery

Multi-language support

Offline mode for booking

📞 Contact
Created with ❤️ by Pratyush

thepratyushacharya@gmail.com

Feel free to reach out for suggestions, collaboration, or contributions.



