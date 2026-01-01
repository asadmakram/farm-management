# Feed Calculation System - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FeedCalculations.jsx      FeedCharts.jsx      App.jsx       │
│  ├─ Feed Items Tab         ├─ Chart List       ├─ Routes     │
│  ├─ Calculations Tab       ├─ Chart Form       └─ Layout     │
│  └─ Validation             ├─ Calculations                   │
│                            └─ Export                         │
│                                                               │
│                    FeedStyles.css (Styling)                  │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   API LAYER (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Router Setup (index.js)                                     │
│  ├─ /api/feed-categories                                     │
│  ├─ /api/feed-items                                          │
│  ├─ /api/feed-calculations                                   │
│  └─ /api/feed-charts                                         │
│                                                               │
│  Route Handlers                                              │
│  ├─ feedCategories.js (4 endpoints)                          │
│  ├─ feedItems.js (5 endpoints)                               │
│  ├─ feedCalculations.js (6 endpoints)                        │
│  └─ feedCharts.js (7 endpoints)                              │
│                                                               │
│  Middleware                                                  │
│  ├─ auth (JWT validation)                                    │
│  ├─ express.json (parsing)                                   │
│  └─ helmet (security)                                        │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 DATA LAYER (MongoDB)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FeedCategory Collection                                     │
│  ├─ userId + name (unique index)                             │
│  └─ Fields: name, description, notes                         │
│                                                               │
│  FeedItem Collection                                         │
│  ├─ userId + name (unique index)                             │
│  ├─ userId + category (index)                                │
│  └─ Fields: name, category, quantity, unit, price, supplier..│
│                                                               │
│  FeedCalculation Collection                                  │
│  ├─ userId + feedItemId (unique index)                       │
│  ├─ userId + feedChartId (index)                             │
│  └─ Fields: quantities, costs (auto-calculated)              │
│                                                               │
│  FeedChart Collection                                        │
│  ├─ userId + name (unique index)                             │
│  ├─ userId + isTemplate (index)                              │
│  └─ Fields: name, items array, isTemplate, isActive          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Create Feed Item Flow

```
User Input
    │
    ▼
FeedCalculations.jsx (validateFeedItem)
    │
    ▼
POST /api/feed-items (Server Validation)
    │
    ▼
FeedItem Model Validation
    │
    ▼
MongoDB FeedItem Collection
    │
    ▼
Response with populated data
    │
    ▼
FeedCalculations.jsx (Update state)
```

### 2. Create Calculation with Auto-Metrics Flow

```
User Input (quantityPerTime, numberOfTimesPerDay, numberOfAnimals)
    │
    ▼
Preview Button (Optional)
    │
    ├─ POST /api/feed-calculations/calculate/preview
    │   │
    │   ▼
    │   calculateFeedMetrics() function
    │   │
    │   ├─ quantityPerDay = qty × times × animals
    │   ├─ quantityPer10Days = daily × 10
    │   ├─ costPer10Days = (quantity / bagSize) × bagPrice
    │   ├─ bagsRequired = CEILING(quantity / bagSize)
    │   │
    │   ▼
    │   Return metrics preview
    │
    ▼
Save Button
    │
    ├─ POST /api/feed-calculations (Full save)
    │   │
    │   ▼
    │   FeedCalculation Model
    │   │
    │   ├─ Input validation
    │   ├─ Fetch feed item data
    │   ├─ Calculate all metrics
    │   ├─ Save to MongoDB
    │   │
    │   ▼
    │   Return saved calculation
    │
    ▼
FeedCalculations.jsx (Display in table)
```

### 3. Create Feed Chart with Detailed Calculations

```
User Input (name, numberOfAnimals, feedItems array)
    │
    ▼
FeedCharts.jsx Validation
    │
    ├─ Check name exists
    ├─ Check animals > 0
    ├─ Check feedItems array not empty
    │
    ▼
POST /api/feed-charts
    │
    ▼
Server Validation
    │
    ├─ Validate all feedItems exist
    ├─ Verify ownership (userId)
    │
    ▼
FeedChart Model Save
    │
    ▼
User clicks "View Calculations"
    │
    ▼
GET /api/feed-charts/:id/calculations
    │
    ▼
For each feedItem in chart:
    │
    ├─ Get feedItem data (quantityPerBag, pricePerBag)
    ├─ Calculate daily: quantityPerTime × timesPerDay × animals
    ├─ For each period (10, 20, 30 days):
    │   ├─ Quantity = daily × days
    │   ├─ Bags = CEILING(quantity / bagSize)
    │   ├─ Cost = bags × pricePerBag
    │
    ▼
Return calculations object:
    {
      perDay: { byItem: [...], totalQuantity, totalCost },
      per10Days: { byItem: [...], totalQuantity, totalCost },
      per20Days: { byItem: [...], totalQuantity, totalCost },
      per30Days: { byItem: [...], totalQuantity, totalCost }
    }
    │
    ▼
FeedCharts.jsx displays:
    ├─ Summary cards
    ├─ Breakdown tables
    └─ Export options
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────┐
│              App.jsx                              │
│  ├─ Router                                        │
│  └─ Routes: /feed-calculations, /feed-charts      │
└──────────────┬───────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
  FeedCalculations   FeedCharts
  │                 │
  ├─ State          ├─ State
  │ ├─ feedItems    │ ├─ feedCharts
  │ ├─ calculations │ ├─ selectedChart
  │ └─ loading      │ ├─ chartCalculations
  │                 │ └─ loading
  ├─ Tabs Interface │
  │ ├─ Items Tab    ├─ Chart Management
  │ │ ├─ Form      │ ├─ Create Form
  │ │ ├─ List      │ ├─ Chart List
  │ │ └─ Export    │ └─ Calculations View
  │ │
  │ └─ Calculations Tab
  │   ├─ Form
  │   ├─ Preview
  │   ├─ List
  │   └─ Export
  │
  └─ API Calls
    ├─ feedItems CRUD
    ├─ feedCalculations CRUD
    └─ feedCharts CRUD + calculations
```

---

## Database Schema Relationships

```
┌──────────────────────┐
│   FeedCategory       │
├──────────────────────┤
│ _id                  │
│ userId (Index)       │
│ name (Unique) ◄──────┼───┐
│ description          │   │
│ notes                │   │
└──────────────────────┘   │
                           │
                    (references)
                           │
                           ▼
┌──────────────────────┐   │
│   FeedItem           │   │
├──────────────────────┤   │
│ _id                  │   │
│ userId (Index) ◄─────┼───┴─── FeedCalculation
│ name (Unique)        │   │
│ category ────────────┴───┤
│ quantityPerBag       │   │
│ unit                 │   │
│ pricePerBag          │   │
│ supplier             │   │
│ shelfLife            │   │
│ isActive             │   │
└──────────────────────┘   │
        ▲                  │
        │ (references)     │
        │                  ▼
        │    ┌──────────────────────┐
        │    │   FeedCalculation    │
        │    ├──────────────────────┤
        │    │ _id                  │
        │    │ userId (Index)       │
        │    │ feedItemId ──────────┴───┐
        │    │ feedChartId ──────────┐  │
        │    │ quantityPerTime       │  │
        │    │ numberOfTimesPerDay   │  │
        │    │ numberOfAnimals       │  │
        │    │ quantityPerDay (Auto) │  │
        │    │ costPer10Days (Auto)  │  │
        │    │ (more calculated fields)│
        │    │ isActive              │  │
        │    └──────────────────────┘  │
        │                              │
        │                    (references)
        │                              │
        │                              ▼
        └──────────────────────┬────────────────────┐
                               │                    │
                               │                    │
                    (contains many)                 │
                               │                    │
                               ▼                    ▼
                      ┌──────────────────────┐
                      │   FeedChart          │
                      ├──────────────────────┤
                      │ _id                  │
                      │ userId (Index)       │
                      │ name (Unique)        │
                      │ numberOfAnimals      │
                      │ feedItems Array []   │
                      │   ├─ feedItemId ─────┴─────── FeedItem
                      │   ├─ quantityPerTime
                      │   └─ numberOfTimesPerDay
                      │ isTemplate           │
                      │ isActive             │
                      └──────────────────────┘
```

---

## API Endpoint Structure

```
/api/feed-categories
├─ POST /          → Create
├─ GET /           → List all
├─ GET /:id        → Get one
├─ PUT /:id        → Update
└─ DELETE /:id     → Delete

/api/feed-items
├─ POST /          → Create (with validation)
├─ GET /           → List (with filters: category, isActive)
├─ GET /:id        → Get one
├─ PUT /:id        → Update (with validation)
└─ DELETE /:id     → Delete (cascade to calculations)

/api/feed-calculations
├─ POST /          → Create (with auto-calculation)
├─ GET /           → List (with filters: feedChartId, isActive)
├─ GET /:id        → Get one
├─ PUT /:id        → Update (with recalculation)
├─ DELETE /:id     → Delete
└─ POST /calculate/preview → Preview without saving

/api/feed-charts
├─ POST /          → Create (with validation)
├─ GET /           → List (with filters: isTemplate, isActive)
├─ GET /:id        → Get one
├─ PUT /:id        → Update
├─ DELETE /:id     → Delete
└─ GET /:id/calculations → Get detailed breakdown (10/20/30 days)
```

---

## Calculation Engine

```
┌─────────────────────────────────────────┐
│  calculateFeedMetrics() Function         │
├─────────────────────────────────────────┤
│                                         │
│  Input:                                 │
│  - feedItem (with pricePerBag, qty)     │
│  - quantityPerTime                      │
│  - numberOfTimesPerDay                  │
│  - numberOfAnimals                      │
│                                         │
│  Processing:                            │
│  1. Calculate daily quantity            │
│     = quantityPerTime ×                 │
│       numberOfTimesPerDay ×             │
│       numberOfAnimals                   │
│                                         │
│  2. For each period (10, 20, 30 days):  │
│     a. Calculate period quantity        │
│        = daily × days                   │
│     b. Calculate bags needed            │
│        = CEILING(quantity / bagSize)    │
│     c. Calculate cost                   │
│        = bags × pricePerBag             │
│                                         │
│  Output:                                │
│  {                                      │
│    quantityPerDay,                      │
│    quantityPer10Days,                   │
│    quantityPer20Days,                   │
│    quantityPer30Days,                   │
│    costPer10Days,                       │
│    costPer20Days,                       │
│    costPer30Days,                       │
│    bagsRequired10Days,                  │
│    bagsRequired20Days,                  │
│    bagsRequired30Days                   │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## Validation Pipeline

```
Client-Side Validation (React)
│
├─ validateFeedItem()
│  ├─ Name not empty
│  ├─ Quantity > 0
│  └─ Price > 0
│
├─ validateCalculation()
│  ├─ FeedItem selected
│  ├─ Quantity > 0
│  ├─ Times/day between 1-10
│  └─ Animals > 0
│
└─ validateForm() (Charts)
   ├─ Name not empty
   ├─ Animals > 0
   └─ At least 1 item

   ↓ (Form submission)

Server-Side Validation (Express/Mongoose)
│
├─ Route Handler Validation
│  ├─ Check auth
│  ├─ Check required fields
│  ├─ Check positive numbers
│  ├─ Enum validation
│  └─ User ownership
│
└─ Model Validation
   ├─ Schema validators
   ├─ Index constraints (unique)
   ├─ Min/max validators
   └─ Enum validators

   ↓ (If valid)

Database (MongoDB)
│
└─ Store document
```

---

## Export Flow

```
User clicks "Export CSV" / "Export PDF"
│
▼
Collect data from calculations
│
├─ For CSV:
│  ├─ Flatten object structure
│  ├─ Create rows/columns
│  └─ Generate CSV string
│
└─ For PDF:
   ├─ Format data for PDF layout
   ├─ Add headers/totals
   └─ Generate PDF buffer
│
▼
Use exportUtils functions
│  ├─ exportToCSV()
│  └─ exportToPDF()
│
▼
Trigger browser download
│
▼
File saved to user's device
```

---

## Security Architecture

```
┌──────────────────────────────────┐
│     Helmet Middleware             │
│  (Security headers)               │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│     CORS Middleware               │
│  (Cross-origin control)           │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│     Authentication Middleware     │
│  (JWT token validation)           │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│     Route Handler                 │
│  ├─ Input validation              │
│  ├─ UserId check                  │
│  ├─ Database validation           │
│  └─ Response formatting           │
└──────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│     MongoDB Operation             │
│  ├─ User isolation                │
│  ├─ Index enforcement             │
│  └─ Cascade delete                │
└──────────────────────────────────┘
```

---

## Performance Optimization

```
Client-Side:
├─ Component state management
├─ Lazy loading of components
├─ Memoization for expensive calculations
└─ Efficient re-renders

Server-Side:
├─ Database indexes on frequent queries
├─ Efficient population of references
├─ Lean queries for read-only operations
└─ Proper error handling

Database:
├─ Indexed queries
│  ├─ userId (all queries)
│  ├─ userId + category (feed items)
│  └─ userId + feedChartId (calculations)
├─ Denormalization where needed
└─ Cascade deletes to prevent orphans
```

---

## Error Handling Flow

```
User Action
│
▼
Client Validation
├─ If invalid: Display error message → STOP
└─ If valid: Proceed to server

   ▼

Server Validation
├─ Check auth
├─ Validate input
├─ Check user ownership
├─ Validate enum values
├─ Check for duplicates (unique indexes)
│
├─ If invalid:
│  └─ Return 400/404 error → Display in UI
│
└─ If valid: Proceed to operation

   ▼

Database Operation
├─ Execute query/update
│
├─ If error:
│  ├─ Duplicate key error → "Already exists"
│  ├─ Validation error → "Invalid data"
│  └─ Other error → "Server error"
│
└─ If success: Return data

   ▼

Response to Client
└─ Update UI / Display success message
```

---

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable design patterns
- ✅ Security at multiple layers
- ✅ Data integrity through validation
- ✅ Performance optimization
- ✅ Error handling and recovery
- ✅ User data isolation
- ✅ Easy maintenance and extension
