# UniVerse - Campus Companion

A modern, frontend-only web application for university students to manage attendance, events, and lost & found items.

## Features

- **Authentication**: Simple login system with localStorage persistence
- **Dashboard**: View attendance trends with interactive charts, upcoming events count, and lost items overview
- **Events Management**: Browse and add campus events with dates and club information
- **Lost & Found**: Report and track lost or found items across campus
- **Responsive Design**: Beautiful, mobile-friendly interface using modern CSS
- **No Backend**: Fully functional as a frontend-only application with localStorage for data persistence

## Project Structure

```
├── index.html              # Login page
├── dashboard.html          # Main dashboard with attendance chart
├── events.html             # Events management page
├── lostfound.html          # Lost and found items page
├── css/
│   └── style.css           # All styling (mobile responsive)
├── js/
│   ├── auth.js             # Authentication and navbar logic
│   ├── dashboard.js        # Dashboard initialization and chart
│   ├── events.js           # Events management
│   └── lostfound.js        # Lost and found management
├── data/
│   ├── marks.json          # Sample attendance data
│   ├── events.json         # Sample events data
│   └── lostfound.json      # Sample lost/found items data
└── README.md               # This file
```

## How It Works

### Authentication
- Users login on the index page with a username
- Username is stored in localStorage under `universe_user`
- Protected pages redirect to login if no username is found
- Logout removes the stored username and redirects to login

### Data Persistence
- **Events**: Stored in localStorage under `universe_events`
- **Lost & Found**: Stored in localStorage under `universe_lostfound`
- **Attendance Data**: Fetched from `data/marks.json` with fallback sample data
- **Reload Sample**: Button resets data to original JSON files

### Dashboard
- Displays statistics cards for attendance percentage, upcoming events, and lost items
- Uses Chart.js (CDN) to visualize attendance trends
- Automatically calculates stats from fetched data
- Falls back to sample data if JSON files are unavailable

## Getting Started

### Local Development

1. Clone or download the repository
2. Open a local server (required for fetch to work):
   ```bash
   # Using Python 3 (default port 8000)
   python -m http.server 8000
   
   # Using Python 3 (custom port 8080)
   python -m http.server 8080
   
   # Using Python 2 (default port 8000)
   python -m SimpleHTTPServer 8000
   
   # Using Python 2 (custom port 8080)
   python -m SimpleHTTPServer 8080
   
   # Using Node.js with http-server (default port 8080)
   npx http-server
   ```
3. Navigate to the URL shown in your terminal:
   - Python default: `http://localhost:8000`
   - Python with 8080: `http://localhost:8080`
   - Node.js: `http://localhost:8080` (or as displayed in terminal)
4. Login with any username or use "Demo User"

**Note**: The port number may vary depending on availability. Check the terminal output when starting the server to see which port it's running on. If port 8000 is busy, try using port 8080 or higher.

### GitHub Pages Deployment

1. Create a GitHub repository (or use existing one)
2. Push all files to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" and choose `main` (or `master`) branch
5. Your site will be live at `https://yourusername.github.io/repository-name`

**Note**: CORS restrictions may affect JSON fetching on GitHub Pages if served from a different domain. The application includes fallback data to handle this gracefully.

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and CSS Grid
- **JavaScript (Vanilla)**: No frameworks or build tools
- **Chart.js 3.9.1**: For attendance trend visualization (via CDN)
- **localStorage**: For client-side data persistence

## Features Explained

### Login Page
- Simple username-based authentication
- Two options: Enter custom username or use Demo User
- Responsive design with gradient background

### Dashboard
- **Attendance Card**: Shows average attendance percentage
- **Events Card**: Counts upcoming events
- **Lost Items Card**: Shows count of lost items
- **Attendance Chart**: Interactive line chart showing weekly attendance trends

### Events
- Add new events with title, date, and optional club name
- View all events in a card grid layout
- Reload Sample button resets to original data
- Data persists in localStorage

### Lost & Found
- Report lost or found items
- Specify location where item was lost/found
- Mark as "Lost" or "Found" with color-coded badges
- Delete items individually
- Reload Sample button resets to original data
- Data persists in localStorage

## Sample Data

The application includes sample data for all sections:
- **Attendance**: 8 weeks of attendance percentages (85-94%)
- **Events**: 5 sample campus events with dates and club affiliations
- **Lost & Found**: 5 sample items with locations and types

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (uses modern ES6 features)

## Notes for GitHub Pages

- All paths use relative URLs for compatibility
- Chart.js is loaded via CDN (requires internet connection)
- If JSON files cannot be fetched (CORS), fallback data is automatically used
- All data is stored locally in the browser - nothing is sent to servers

## Customization

### Changing Colors
Edit the CSS variables in `css/style.css`:
- Primary color: `#667eea` (purple)
- Accent color: `#764ba2` (dark purple)
- Text color: `#333`
- Background: `#f5f7fa`

### Adding More Sample Data
Edit the JSON files in the `data/` folder:
- `marks.json`: Add more weeks/percentages
- `events.json`: Add more events
- `lostfound.json`: Add more items

### Modifying Form Fields
Update the HTML form in respective pages and the JavaScript handlers in `js/events.js` or `js/lostfound.js`.

## License

This is a demo application for educational purposes.

## Support

For issues or questions, check that:
1. You're running a local server (fetch requires http://)
2. Browser console shows no errors
3. JavaScript is enabled
4. Browser is not in private mode (may affect localStorage)

---

**UniVerse** - Making campus life easier, one click at a time! 🎓
