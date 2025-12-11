# 🚀 Xandeum Web Analytics

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production%20ready-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Real-time Network Explorer & Analytics Dashboard for Xandeum Decentralized Storage Network**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Xandeum Web Analytics is a modern **Web-based Analytics Dashboard** that enables real-time monitoring of the Xandeum decentralized storage network. It provides deep insights into the health, distribution, and performance of Provider Nodes (pNodes) by syncing directly with the Xandeum Devnet via JSON-RPC.

---

## ✨ Features

- ✅ **Real-time Monitoring** - Live cluster node tracking with auto-sync (1-minute interval).
- 🌐 **Blockchain Integration** - Direct connection to Xandeum Network via JSON-RPC.
- 💾 **Data Persistence** - MongoDB integration for historical data and time-series analytics.
- 🎨 **Beautiful UI** - Modern glassmorphism dashboard with smooth animations.
- 🔌 **RESTful API** - Full-featured API with CORS support.

---

## 🚀 Quick Start

### Prerequisites

- Git (for cloning the repository)
- Node.js (version 18.x or higher, LTS recommended)
- npm (version 9.x or higher)
- MongoDB (version 6.x or higher)
- `lsof` (for `start-app.sh` script to manage processes, usually pre-installed on Unix-like systems)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd xandeum-web-analytics

# Install backend dependencies
cd backend
npm install
```

### Running the Application

To start both the backend API and the Next.js frontend dashboard, use the provided `start-app.sh` script.

1.  **Start MongoDB** (ensure it's running locally).

2.  **Run the script**:
    ```bash
    ./start-app.sh
    ```
    This script will:
    - Automatically clean up any existing processes on ports 3000 and 3001.
    - Start the Backend API (NestJS) on `http://localhost:3001`.
    - Start the Frontend Dashboard (Next.js) on `http://localhost:3000`.
    - Provide instructions on how to stop all processes.

---

## 📚 Documentation

For detailed information about the system architecture, API endpoints, database schema, data flow, and testing procedures, please refer to the full documentation:

👉 **[Read the Complete Documentation](docs/Documentation.md)**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
