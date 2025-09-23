# 🏆 Gamification With GitHub projects – PoC

This is a **proof of concept** that transforms your GitHub workflow into a shared, visual XP tracker. Designed for teams working together in the same physical space, this project introduces light gamification to modern knowledge work — turning daily effort into a collective journey.

## ✨ What It Is

A static web dashboard (hosted via GitHub Pages) that:

- Tracks completed issues and assigns XP based on custom templates
- Automatically levels up the team with celebratory sounds and confetti
- Displays a live leaderboard with GitHub avatars
- Collects and displays visual achievements (badges) in a scrollable gallery
- Deploys an `/experimental` build from the `Experimental` branch for testing

Ideal for running on a screen in a team room — encouraging celebration, progress, and a bit of fun competition.

---

## 💡 Why?

> _"Work doesn't need to be soulless to be professional."_

This project aims to gently restore a sense of momentum and shared purpose in teams. It adds visibility to the invisible: the effort behind closed issues, completed tasks, and quiet contributions.  
Gamification isn't about trivializing work — it's about **recognizing progress** and inviting joy.

---

## 🔧 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JoachimHolseterBouvet/Gamification-With-GitHub-Projects.git
cd Gamification-With-GitHub-Projects
```

### 2. Provide a GitHub Token (optional but recommended)

The dashboard fetches badge images from the GitHub REST API. Anonymous requests
are rate limited to 60 per hour, which can cause `403` errors if the page polls
often. To increase the limit, supply a personal access token:

1. Create a token on GitHub with read-only repository access.
2. Pass the token in the page URL, e.g. `?token=YOURTOKEN`, or store it in your
   browser using the console:

   ```javascript
   localStorage.setItem('github_token', 'YOURTOKEN');
   ```

The script will automatically use the token for authenticated requests.

## 🙌 Contributions

Contributions are welcome — whether it's new features, better visuals, or anything else. This is an open experiment in making digital workspaces just a little more human.

---

## 🎧 Credits

- **Sound effects** used in this project are sourced from [Pixabay](https://pixabay.com/) and are royalty-free.
  - These sounds remain free to use, but attribution is appreciated.
