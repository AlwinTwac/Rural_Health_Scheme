# Setup Guide - Rural Health Scheme

## Quick Start

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Access the Application

Open your browser to: `http://localhost:3000`

## Development

### Frontend Development
- Edit files in `src/` directory
- Hot reload is enabled - changes appear instantly
- Build for production: `npm run build`

### Backend Development
- Edit files in `backend/` directory
- Flask auto-reloads in debug mode
- API available at: `http://localhost:5000/api`

## Testing the System

### Test Dashboard
1. Navigate to Dashboard
2. View mock statistics and active requests
3. Check system health indicators

### Test Request Management
1. Go to "Active Requests"
2. Click on any request to view details
3. Try accepting/completing requests

### Test Trip Planner
1. Navigate to "Trip Planner"
2. Select multiple requests
3. Click "Optimize Route"
4. View optimized sequence and statistics

### Test Patient Records
1. Go to "Patients"
2. Search for patients
3. View detailed medical history

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is in use:
- Frontend: Edit `vite.config.js` to change port
- Backend: Edit `app.py` to change port

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Recreate Python venv
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### CORS Errors
Ensure backend is running and CORS is enabled in `app.py`

## Next Steps

1. **Integrate Zigbee Hardware**: Connect Raspberry Pi devices
2. **Set up Database**: Replace mock data with SQLite/PostgreSQL
3. **Deploy**: Use production build and proper server setup
4. **Security**: Add authentication and encryption
5. **Testing**: Implement unit and integration tests

## Production Deployment

### Build Frontend
```bash
npm run build
```
Output will be in `dist/` directory

### Run Backend in Production
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Serve with Nginx
Configure Nginx to serve frontend and proxy API requests to backend.
