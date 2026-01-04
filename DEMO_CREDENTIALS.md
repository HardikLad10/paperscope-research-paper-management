# 🚀 PaperScope - Live Demo Access

## Application URL

**Live Application:** [https://paperscope-frontend-ahrq6r24nq-uc.a.run.app](https://paperscope-frontend-ahrq6r24nq-uc.a.run.app)

**Login Page:** [https://paperscope-frontend-ahrq6r24nq-uc.a.run.app/login](https://paperscope-frontend-ahrq6r24nq-uc.a.run.app/login)

---

## 🔑 Demo Login Credentials

### Primary Demo Account (Reviewer)

- **Username:** `U001`
- **Password:** `Emery@123`
- **User:** Emery Thomas
- **Role:** Reviewer (can review papers)

### Additional Test Accounts

- **Username:** `U002` | **Password:** `Edsger@123` (Edsger Dijkstra)
- **Username:** `U003` | **Password:** `Grace@123` (Grace Hopper - Reviewer)
- **Username:** `U005` | **Password:** `Liskov@123` (Barbara Liskov - Reviewer)

---

## 📋 What You Can Test

### 1. **Paper Management**
- Search and browse papers
- View paper details with PDF links
- Create new papers
- Edit existing papers
- Delete papers (with authorization checks)

### 2. **Author Insights**
- Navigate to "Author Insights" page
- View comprehensive statistics:
  - Total papers authored
  - Total reviews received
  - Average reviews per paper
  - Top 5 most reviewed papers
  - Year-wise publication breakdown
  - Status distribution

### 3. **My Papers Portfolio**
- View all papers you've authored
- See co-author information
- Review counts per paper
- Project associations

### 4. **AI-Powered Recommendations**
- Click on any paper to view details
- See "Related Papers" section
- AI generates 5-10 fictional paper recommendations
- Create draft papers from AI suggestions

### 5. **Batch Paper Creation** (Advanced Feature)
- Navigate to "Batch Other Authors' Papers"
- Create multiple papers in a single transaction
- Demonstrates ACID compliance with rollback on errors
- Uses `SELECT FOR UPDATE` for concurrency control

### 6. **Peer Review System**
- Navigate to "Review Papers" page
- View papers available for review
- Submit reviews with comments
- View review history

---

## 🎯 Key Features to Highlight

### Database Engineering
- **4 ACID-compliant transactions** ensuring data integrity
- **4 stored procedures** for complex business logic
- **3 database triggers** enforcing validation rules
- **5 CHECK constraints** ensuring data quality
- **Advanced SQL:** SELECT FOR UPDATE, composite subqueries, GROUP BY aggregations

### AI/ML Integration
- **Google Gemini 2.5 Flash LLM** integration
- Semantic similarity analysis for paper recommendations
- AI-generated draft paper creation workflow

### Full-Stack Architecture
- **25+ RESTful API endpoints**
- **React frontend** with 7+ pages
- **MySQL database** with 8 normalized tables
- **Cloud deployment** on GCP Cloud Run

---

## 🔧 Technical Stack

- **Frontend:** React 18.2 + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL 8.0+ (GCP Cloud SQL)
- **AI:** Google Vertex AI (Gemini 2.5 Flash)
- **Deployment:** Google Cloud Platform (Cloud Run)
- **Authentication:** Session-based (localStorage)

---

## 📝 Notes for Reviewers

1. **This is a production demo** - All features are fully functional
2. **Database is live** - Changes persist across sessions
3. **AI recommendations** may take a few seconds to load (LLM API call)
4. **Batch operations** demonstrate transaction rollback on errors
5. **All code is available** in this repository

---

## 🐛 Troubleshooting

If you encounter any issues:

1. **Clear browser cache** and try again
2. **Check browser console** for any errors
3. **Verify you're using the correct credentials** (case-sensitive)
4. **Try a different browser** if issues persist

---

## 📞 Contact

For questions about the application or technical details, please refer to:
- **README.md** - Full project documentation
- **PROJECT_SUMMARY_RESUME_READY.md** - Comprehensive technical summary
- **GitHub Repository:** [https://github.com/HardikLad10/paperscope-research-paper-management](https://github.com/HardikLad10/paperscope-research-paper-management)

---

**Last Updated:** December 2024  
**Status:** ✅ Live and Operational

