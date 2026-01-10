
### Cartographers Score Card

This is a score card for the board game ***Cartographers*** by Thunderworks Games.

[[Get the board game](https://www.thunderworksgames.com/cartographers.html)].

The score cards should let you play remotely, with a zoom/skype/hangouts call for the actual, like, human interaction part -- someone to flip and show the cards, etc.

[[Go to the score card](https://chardila.github.io/cartographers/)]

## Development Setup

This project uses Vite for development and building.

### Prerequisites
- Node.js (v14 or higher)
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

3. **Configure Firebase**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials in `.env`
   ```bash
   cp .env.example .env
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

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
