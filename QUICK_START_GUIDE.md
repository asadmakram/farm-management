# Quick Start Guide - New Features

## 🚀 Getting Started

Your dairy farm management system now includes:
- ✅ 3 Types of Milk Sales (Bandhi, Mandi, Door-to-Door)
- ✅ Contract Management with Advance Tracking
- ✅ Recurring Expenses (9 fixed monthly expenses)
- ✅ Enhanced Expense Categorization (Asset vs Operating)
- ✅ Payment Status Tracking (Pending/Received/Returned)

**Application is running at:** http://localhost:5000

---

## 📋 Step-by-Step Workflow

### Step 1: Set Up Bandhi Contracts (Optional)
If you sell milk under yearly contracts:

1. Navigate to **Contracts** page
2. Click **"Add Contract"**
3. Fill in:
   - Vendor Name: e.g., "ABC Dairy"
   - Start Date: Contract start
   - End Date: 1 year later
   - Rate per Liter: ₹182.5 (or your rate)
   - Advance Amount: Security deposit you hold
4. Click **"Create Contract"**

**Result**: Contract tracked, advance held as assurance

### Step 2: Set Up Recurring Expenses
These are your regular monthly costs:

1. Navigate to **Recurring Expenses** page
2. Click **"Add Recurring Expense"** for each item
3. Add all 9 types:

| Expense Type | Typical Amount | Frequency |
|-------------|----------------|-----------|
| Master B-10 Vanda | ₹5000-8000 | Every 10 Days |
| Mix Atti | ₹3000-5000 | Every 10 Days |
| Chaukar | ₹2000-4000 | Every 10 Days |
| Tukra | ₹3000-5000 | Every 10 Days |
| Green Fodder | ₹4000-6000 | Every 10 Days |
| Worker Wage | ₹15000 | Monthly |
| Medical | ₹2000-5000 | Monthly |
| Rent | ₹10000-30000 | Monthly |
| Toori (Wheat Straw) | ₹3000-5000 | Every 10 Days |

**Result**: System calculates estimated monthly cost automatically

### Step 3: Record Milk Sales

#### For Bandhi (Contract) Sales:
1. Go to **Milk Sales** page
2. Click **"Add Sale"**
3. Select **"📋 Bandhi (Contract)"**
4. Choose contract from dropdown (rate auto-filled)
5. Enter quantity in liters
6. Click **"Record Sale"**

#### For Mandi (Market) Sales:
1. Click **"Add Sale"**
2. Select **"🏪 Mandi (Market)"**
3. Choose **Morning** or **Evening**
4. Enter committee-decided rate per liter
5. Enter quantity
6. Click **"Record Sale"**

#### For Door-to-Door Sales:
1. Click **"Add Sale"**
2. Select **"🚪 Door-to-Door"**
3. Enter base rate (e.g., ₹220)
4. Add packaging cost if applicable (₹10-20)
5. Enter customer name (optional)
6. Enter quantity
7. Click **"Record Sale"**

**Result**: All sales tracked separately with profit margins visible

### Step 4: Track Payments
In the Milk Sales table:
- Use the **Payment Status** dropdown for each sale
- Update from **Pending** → **Received** when paid
- View total pending amount in summary cards

### Step 5: Add One-Time Expenses

#### For Asset Expenses (Capital):
1. Go to **Expenses** page
2. Click **"Add Expense"**
3. Select **"💎 Asset"** type
4. Choose category:
   - Animal Purchase (buying new cattle)
   - Equipment Purchase
   - Land Improvement
   - Building Construction
5. Enter amount and date
6. Click **"Add Expense"**

#### For Operating Expenses:
1. Click **"Add Expense"**
2. Select **"🔄 Operating"** type
3. Choose category (feed, medicine, utilities, etc.)
4. Enter amount and date
5. Click **"Add Expense"**

**Result**: Clear separation for accurate profit calculation

---

## 🎯 Common Tasks

### Update Recurring Expense Amount
1. Go to **Recurring Expenses** page
2. Click **Edit** icon next to expense
3. Update amount
4. Click **"Update Expense"**
5. Monthly estimate recalculates automatically

### Complete a Contract
1. Go to **Contracts** page
2. Find completed contract
3. Click **"Return Advance"** button
4. Confirm action
5. Advance marked as returned, contract completed

### Filter Sales by Type
On **Milk Sales** page, use filter tabs:
- **All Sales** - View everything
- **Bandhi** - Contract sales only
- **Mandi** - Market sales only
- **Door-to-Door** - Direct customer sales

### View Expense Breakdown
On **Expenses** page, use filter tabs:
- **All** - Everything
- **Assets** - Capital investments only
- **Operating** - Recurring costs only

---

## 📊 Understanding Your Numbers

### Summary Cards Explained

**Milk Sales Page**:
- **Bandhi**: Total liters + revenue from contracts
- **Mandi**: Total liters + revenue from market
- **Door-to-Door**: Total liters + revenue (highest margin)
- **Total Revenue**: Combined from all sources
- **Pending**: Money not yet received

**Recurring Expenses Page**:
- **Active Expenses**: Number of ongoing expenses
- **Estimated Monthly**: Total projected monthly cost

**Expenses Page**:
- **Asset Expenses**: Capital investments (one-time)
- **Operating Expenses**: Recurring operational costs
- **Total Expenses**: Combined

---

## 💡 Pro Tips

1. **Set up all recurring expenses first** - Get accurate monthly cost baseline
2. **Use contracts for stable sales** - Better cash flow with advance
3. **Track door-to-door separately** - Highest margins, focus on growth
4. **Update payment status daily** - Better receivables management
5. **Review next purchase dates** - In recurring expenses for planning
6. **Check contract expiry** - Set up renewals in advance
7. **Separate asset purchases** - Don't mix with daily operations
8. **Use notes field** - Add details for future reference

---

## 🔍 Quick Troubleshooting

**Can't see new menu items?**
- Refresh browser (Ctrl/Cmd + R)
- Clear cache if needed

**Contract not showing in dropdown?**
- Ensure contract status is "Active"
- Check contract dates are valid

**Monthly estimate seems wrong?**
- Verify frequency setting (daily/10 days/monthly)
- Check worker count for wage expenses
- Ensure expense is marked as "Active"

**Sales not appearing?**
- Check filter tabs - might be filtered
- Verify payment status filter

---

## 📈 Daily Routine Suggestion

### Morning:
1. Record milk sales from previous day
2. Update payment statuses
3. Check recurring expense due dates

### Weekly:
1. Review pending payments
2. Update recurring expense amounts if changed
3. Check contract status

### Monthly:
1. Review all three sale types performance
2. Compare estimated vs actual recurring costs
3. Analyze asset vs operating expense ratio
4. Generate reports for profit analysis

---

## 🎓 Feature Summary

| Feature | Page | Purpose |
|---------|------|---------|
| Bandhi Sales | Milk Sales | Contract-based, stable income |
| Mandi Sales | Milk Sales | Market rate, variable |
| Door-to-Door | Milk Sales | Highest margin, direct customers |
| Contracts | Contracts | Manage advances, track terms |
| Recurring Expenses | Recurring Expenses | Fixed monthly costs |
| Asset Expenses | Expenses | Capital investments |
| Operating Expenses | Expenses | Daily operations |

---

## 📞 Need Help?

**Check the logs:**
```bash
docker-compose logs
```

**Restart the application:**
```bash
cd /Users/asadmakram/Desktop/farm-management
docker-compose restart
```

**Full rebuild:**
```bash
docker-compose down
docker-compose up --build -d
```

---

**Happy Farm Management! 🐄🥛**
