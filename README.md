# SmartMatch

A roommate-matching platform for American University of Nigeria (AUN) students, built as a 3-person senior design project.

**Live site:** https://zen-oasis-2cebd.web.app

Students sign up, fill in a lifestyle profile, and get ranked roommate matches based on how compatible their habits are. They can view each other's profiles, chat in real time, and report problems to the housing administrators.

## Features

- **Sign up and sign in** with Firebase Authentication
- **Lifestyle profile:** cleanliness, noise tolerance, how social you are, budget, study time, interests and deal-breakers
- **Weighted compatibility matching:** each potential roommate gets a 0–100 compatibility score, and matches are ranked by it
- **Real-time chat** between matched students
- **Admin dashboard** for reviewing user reports

## How matching works

The compatibility algorithm draws on two ideas from environmental psychology:

- **Similarity–attraction:** people tend to get along better with others who share their habits and preferences.
- **Person–environment fit:** wellbeing is higher when someone's living environment matches their needs.

The score compares four factors: **cleanliness**, **noise tolerance**, **social level** and **budget**. Each answer is put on a 0–1 scale, and the closer two students' answers are, the higher their similarity on that factor. Each student also says how much each factor matters to them, and those importance weights decide how much each factor counts. The weighted similarities are combined into a single score from 0 to 100. Study time, interests and deal-breakers are shown on each match so students can judge the rest themselves.

## Tech stack

- **Frontend:** React, TypeScript, React Router, Tailwind CSS (built with Vite)
- **Backend:** Firebase Authentication and Cloud Firestore (real-time listeners power the chat), plus a small Express server
- **Hosting:** Firebase Hosting

## Team & my contributions

SmartMatch was built by a team of three as our senior design project at AUN. The original repository is [osawxse/smartmatchv1](https://github.com/osawxse/smartmatchv1).

My contributions:

- Designed the weighted compatibility algorithm, grounded in similarity–attraction and person–environment fit theory, scoring compatibility across cleanliness, noise tolerance, social level and budget, weighted by each student's own priorities.
- Built the in-app real-time chat and the admin reporting dashboard.
- Modeled the platform's data: users, profiles, matches, conversations with their messages, and reports.

## Running locally

Requires Node.js 18+ and a Firebase project.

```sh
npm install
npm run dev
```

Firebase settings go in `.env` (see the `VITE_FIREBASE_*` variables there).
