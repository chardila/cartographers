
### Cartographers Score Card

This is a score card for the board game ***Cartographers*** by Thunderworks Games.

[[Get the board game](https://www.thunderworksgames.com/cartographers.html)].

The score cards should let you play remotely, with a zoom/skype/hangouts call for the actual, like, human interaction part -- someone to flip and show the cards, etc.

[[Go to the score card](https://chardila.github.io/cartographers/)]

## Development Setup

This project uses Vite for development and building, with automated deployment to GitHub Pages via GitHub Actions.

### Prerequisites
- Node.js (v20 or higher)
- npm

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/chardila/cartographers.git
   cd cartographers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase (Local Development)**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials in `.env`
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```
   The production build will be in the `dist/` folder.

## Deployment to GitHub Pages

This project uses **GitHub Actions** for automated deployment. Every push to the `master` branch triggers a build and deployment.

### Initial Setup (One-time)

1. **Configure Repository Secrets**
   
   Go to your repository on GitHub:
   - Navigate to: `Settings` → `Secrets and variables` → `Actions`
   - Click `New repository secret`
   - Add each of these secrets with your Firebase values:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

   ⚠️ **Important**: These must be **Repository Secrets** under Actions, NOT Environment variables.

2. **Enable GitHub Pages**
   - Go to: `Settings` → `Pages`
   - Under "Source", select: **GitHub Actions**
   - Save the settings

### Deploying Updates

Simply push to the `master` branch:
```bash
git add .
git commit -m "Your changes"
git push
```

The GitHub Actions workflow will automatically:
1. Build the project with your Firebase credentials from secrets
2. Deploy the `dist/` folder to GitHub Pages

You can monitor the deployment progress in the `Actions` tab of your repository.

### Troubleshooting Deployment

If the site fails to load after deployment:
- Verify secrets are configured in `Settings` → `Secrets and variables` → **Actions** (not Environments)
- Check that GitHub Pages source is set to **GitHub Actions**
- Review the workflow run logs in the `Actions` tab
- See `TROUBLESHOOTING.md` for detailed debugging steps

**Included stuff ...**  

- a slightly modified version of Alexey Kryazhev's [[ispinjs](https://github.com/uNmAnNeR/ispinjs)] library.

- Many of the tile patterns are from Lea Verou's amazing [[gallery](https://leaverou.github.io/css3patterns/)] of CSS gradients.

- Google's [[Firebase](https://firebase.google.com/)], to network players together.
 
- Valve's creepy [[fingerprint2](https://github.com/Valve/fingerprintjs2/)] broswer tracker.  This is to make (mostly) unique id's for players without their need to do anything.  This lets lots of players call themselves short normal names like "Ed", instead of "Ed__234567".

**Code Style, compatibility**

The project has been modernized to use Vite and ES Modules, while maintaining the original ES5-style JavaScript for the core game logic. The app is organized into discrete files for better maintainability, sharing state through global objects:

```javascript  
constants = { ... }   
methods = { ... }  
uxState = { ... } 
```

Due to the libraries involved, `ISpin`, `Fingerprint2` and `firebase` are also global objects. 
