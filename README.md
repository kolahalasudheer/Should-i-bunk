# 🎓 Should I Bunk?

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://should-i-bunk.onrender.com)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A smart attendance calculator that helps students decide if they can skip classes while staying above the 75% attendance requirement. Built with React, Node.js, and PostgreSQL.

## 🚀 What It Does

*Should I Bunk?* is your personal attendance assistant that takes the guesswork out of class management. Instead of manually calculating percentages or risking attendance drops, get instant, accurate predictions about your attendance status.

### Core Features

🎯 *Smart Attendance Calculator*
- Input total classes and attended classes
- Get real-time attendance percentage with color-coded status
- Visual progress bars show exactly where you stand

📊 *Bunk Predictor Engine*
- Calculate maximum classes you can safely skip
- See how many classes you need to attend to recover
- Get personalized recommendations based on your current status

⚠ *Intelligent Warnings System*
- Green zone: You're safe to bunk
- Yellow zone: Caution - limited bunks remaining  
- Red zone: Critical - must attend classes

📱 *User-Friendly Interface*
- Clean, intuitive design that works on any device
- Quick input with instant results
- No registration required - start using immediately

## 📱 Demo

🚧 *Deployment in Progress* - The live demo is currently being deployed and will be available soon!

📺 *Watch Our Tutorial* - Until then, check out how the app looks and works:
*[📹 App Demo Video](https://your-demo-video-link)* (Coming Soon)

### What You'll See in the App

Sample outputs the app gives you:
> ✅ "You can skip 3 more classes safely"  
> ⚠ "You need to attend the next 4 classes"  
> 🚨 "Don't miss any more classes!"

💡 *Want to try it now?* Follow the [Quick Start](#-quick-start) guide below to run it locally on your machine!

## 🛠 Built With

| Technology | Purpose |
|------------|---------|
| React + TypeScript | Frontend (what users see) |
| TailwindCSS | Making it look good |
| Node.js + Express | Backend server |
| PostgreSQL (Neon) | Database to store data |
| Render | Hosting the website |

### 1. Get the Code

```bash
git clone https://github.com/kolahalasudheer/should-i-bunk.git
cd should-i-bunk
```

### 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

### 3. Start the Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open Your Browser

Go to: [http://localhost:5173](http://localhost:5173)


## 📁 Project Structure


should-i-bunk/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main app pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Helper functions
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── server/                 # Backend API Server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Custom middleware
│   │   └── app.ts          # Express server setup
│   ├── drizzle/            # Database migrations
│   └── package.json        # Backend dependencies
│
└── README.md               # Project documentation


### Key Files & Folders

*Frontend (client/)*
- components/ - Attendance calculator, input forms, result displays
- pages/ - Home page, about page, help section
- utils/ - Attendance calculation logic, API calls
- App.tsx - Main app with routing and state management

*Backend (server/)*
- routes/ - API endpoints for attendance operations
- controllers/ - Core attendance calculation algorithms
- models/ - User and attendance data models
- middleware/ - Authentication, error handling, logging

## 🔧 Environment Setup

Create a .env file in the server/ folder:

bash
DATABASE_URL=your_database_url_here
PORT=5000


That's it! No complex configuration needed.

## 🌐 How It Works

### Step-by-Step Process

*1. Input Your Data*

📝 Enter total classes conducted: 50
📝 Enter classes you attended: 40
📝 Set your target percentage: 75%


*2. Instant Analysis*

📊 Current attendance: 80% ✅
📈 Status: Safe Zone (5% above target)


*3. Smart Predictions*

✅ Classes you can bunk: 6 more classes
⚠ Classes to recover (if needed): 0 classes
📅 Recommendation: "You're doing great! You can safely skip up to 6 classes."


*4. Dynamic Updates*
- Change any input value and see results update instantly
- Visual indicators change color based on your status
- Get different advice as your situation changes

### Real Example Scenarios

*Scenario 1: Safe Student*
- Total: 100 classes, Attended: 85
- Result: "80% attendance - You can bunk 6 more classes safely!"

*Scenario 2: Borderline Student* 
- Total: 100 classes, Attended: 76
- Result: "76% attendance - Only 1 more bunk allowed. Be careful!"

*Scenario 3: Recovery Mode*
- Total: 100 classes, Attended: 70  
- Result: "70% attendance - You must attend next 7 classes to recover!"

### Behind the Scenes

*Smart Algorithm*

If current attendance ≥ target: Calculate safe bunks remaining
If current attendance < target: Calculate classes needed for recovery
Always factor in future classes to maintain target percentage


*The Math Made Simple*
- We calculate what happens if you miss more classes
- We figure out the minimum classes needed to hit your target
- We give you the exact numbers, not confusing percentages

## 📊 Key Features

*Smart Calculations*
- Real-time percentage updates
- Future scenario predictions
- Clear visual indicators

*User-Friendly Design*
- Clean, simple interface
- Works on mobile and desktop
- No complicated menus or settings

*Reliable Backend*
- Fast database queries
- Secure data handling
- Always available (deployed on Render)

## 🤝 Contributing

Want to help improve this project?

1. Fork the repo
2. Make your changes
3. Test everything works
4. Submit a pull request

## 💡 Why I Built This

As a student, I always wondered "Can I skip today's class?" but never had a clear answer. This app solves that problem with simple math and smart predictions. It's helped me and my friends make better attendance decisions.

## 📝 What I Learned

- *Full-stack development* with React and Node.js
- *Database design* and management with PostgreSQL
- *API development* and integration
- *Deployment* and DevOps with Render
- *User experience* design for students

## 🎯 Future Plans

- Add multiple subjects tracking
- Send attendance alerts
- Calendar integration
- Mobile app version

## 📞 Contact

*Sudheer Kumar Kolahala*  
Full Stack Developer | AI Engineering Intern

📧 *Email*: sudheerkolahala@gmail.com  
🔗 *GitHub*: [@kolahalasudheer](https://github.com/kolahalasudheer)  
💼 *LinkedIn*: [Connect with me](https://linkedin.com/in/sudheerkolahala)

---

## ⭐ Show Some Love

If this project helped you or you found it interesting, please give it a ⭐ on GitHub!

*Made with ❤ for students who need to make smart attendance decisions*
