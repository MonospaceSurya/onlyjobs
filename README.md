# 🚀 MyTech Forum (Stack Overflow Clone)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13.x-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-^5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-^3.0-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-^6.0-green?logo=mongodb)](https://www.mongodb.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)](https://clerk.com/)

A full-stack Q&A platform inspired by Stack Overflow, built with the modern Next.js App Router, MongoDB, Tailwind CSS, and Clerk for authentication. Ask questions, share knowledge, and connect with a community of tech enthusiasts!

**✨ Live Demo:** [Link to your deployed Vercel app (e.g., mytech-forum.vercel.app)](https://your-deployment-link.vercel.app) *(Replace or remove if not deployed)*
**🔧 Repository:** [Link to your GitHub repository](https://github.com/your-username/your-repo-name) *(Replace with your actual link)*

---

## 🌟 Features

*   **❓ Question & Answers:** Post questions with details (using a rich text editor) and provide answers.
*   **🏷️ Tagging System:** Organize questions with relevant tags. Browse questions by tag.
*   **⬆️ Voting System:** Upvote/downvote questions and answers to highlight quality content.
*   **💾 Saved Questions:** Bookmark interesting questions for later reference (Collections).
*   **👤 User Profiles:** View user profiles, contributions, reputation, and badges.
*   **🛠️ Profile Editing:** Users can update their profile information (name, username, bio, links).
*   **🔐 Authentication:** Secure user sign-up and sign-in powered by Clerk.
*   **🌍 Community Page:** Discover other users and contributors.
*   **🔍 Global Search:** Search across questions, answers, users, and tags.
*   **📄 Pagination:** Efficiently load lists of questions, answers, users, and tags.
*   **☀️ Dark/Light Mode:** Theme switching for user preference.
*   **📱 Responsive Design:** Adapts to various screen sizes.
*   **(Potentially Removed/Disabled) 💼 Job Board:** (Included in original code) A section to browse job listings.
*   **(Potentially Removed/Disabled) 🤖 AI Answer Generation:** (Included in original code) Option to generate answer suggestions using AI (OpenAI/Gemini).

---

## 🖼️ Screenshots

*(Add your screenshots here!)*

*Example:*
![Screenshot of the Home Page](https://via.placeholder.com/600x400/cccccc/969696.png?text=HomePage+Screenshot)
_Fig. 1 - Home Page displaying questions_

![Screenshot of a Question Page](https://via.placeholder.com/600x400/cccccc/969696.png?text=QuestionPage+Screenshot)
_Fig. 2 - Detailed Question View with Answers_

---

## 🛠️ Tech Stack

**Frontend:**

*   **Framework:** Next.js 13+ (App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn/ui
*   **Forms:** React Hook Form + Zod
*   **Rich Text Editor:** TinyMCE
*   **State:** React Context API (Theme), Server Components
*   **Auth Client:** Clerk (@clerk/nextjs)

**Backend:**

*   **Framework:** Next.js (API Routes / Server Actions)
*   **Language:** TypeScript
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **Auth Server:** Clerk (@clerk/nextjs/server)
*   **Webhook Verification:** Svix

**Deployment:**

*   **Platform:** Vercel (or your platform)
*   **Database Hosting:** MongoDB Atlas (or your provider)

---

## ⚙️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env.local` file in the root directory.
    *   Add the following variables (get keys from respective services):
        ```dotenv
        # Clerk Keys (https://dashboard.clerk.com)
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
        CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY

        # MongoDB Connection String (e.g., from MongoDB Atlas)
        MONGODB_URL=mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority

        # Clerk Webhook Signing Secret (From Clerk Dashboard -> Webhooks -> Your Endpoint)
        NEXT_CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

        # TinyMCE API Key (https://www.tiny.cloud/)
        NEXT_PUBLIC_TINY_EDITOR_API_KEY=YOUR_TINYMCE_API_KEY

        # --- Optional: Only if using AI Generation ---
        # OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
        # GOOGLE_GEMINI_API_KEY=YOUR_GEMINI_KEY
        ```

4.  **Set up Clerk Webhook:**
    *   You need a public URL for Clerk to send webhooks.
    *   **For Local Dev:** Use `ngrok` to tunnel your local port (e.g., `ngrok http 3000`).
    *   **For Production:** Use your deployed application URL.
    *   Go to your Clerk Dashboard -> Webhooks -> Add Endpoint.
    *   Enter the URL (`<your-public-url>/api/webhook`).
    *   Select events: `user.created`, `user.updated`, `user.deleted`.
    *   Create the endpoint and copy the **Signing Secret** into your `.env.local` (for local) or Vercel environment variables (for production) as `NEXT_CLERK_WEBHOOK_SECRET`.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  Configure the **Environment Variables** in the Vercel project settings (copy values from your `.env`, **not** `.env.local`). Make sure `NEXT_CLERK_WEBHOOK_SECRET` uses the secret for your *production* webhook endpoint URL.
4.  Deploy! Vercel should automatically detect Next.js and build the project.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.

---

## 🙏 Acknowledgements

*   Stack Overflow (Inspiration)
*   Next.js Team
*   Clerk Team
*   MongoDB Team
*   Tailwind Labs
*   Shadcn
*   TinyMCE
*   *(Add any other libraries/resources you relied on)*

---

*Created by [Your Name/Handle](https://github.com/your-username)*
