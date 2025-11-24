# Dairy Farm Management System - Feature Updates

## 🎉 New Features Implemented

### 1. **Enhanced Milk Sales System** (3 Types)

#### 🔹 Bandhi (Contract Sales)
- **Description**: Year-long contract with vendors
- **Features**:
  - Contract management with advance money tracking
  - Advance held as assurance that contract won't be broken
  - Advance returned after contract completion
  - Current default rate: ₹182.5/liter (adjustable)
  - Link sales directly to active contracts
  
- **New Pages**:
  - `/contracts` - Manage Bandhi contracts
  - Contract form includes: vendor name, start/end dates, rate, advance amount
  - Track contract status: Active, Completed, Terminated
  - Track advance status: Held, Returned, Forfeited
  - One-click "Return Advance" button to complete contracts

#### 🔹 Mandi (Market Sales)
- **Description**: Sales to milk market with committee-decided rates
- **Features**:
  - Separate morning and evening rates (decided by committee)
  - Variable rates per 40 liters
  - Time-of-day tracking (Morning 🌅 / Evening 🌆)
  - Rate changes frequently based on market conditions

#### 🔹 Door-to-Door Sales
- **Description**: Direct sales to end customers
- **Features**:
  - Base rate ~₹220/liter
  - Optional packaging cost (₹10-20/liter)
  - Total rate calculation: Base + Packaging
  - Customer name tracking
  - Higher profit margin

### 2. **Recurring Expenses Management**

#### Fixed Monthly Expenses (Bought on 10-day basis)
New dedicated page: `/recurring-expenses`

**9 Pre-defined Expense Types**:
1. **Master B-10 Vanda** - Cattle feed supplement
2. **Mix Atti** - Mixed flour/feed
3. **Chaukar** - Wheat bran
4. **Tukra** - Cattle feed pieces
5. **Green Fodder** - Fresh feed
6. **Worker Wage** - Labor costs (supports multiple workers)
7. **Medical Expenses** - Veterinary supplies
8. **Rent** - Property/land rental
9. **Toori (Wheat Straw)** - Dry fodder

**Features**:
- **Frequency Options**: Daily, Every 10 Days, Monthly
- **Automatic Monthly Cost Calculation**
- **Edit Dialog**: Click edit icon to update existing expenses
- **Multiple Workers Support**: Specify worker count for wage calculation
- **Active/Inactive Toggle**: Disable expenses temporarily
- **Next Purchase Date Tracking**: Auto-calculated based on frequency
- **Estimated Monthly Summary**: Total of all active recurring expenses

### 3. **Enhanced Expense Categorization**

#### Asset vs Operating Expenses
Existing `/expenses` page now segregates:

**Asset Expenses** (Capital Investments):
- Animal Purchase
- Equipment Purchase
- Land Improvement
- Building Construction

**Operating Expenses** (Recurring Costs):
- Feed
- Labour
- Rental
- Veterinary
- Medicine
- Utilities
- Transportation
- Utensils
- Maintenance
- Insurance
- Other

**Features**:
- Filter tabs: All / Assets / Operating
- Visual indicators: 💎 Asset, 🔄 Operating
- Summary cards showing totals for each type
- Better P&L calculation support

### 4. **Payment Status Management**

#### Receivable Tracking
All milk sales now support:
- **Pending** - Amount not yet received
- **Received** - Payment completed
- **Returned** - Sale reversed/returned

**Features**:
- Inline payment status dropdown in sales table
- Quick status updates without opening modal
- Summary showing total pending vs received amounts

---

## 📊 Database Changes

### New Models
1. **Contract** (`server/models/Contract.js`)
   - Tracks Bandhi contracts with advance payments
   - Auto-validates end date > start date

2. **RecurringExpense** (`server/models/RecurringExpense.js`)
   - Manages fixed monthly expenses
   - Auto-calculates next purchase date

### Updated Models
1. **MilkSale** (`server/models/MilkSale.js`)
   - Changed `customerType` → `saleType` (bandhi/mandi/door_to_door)
   - Added `contractId` for Bandhi sales
   - Added `timeOfDay` for Mandi sales
   - Added `packagingCost` for Door-to-Door
   - Updated `paymentStatus` enum

2. **Expense** (`server/models/Expense.js`)
   - Added `expenseType` field (asset/operating)
   - Expanded category enum from 9 to 15 categories

---

## 🛣️ New API Routes

### Contracts
- `GET /api/contracts` - List all contracts
- `GET /api/contracts?status=active` - Filter by status
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/:id` - Update contract
- `PATCH /api/contracts/:id/return-advance` - Return advance & complete
- `DELETE /api/contracts/:id` - Delete contract

### Recurring Expenses
- `GET /api/recurring-expenses` - List all with monthly summary
- `GET /api/recurring-expenses?isActive=true` - Filter active
- `POST /api/recurring-expenses` - Create new
- `PUT /api/recurring-expenses/:id` - Update existing
- `DELETE /api/recurring-expenses/:id` - Delete expense

### Enhanced Milk Sales
- `GET /api/milk/sales?saleType=bandhi` - Filter by sale type
- `GET /api/milk/sales?paymentStatus=pending` - Filter by payment
- Response includes summary by type (bandhi/mandi/door_to_door)
- Response includes payment summary (pending/received)

---

## 🎨 UI Updates

### New Pages
1. **Contracts** (`/contracts`) - Bandhi contract management
2. **Recurring Expenses** (`/recurring-expenses`) - Fixed monthly expenses

### Updated Pages
1. **Milk Sales** - Complete redesign with 3 sale types
2. **Expenses** - Added Asset vs Operating categorization

### Navigation
Updated navbar with new menu items:
- 📋 Contracts
- 🔄 Recurring Expenses

### Summary Cards
All major pages now show:
- Key metrics at the top
- Color-coded status badges
- Quick filter tabs
- Real-time totals

---

## 💰 Profit Calculation Support

The new categorization enables accurate profit calculations:

### Revenue Tracking
- Bandhi sales (contract rate)
- Mandi sales (variable market rate)
- Door-to-door sales (highest margin)

### Cost Tracking
**Capital Expenses** (Asset):
- Animal purchases
- Equipment/infrastructure

**Operational Expenses**:
- Fixed recurring costs (feed, wages, rent)
- Variable one-time expenses
- Veterinary and medical

### Profit Formula
```
Total Revenue = Bandhi + Mandi + Door-to-Door sales
Operating Costs = Recurring expenses + One-time operating expenses
Gross Profit = Total Revenue - Operating Costs
Net Profit = Gross Profit - (Asset depreciation / amortization)
```

---

## 🚀 How to Use

### Managing Bandhi Contracts
1. Go to **Contracts** page
2. Click **Add Contract**
3. Enter vendor name, dates, rate, and advance amount
4. System tracks advance as "Held"
5. When contract ends, click **Return Advance** button
6. Contract marked as "Completed", advance status "Returned"

### Recording Milk Sales
1. Go to **Milk Sales** page
2. Click **Add Sale**
3. Select sale type:
   - **Bandhi**: Choose existing contract (rate auto-filled)
   - **Mandi**: Select morning/evening, enter committee rate
   - **Door-to-Door**: Enter base rate + packaging cost
4. Update payment status inline from table

### Setting Up Recurring Expenses
1. Go to **Recurring Expenses** page
2. Click **Add Recurring Expense**
3. Select expense type (Master B-10, Mix Atti, etc.)
4. Enter amount and frequency (10 days default)
5. System calculates estimated monthly cost
6. Use **Edit** button to update amounts
7. Toggle **Active** status to pause expenses

### Tracking Regular Expenses
1. Go to **Expenses** page
2. Use filter tabs: All / Assets / Operating
3. Add expenses with appropriate type
4. View separate totals for asset vs operating costs

---

## 📱 Mobile Responsive
All new features are fully responsive:
- Summary cards stack vertically on mobile
- Tables scroll horizontally with data-labels
- Modal forms adapt to smaller screens
- Filter tabs wrap on mobile devices

---

## 🔧 Technical Stack

**Backend**:
- Node.js + Express.js
- MongoDB with Mongoose
- RESTful API design
- JWT authentication

**Frontend**:
- React 18
- React Router v6
- Axios for API calls
- React Toastify for notifications
- React Icons

**Deployment**:
- Docker + Docker Compose
- Ready for Render, Railway, Fly.io

---

## 📈 Next Steps (Optional Enhancements)

1. **Reports Enhancement**
   - Profit/Loss by sale type
   - Recurring expense trends
   - Contract performance metrics

2. **Dashboard Widgets**
   - Active contracts summary
   - Upcoming recurring expenses
   - Payment pending alerts

3. **Notifications**
   - Contract expiry reminders
   - Recurring expense due alerts
   - Low payment collection warnings

4. **Export Features**
   - Contract reports (PDF)
   - Monthly expense summaries
   - Profit analysis by type

---

## 🎯 Business Benefits

1. **Better Cash Flow Management**
   - Track advance payments
   - Monitor pending receivables
   - Forecast recurring expenses

2. **Accurate Profit Analysis**
   - Separate capital vs operational costs
   - Compare profitability by sale type
   - Identify high-margin customers

3. **Simplified Bookkeeping**
   - Automated recurring expense tracking
   - Clear expense categorization
   - Monthly cost estimation

4. **Contract Compliance**
   - Track contract terms
   - Ensure advance return
   - Monitor contract performance

---

## 📞 Support

For issues or questions:
1. Check Docker logs: `docker-compose logs`
2. Verify MongoDB connection
3. Check browser console for frontend errors

Application URL: http://localhost:5000
