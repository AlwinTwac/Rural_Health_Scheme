# 🚀 Quick Start Guide - Rural Health Scheme

## Prerequisites
✅ Node.js installed
✅ Python 3.12+ installed
✅ Laragon with MySQL running on port 1429
✅ Image `stethoscope2.png` in `/public` folder

## 🎯 Start in 3 Steps

### 1. Setup Database
```bash
# In HeidiSQL or MySQL client:
CREATE DATABASE rural_health;
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend will auto-create tables and default admin user.

### 3. Start Frontend
```bash
npm run dev
```

## 🔐 Login
Navigate to: http://localhost:3000

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

## ✨ Features

### Login Page Animations
- 🩸 **Blood Cells**: Flowing red blood cells with realistic pulsing
- 🌈 **Sine Waves**: 8 spectrum-colored waves flowing at the bottom
- 🖼️ **Background**: Medical stethoscope image
- 💎 **Glassmorphism**: Modern frosted glass UI

### Dashboard Features
- 🌓 **Dark Mode**: Toggle in header
- 🎨 **Medical Theme**: Teal/cyan color scheme
- 📊 **Real-time Monitoring**: System health and network status
- 🚑 **Patient Management**: Request handling and trip planning
- 🔒 **Secure**: JWT authentication with MySQL

## 🎨 Theme Colors
- **Light Mode**: Soft slate backgrounds (#f1f5f9)
- **Dark Mode**: Deep slate (#0f172a)
- **Primary**: Medical teal (#06b6d4)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

## 📱 Responsive Design
Works on desktop, tablet, and mobile devices.

## 🔧 Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MySQL: localhost:1429

## 📚 Documentation
- `LOGIN_SETUP.md` - Detailed authentication setup
- `DARK_MODE_CHANGES.md` - Theme customization
- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Complete setup instructions

## 🎯 What's Next?
1. Change default admin password in Settings
2. Add patient records
3. Configure Zigbee devices (future)
4. Customize trip optimization parameters

Enjoy your Rural Health Management System! 🏥
