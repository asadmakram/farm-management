# Dairy Farm Management System

A comprehensive SaaS platform for dairy farm management built with React and Node.js. This system helps farmers manage their animals, track milk production, record sales, monitor expenses, and generate detailed reports.

## Features

### 🐄 Animal Management
- Add, edit, and track animals with detailed information
- Monitor animal status (active, dry, sold, deceased)
- Track age, breed, weight, and purchase history

### 🥛 Milk Production Tracking
- Record daily milk yield (morning and evening)
- Track milk quality ratings
- View production trends and analytics

### 💰 Milk Sales Management
- Record sales to different customer types (contractors, individuals, retail)
- Track different selling rates
- Monitor payment status
- Sales distribution analytics

### 💵 Expense Management
- Track various expense categories (feed, labour, rental, veterinary, medicine, etc.)
- View expense trends
- Category-wise expense analysis

### 💉 Vaccination Records
- Track vaccination history for each animal
- Set reminder dates for upcoming vaccinations
- Record veterinarian details and costs

### 👶 Calf Management
- Track newborn calves
- Record birth weight and daily costs
- Monitor growth and development
- Calculate monthly and yearly costs

### 📊 Reports & Analytics
- Monthly milk yield reports with costs and profits
- Profit & Loss statements
- Animal performance reports
- Visual charts and graphs

### 📱 Dashboard
- Real-time farm overview
- Key metrics and KPIs
- Weekly trends
- Upcoming vaccination alerts
- Recent calf births

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router v6
- Recharts for data visualization
- React Icons
- Axios for API calls
- React Toastify for notifications

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
cd farm-management
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dairy-farm-db
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Run the application**

**Development mode (both frontend and backend):**
```bash
npm run dev
```

**Run backend only:**
```bash
npm run server
```

**Run frontend only:**
```bash
npm run client
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production Deployment

### Build for Production

1. **Build the React frontend:**
```bash
npm run build
```

2. **Set environment variables for production:**
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
```

3. **Start the production server:**
```bash
npm start
```

### Deployment Options

#### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name

# Add MongoDB Atlas URI
heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_jwt_secret"

# Deploy
git push heroku main
```

#### Option 2: Deploy to DigitalOcean/AWS/VPS

1. Set up a server with Node.js
2. Install PM2 for process management:
```bash
npm install -g pm2
```

3. Clone your repository on the server
4. Install dependencies and build:
```bash
npm run install-all
npm run build
```

5. Start with PM2:
```bash
pm2 start server/index.js --name dairy-farm
pm2 save
pm2 startup
```

#### Option 3: Deploy with Docker

```bash
# Build and run with Docker
docker-compose up -d
```

### MongoDB Atlas Setup (Recommended for Production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string and update MONGODB_URI in .env

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Animals
- `GET /api/animals` - Get all animals
- `GET /api/animals/:id` - Get single animal
- `POST /api/animals` - Create animal
- `PUT /api/animals/:id` - Update animal
- `DELETE /api/animals/:id` - Delete animal

### Milk Production
- `GET /api/milk/production` - Get production records
- `POST /api/milk/production` - Add production record
- `PUT /api/milk/production/:id` - Update record
- `DELETE /api/milk/production/:id` - Delete record

### Milk Sales
- `GET /api/milk/sales` - Get sales records
- `POST /api/milk/sales` - Add sale record
- `PUT /api/milk/sales/:id` - Update sale
- `DELETE /api/milk/sales/:id` - Delete sale

### Expenses
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Add expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Vaccinations
- `GET /api/vaccinations` - Get vaccination records
- `POST /api/vaccinations` - Add vaccination
- `PUT /api/vaccinations/:id` - Update vaccination
- `DELETE /api/vaccinations/:id` - Delete vaccination

### Calves
- `GET /api/calves` - Get all calves
- `GET /api/calves/:id` - Get single calf
- `POST /api/calves` - Add calf
- `POST /api/calves/:id/daily-cost` - Add daily cost
- `PUT /api/calves/:id` - Update calf
- `DELETE /api/calves/:id` - Delete calf

### Reports
- `GET /api/reports/milk-yield` - Monthly milk yield report
- `GET /api/reports/profit-loss` - Profit & loss report
- `GET /api/reports/animal-performance` - Animal performance report

### Dashboard
- `GET /api/dashboard` - Get dashboard overview

## Default User Credentials (Development)

After deployment, create your first user through the registration page.

## Features in Detail

### Mobile Responsive Design
- Fully responsive layout works on all devices
- Touch-friendly interface
- Optimized for tablets and smartphones

### Data Visualization
- Interactive charts using Recharts
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions

### Real-time Updates
- Instant data updates
- Toast notifications
- Error handling

### Security
- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Input validation

## Project Structure

```
farm-management/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/    # Reusable components
│       ├── context/       # React context (Auth)
│       ├── pages/         # Page components
│       ├── utils/         # Utility functions
│       └── App.js
├── server/                # Node.js backend
│   ├── middleware/        # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── .env.example          # Environment variables template
├── package.json          # Root package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email your-email@example.com or create an issue in the repository.

## Roadmap

- [ ] SMS/Email notifications for vaccinations
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics with AI predictions
- [ ] Export reports to PDF/Excel
- [ ] Integration with accounting software
- [ ] Weather data integration
- [ ] Breeding cycle tracking
- [ ] Feed calculator
- [ ] Inventory management

## Acknowledgments

- Icons from React Icons
- Charts from Recharts
- UI inspiration from modern farm management systems
