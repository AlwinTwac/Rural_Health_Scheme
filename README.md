# Connected Rural Mobile Health Scheme - Internet Free

A comprehensive desktop interface for managing rural healthcare delivery through an internet-free mesh network system.

## 🏥 Overview

This system provides a modern React frontend and Python backend for the Central Hub of the Rural Mobile Health Scheme. It enables medical professionals to:

- **Monitor patient requests** in real-time via Zigbee mesh network
- **Optimize travel routes** using AI-powered trip planning
- **Manage patient records** and medical history
- **Track vital signs** from household devices
- **Monitor system health** including network status and device connectivity

## 🚀 Features

### Frontend (React + Vite)
- **Dashboard**: Real-time overview of active requests, statistics, and system health
- **Request Management**: View, accept, and manage patient requests with vital signs
- **AI Trip Planner**: Optimize routes based on severity, distance, and time
- **Patient Records**: Comprehensive medical history and vitals tracking
- **System Health**: Monitor mesh network, devices, and hub status
- **Modern UI**: Built with TailwindCSS, Recharts, and Lucide icons

### Backend (Python + Flask)
- **RESTful API**: Complete API for all frontend operations
- **Trip Optimization**: AI-powered algorithm for route planning
- **Data Models**: Pydantic models for type safety
- **Zigbee Integration**: Ready for mesh network communication (to be implemented)

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Git**

## 🛠️ Installation

### Frontend Setup

```bash
# Navigate to project directory
cd Rural_Health_Scheme

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

The backend API will be available at `http://localhost:5000`

## 📁 Project Structure

```
Rural_Health_Scheme/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (Sidebar, Header)
│   │   └── ui/              # Reusable UI components
│   ├── pages/               # Main application pages
│   ├── lib/
│   │   ├── api.js          # API client
│   │   └── utils.js        # Utility functions
│   ├── store/
│   │   └── useStore.js     # Zustand state management
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── backend/
│   ├── app.py              # Flask application
│   ├── models.py           # Data models
│   ├── trip_optimizer.py   # AI route optimization
│   └── requirements.txt    # Python dependencies
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Key Technologies

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Flask** - Web framework
- **Pydantic** - Data validation
- **NumPy** - Numerical computing
- **SQLite** - Database (development)

## 🔌 API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `GET /api/patients/:id/vitals` - Get patient vitals history

### Requests
- `GET /api/requests` - Get all requests
- `GET /api/requests/active` - Get active requests
- `POST /api/requests/:id/accept` - Accept a request
- `POST /api/requests/:id/complete` - Complete a request

### Trip Planning
- `POST /api/trips/optimize` - Optimize route for selected requests
- `GET /api/trips/current` - Get current active trip

### System
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/system` - Get system health metrics
- `GET /api/devices` - Get all devices status

## 🎯 Usage

### Starting the Application

1. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start Frontend** (in a new terminal):
   ```bash
   npm run dev
   ```

3. **Access Application**:
   Open your browser to `http://localhost:3000`

### Key Workflows

#### Managing Patient Requests
1. Navigate to "Active Requests"
2. View all pending requests with vital signs
3. Click on a request to see detailed information
4. Accept request to start visit or use Trip Planner for multiple visits

#### Optimizing Routes
1. Go to "Trip Planner"
2. Select multiple requests to include
3. Click "Optimize Route" to generate optimal path
4. Review statistics and start trip

#### Viewing Patient Records
1. Navigate to "Patients"
2. Search for specific patient
3. Click to view full medical history and vitals trends

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///rural_health.db
ZIGBEE_PORT=COM3
ZIGBEE_BAUDRATE=115200
```

## 📊 System Architecture

```
┌─────────────────┐
│  Household      │
│  Devices        │◄────┐
│  (Raspberry Pi) │     │
└─────────────────┘     │
                        │ Zigbee
┌─────────────────┐     │ Mesh
│  Household      │     │ Network
│  Devices        │◄────┤
└─────────────────┘     │
                        │
        ┌───────────────▼──────────────┐
        │   Central Hub Computer       │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  Python Backend        │  │
        │  │  - Flask API           │  │
        │  │  - Trip Optimizer      │  │
        │  │  - Data Management     │  │
        │  └────────────────────────┘  │
        │                              │
        │  ┌────────────────────────┐  │
        │  │  React Frontend        │  │
        │  │  - Dashboard           │  │
        │  │  - Request Management  │  │
        │  │  - Trip Planner        │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
```

## 🚧 Future Enhancements

- [ ] Zigbee hardware integration
- [ ] Real-time WebSocket updates
- [ ] Advanced AI trip optimization
- [ ] Offline-first PWA capabilities
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Starlink integration for external sync
- [ ] Mobile companion app

## 📝 License

This project is part of the University of Zimbabwe research initiative.

## 👥 Contributors

- Manyatera - University of Zimbabwe

## 📞 Support

For questions or support, please contact the University of Zimbabwe Department of Health Informatics.

---

**Note**: This is a proof-of-concept system. For production deployment, ensure proper security measures, database setup, and hardware integration are in place.
